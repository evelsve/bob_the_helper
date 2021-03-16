import "./styles.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { MachineConfig, Machine, send, Action, assign, State } from "xstate";
import { useMachine, asEffect } from "@xstate/react";
import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
import { inspect } from "@xstate/inspect";
// Welcome to the machines
import { dmMachine1 } from "./dmAppointment";
import { dmMachine2 } from "./dmTimer";
import { dmMachine3 } from "./dmToDo";
import { dmMachine4 } from "./dmSmartHome";


inspect({
    url: "https://statecharts.io/inspect",
    iframe: false
});

// FOR ABSTRACTING

export function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

export function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}


export function promptAndAsk(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: 'ask' }
            },
            ask: {entry: send('LISTEN')}}
    })
}

export function misUnderstood(saythis: any, on_help: any): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
        prompt: {
            entry: say(saythis),
            on: { ENDSPEECH: "ask" }
        },
        ask: { 
            entry: listen()
        },
        nomatch: {
            entry: say("Sorry, I do not understand."),
            on: { ENDSPEECH: "prompt" }
        },
        help: {
            entry: say("We may be miscommunicating. Let's take a step back"),
            on: { ENDSPEECH: on_help }
        }
}})}

export function Endings(saythis: string, on_end:string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({        
        initial: "prompt",
        states: {
            idle: {},
            prompt: {
                entry: say(saythis),
                on: { ENDSPEECH: on_end }}
            }    
        })}

const saySnippet: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `${context.snippet}`
}))

//  GRAMMAR

const grammar: { [index: string]: {approval?:  boolean } } = 
{  "of course": { approval: true },
    "yes": { approval: true },
    "yeah": { approval: true },
    "yup": { approval: true },
    "sure": { approval: true },
    "no": { approval: false },
    "nah": { approval: false },
    "nope": { approval: false }}



//  MAIN MACHINE

const machine = Machine<SDSContext, any, SDSEvent>({
    id: 'root',
    type: 'parallel',
    states: {
        // ____________
        initial_welcome: {
            initial: 'idle',
            states: {
                // ...
                idle: {on: {CLICK: 'welcome'}},
                // ...
                welcome: {
                    on: {
                        RECOGNISED: {
                            target: "query",
                            actions: assign((context) => { return { option: context.recResult } }),
                        }},
                    ...promptAndAsk("What do you want to do?")
                },
                // ...
                query: {
                    invoke: {
                        id: 'rasa',
                        src: (context, _event) => nluRequest(context.option),
                        onDone: {
                            actions: [assign((_context, event) => { return  {option: event.data.intent.name} }), 
                            (_context: SDSContext, event: any) => console.log(event.data)],
                            target: "distributor"
                        },
                        onError: {
                            target: 'welcome',
                            actions: (_context, event) => console.log(event.data)}
                    }
                },
                // ...
                distributor: {
                    initial: "prompt",
                    on: {
                        ENDSPEECH: [
                            {cond: (context) => context.option === 'todo_on'|| context.option === 'todo_off', target: ["#root.dm3.denial", "idle"] },
                            {cond: (context) => context.option === 'timer_on' || context.option === 'timer_off', target: ["#root.dm2.denial", "idle"] },
                            {cond: (context) => context.option === 'appointment_on', target: ["#root.dm1.who", "idle"]},
                            {cond: (context) => context.option === 'smart_on', target: ["#root.dm4.welcome", "idle"]},
                            {cond: (context) => context.option === 'help_on', target: "help"},
                            {cond: (context) => context.option === 'appointment_off', target: "other"}]
                        },
                    states: {
                        prompt: {
                            entry: send((_context) => ({type: "SPEAK", value: `Understood.`})),
                        }
                    }
                },
                // ...
                help: {
                    on: {
                        RECOGNISED: [
                            {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
                            actions: assign((_context) => { return { approval: true } }),
                            target: "welcome"},

                            {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
                            actions: assign((_context) => { return { approval: false} }),
                            target: "goodbye"},]  
                    },
                ...promptAndAsk("Would you like to start over?")
                },
                // ...
                other: {...Endings("This function has not been developed", "#root.initial_welcome.help")
                },
                // ...
                goodbye: {...Endings("Thank you for using Bot Chatbotterson. Goodbye.","#root.initial_welcome")}
            },
        },            
        // ____________
        dm1: {
        ...dmMachine1
        },
        // ____________
        dm2: {
        ...dmMachine2
        },
        // ____________
        dm3: {
        ...dmMachine3
        },
        // ____________
        dm4: {
        ...dmMachine4
        },
        asrtts: {
            initial: 'idle',
            states: {
                // ...
                idle: {
                    on: {
                        LISTEN: 'recognising',
                        SPEAK: {
                            target: 'speaking',
                            actions: assign((_context, event) => { return { ttsAgenda: event.value } })
                        }
                    }
                },
                // ...
                recognising: {
		            initial: 'progress',
                    entry: 'recStart',
                    exit: 'recStop',
                    on: {
                        ASRRESULT: {
                            actions: ['recLogResult',
                                assign((_context, event) => { return { recResult: event.value } })],
                            target: '.match'
                        },
                        RECOGNISED: 'idle'
                    },
                    states: {
		    	        progress: {
			            },	    					
                        match: {
                            entry: send('RECOGNISED'),
                        },
                    }
                },
                // ...
                speaking: {
                    entry: 'ttsStart',
                    on: {
                        ENDSPEECH: 'idle',
                    }
                }
            }    
        }
    }
},
    {
        actions: {
            recLogResult: (context: SDSContext) => {
                /* context.recResult = event.recResult; */
                console.log('<< ASR: ' + context.recResult);
            },
            test: () => {
                console.log('test')
            },
            logIntent: (context: SDSContext) => {
                /* context.nluData = event.data */
                console.log('<< NLU intent: ' + context.nluData.intent.name)
            }
        }
    });




interface Props extends React.HTMLAttributes<HTMLElement> {
    state: State<SDSContext, any, any, any>;
}
const ReactiveButton = (props: Props): JSX.Element => {
    switch (true) {
        case props.state.matches({ asrtts: 'recognising' }):
            return (
                <button type="button" className="glow-on-hover"
                    style={{ animation: "glowing 20s linear" }} {...props}>
                    Listening...
                </button>
            );
        case props.state.matches({ asrtts: 'speaking' }):
            return (
                <button type="button" className="glow-on-hover"
                    style={{ animation: "bordering 1s infinite" }} {...props}>
                    Speaking...
                </button>
            );
        default:
            return (
                <button type="button" className="glow-on-hover" {...props}>
                    Click to start
                </button >
            );
    }
}

function App() {
    const { speak, cancel, speaking } = useSpeechSynthesis({
        onEnd: () => {
            send('ENDSPEECH');
        },
    });
    const { listen, listening, stop } = useSpeechRecognition({
        onResult: (result: any) => {
            send({ type: "ASRRESULT", value: result });
        },
    });
    const [current, send, service] = useMachine(machine, {
        devTools: true,
        actions: {
            recStart: asEffect(() => {
                console.log('Ready to receive a command.');
                listen({
                    interimResults: false,
                    continuous: true
                });
            }),
            recStop: asEffect(() => {
                console.log('Recognition stopped.');
                stop()
            }),
            ttsStart: asEffect((context, effect) => {
                console.log('Speaking...');
                speak({ text: context.ttsAgenda })
            }),
            ttsCancel: asEffect((context, effect) => {
                console.log('TTS STOP...');
                cancel()
            }),
        },
    });


    return (
        <div className="App">
            <ReactiveButton state={current} onClick={() => send('CLICK')} />
        </div>
    )
};


/* RASA API
 *  */
const proxyurl = "https://cors-anywhere.herokuapp.com/";
const rasaurl = 'https://ap-ti-do.herokuapp.com/model/parse'
export const nluRequest = (text: string) =>
    fetch(new Request(proxyurl + rasaurl, {
        method: 'POST',
        headers: { 'Origin': 'http://localhost:3000/' },
        body: `{"text": "${text}"}`
    }))
        .then(data => data.json());

const rootElement = document.getElementById("root");
ReactDOM.render(
    <App />,
    rootElement);



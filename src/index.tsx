import "./styles.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { MachineConfig, Machine, send, Action, assign, State } from "xstate";
import { useMachine, asEffect } from "@xstate/react";
import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
import { inspect } from "@xstate/inspect";

// auto-open this asshole: https://cors-anywhere.herokuapp.com/corsdemo

import { dmMachine1 } from "./dmPositive";
import { dmMachine2 } from "./dmNegative";




// NOTE: We created separate grammars for the machines to 
// find answers in the most efficient way possible
export const grammar: { [index: string]: {approval?:  boolean } } = 
        {  "of course": { approval: true },
        "yes of course": { approval: true },
        "yes": { approval: true },
        "yeah": { approval: true },
        "yup": { approval: true },
        "sure": { approval: true },
        // --
        "no": { approval: false },
        "nah": { approval: false },
        "nope": { approval: false },
        "no way": { approval: false },
        "not sure": { approval: false },
        "of course not": { approval: false}

        }

export const url_grammar: { [index: string]: {url:  string } } = 
        {  "rock": { url: 'https://www.youtube.com/watch?v=A0QkGThnKNQ' },
        "metal": { url: 'https://www.youtube.com/watch?v=xnKhsTXoKCI&list=PLhQCJTkrHOwSX8LUnIMgaTq3chP1tiTut' },
        "punk": { url: 'https://www.youtube.com/watch?v=xPxsS_-LTe0&list=PLvP_6uwiamDS23WxoCfqY4LBOXF_yF1l9' },
        "rap": { url: 'https://www.youtube.com/watch?v=5qm8PH4xAss&list=PLvuMfxvpAQrkzez9insKS8cGPU74sK1Ss' },
        "lo-fi": { url: 'https://www.youtube.com/watch?v=5qap5aO4i9A'},
        "house": { url: 'https://www.youtube.com/watch?v=cna6C24AJkU' },
        "techno": { url: 'https://www.youtube.com/watch?v=bC9_OKu6nBQ' },
        "country": { url: 'https://www.youtube.com/watch?v=kI24NNjz2j8' }
        // ...          
}


export const finished: { [index: string]: {finished?:  boolean } } = 
        {  "finished": { finished: true },
           "done": { finished: true },
           "I've done the task": { finished: true },
           "I'm finished": { finished: true }
           // ...          
}

export const bye: { [index: string]: {bye?:  boolean } } = 
        {  "quit": { bye: true },
           "turn off": { bye: true },
           "bye": { bye: true },
           "goodbye": { bye: true }
           // ...          
}

// window.open("https://cors-anywhere.herokuapp.com/corsdemo")
// window.open("https://statecharts.io/inspect")

inspect({
    url: "https://statecharts.io/inspect",
    iframe: false
});


// NOTE: created as much universal functions as possible

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
            ask: {entry: send('LISTEN')}
        }
    })
}

export function promptHelpBye(prompt: string, idled: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: 'ask' }
            },
            ask: {entry: send('LISTEN')
            },
            help: {
                entry: say("We may be miscommunicating."),
                on: { ENDSPEECH: [idled,"#root.init.help"] }
            },
            goodbye:{
                entry: say(""),
                on: { ENDSPEECH: [idled,"#root.init.goodbye" ] }
            }
    }}
)}


export function Endings(saythis: string, on_end:string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({        
        initial: "prompt",
        states: {
            prompt: {
                entry: send(({type: "SPEAK",
                    value: saythis})),
                 on: { ENDSPEECH: on_end }
            }
        }    
    }
)}

export function Queries(ondone: string, onerror:string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
            invoke: {
                id: 'rasa',
                src: (context, event) => nluRequest(context.option),
                onDone: {
                    actions: [assign((context, event) => { return  {option: event.data.intent.name} }), 
                    (context: SDSContext, event: any) => console.log(event.data)],
                    target: ondone
                },
                onError: {
                    target: onerror,
                    actions: (context, event) => console.log(event.data)}
                }
            }
)}

export function Conditional(cond1: string, target1: string, cond2: string, target2: string, elses: string, idles: string, saythis: string,): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: "prompt",
                on: {
                    ENDSPEECH: [
                            {cond: (context) => context.option === cond1, target: target1},
                            {cond: (context) => context.option === cond2, target: target2},
                            {cond: (context) => context.option === 'help', target: [idles,"#root.init.help"]},
                            {cond: (context) => context.option === 'bye', target: [idles,"#root.init.goodbye"]},
                            { target: elses }] 
                        
                    },
                states: {
                    prompt: {
                        entry: send(({type: "SPEAK", value: saythis})),
                    }
                }
            }
)}


const saySnippet: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `${context.snippet}`
}))


const machine = Machine<SDSContext, any, SDSEvent>({
    id: 'root',
    type: 'parallel',
    states: {
        // ____________
        init: {
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
                    ...promptAndAsk("Good morning. How are you?")
                },
                query: {...Queries("distributor",'welcome')},
                // ...
                distributor: {
                    initial: "prompt",
                    on: {
                        ENDSPEECH: [
                            {cond: (context) => context.option === 'positive', target: ["#root.dm1.positive", "idle"]},
                            {cond: (context) => context.option === 'negative', target: ["#root.dm2.negative", "idle"]},
                            {cond: (context) => context.option === 'todo', target: ["#root.dm1.create_do", "idle"]},
                            // REMINDER: delete answer after retraining
                            {cond: (context) => context.option === 'ideas', target: ["#root.dm1.create_ideas", "idle"]},
                            {cond: (context) => context.option === 'answer', target: "bob"}, 
                            {cond: (context) => context.option === 'bob', target: "bob"},
                            {cond: (context) => context.option === 'neutral', target: "neutral"},
                            {cond: (context) => context.option === 'music', target: ["#root.dm2.negative.choose_music", "idle"]},
                            {cond: (context) => context.option === 'games', target: ["#root.dm2.negative.choose_game", "idle"]},
                            {cond: (context) => context.option === 'entertain', target: ["#root.dm2.negative.load_entertainment", "idle"]},

                            {cond: (context) => context.option === 'help', target: "help"},

                            {target: "goodbye"} ]
                        },
                    states: {
                        prompt: {
                            entry: say('Ok.')
                        }
                    }
                },
                // ...
                bob: {
                // NOTE:
                // This part could be developed more, into a seperate machine
                // where the user could try out the limits of adaptivity of this DS
                    on: {
                        RECOGNISED: {
                            target: "query",
                            actions: assign((context) => { return { option: context.recResult } }),
                        }},
                    ...promptAndAsk("I am Bob the Helper. I am limited. Tell me what you'd like to do.")
                },
                // ...
                neutral: {
                // NOTE: 
                // We are aware that this is not efficient.
                // We tried this part to see how the machines interact between themselves. 
                // For educational purposes only.
                    on: {
                        RECOGNISED: {
                            target: "#root.dm2.negative.choose_music",
                            actions: assign((context) => { return { option: context.recResult } }),
                        }},
                    ...promptAndAsk("You seem lost. What about listening to some music?")
                },
                // ...
                help: {
                    on: {
                        RECOGNISED: [
                            {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
                            target: "bob"},

                            {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
                            target: "goodbye"},

                            {target: "bob"}]  
                    },
                ...promptAndAsk("I feel lost. Would you like to start over?")
                },
            //     // ...
                goodbye: {...Endings("Happy to help out. See you later.","#root.init")}
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
                    ...
                </button>
            );
        case props.state.matches({ asrtts: 'speaking' }):
            return (
                <button type="button" className="glow-on-hover"
                    style={{ animation: "bordering 1s infinite" }} {...props}>
                    
                </button>
            );
        default:
            return (
                <button type="button" className="glow-on-hover" {...props}>
                    Click on me
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
            changeColour: asEffect((context) => {
                console.log('Repainting...');
                document.body.style.background = context.recResult;
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
const rasaurl = 'https://mood-admin.herokuapp.com/model/parse'
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



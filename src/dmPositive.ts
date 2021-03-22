import { MachineConfig, send, assign } from "xstate";
import { Queries, Conditional, promptAndAsk, Endings, promptHelpBye, say, grammar } from "./index";



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

const help_commands = ["help", "I don't know", "help me", "I need help", "what does this mean", "wait what", "what do you mean"]

export function Prompt_Nomatch_Timeout(prompt: string, no_match:string, timeout=5000): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
	initial: 'prompt',
	states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: 'ask' }
            },
            ask: {
                entry: [send('LISTEN'), send('MAXSPEECH', {delay: timeout , id: 'timeout'})]
            },
            nomatch: {
                entry: say(no_match),
                on: { ENDSPEECH: "prompt" }
            }}})
}

export const gram: { [index: string]: {finished?:  boolean } } = 
         {  "finished": { finished: true },
            "done": { finished: true },
            "I've done the task": { finished: true }
            // ...          
}

let num = 0

export const dmMachine1: MachineConfig<SDSContext, any, SDSEvent> = ({
    // NOTE: regarding the queries:
    // There are more efficient ways to implement them, however, 
    // Yet we decided to have a grammar as well as querying in order to see
    // which implementation will yield better results
    initial: 'idle',
    states: {
        // ...
        idle: {},
        // ...
        positive: {
            initial: "quest1",
            states: {
                // .... // ...
                quest1: {
                    on: {
                        RECOGNISED: 
                            [
                            {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
                            target: "#root.dm1.create_do"},

                            {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
                            target: "#root.dm1.if_ideas"},

                            {target:'#root.dm1.others'}
                            ]
                        },
                    ...promptAndAsk("I suppose you could do something productive. Do you agree?")
                },
                // .... // ...
                quest2: {
                    on: {
                        RECOGNISED: {
                            target: '#root.dm1.query3',
                            actions: assign((context) => { return { option: context.recResult } }),
                        }},
                        ...promptAndAsk("So what would you like to do?")
                    }
                }
            },
            // ....
            query1: {...Queries('conditional1',"#root.init.help")},
            // ....
            conditional1: {...Conditional('agree', "create_do", 'disagree', "#root.dm1.if_ideas", "#root.dm1.others", '#root.dm2.idle', `Ok.`)},
            // ....
            query3: {...Queries("#root.init.distributor", "#root.init.help")},
            //...
            create_do:{
                initial: "prompt",
                on: {
                    RECOGNISED: {
                        actions: assign((context) => { return { task: context.recResult } }),
                        target: "to_do"}
                    },
                    ...promptAndAsk("Tell me the things you have to accomplish.")
            },
            // ...
            to_do: {
                initial: "prompt",
                states: {
                    prompt: {
                        entry: send((context) => ({delay:12000,
                            type: "SPEAK",
                            value:`Now go and complete the following tasks: ${context.task}` })),
                            on: { ENDSPEECH: '#root.dm1.wait'},  
                        }
                    }
            },
            // ...
            if_ideas: {
                on: {
                    RECOGNISED: {
                        target: '#root.dm1.query2',
                        actions: assign((context) => { return { option: context.recResult } }),
                    }},
                ...promptAndAsk("Then how about working on your ideas?")
            },
            // ....
            query2: {...Queries('conditional2',"#root.init.help")},
            // ....
            conditional2: {...Conditional('agree', "create_ideas", 'disagree', "#root.dm1.positive.quest2", "#root.dm1.others", '#root.dm2.idle', `Cool.`)},
            // ...
            create_ideas:{
                initial: "prompt",
                on: {
                    RECOGNISED: {
                        target: "idea",
                        actions: assign((context) => { return { idea: context.recResult } }),
                    }},
                    ...promptAndAsk("Tell me your idea.")
                },
            // ...
            idea: {
                initial: "prompt",
                // on: {ENDSPEECH: ['#root.dm1.idle']},
                    states: {
                        prompt: {
                            entry: send((context) => ({
                                type: "SPEAK",
                                value:`You should work on your idea of ${context.idea}.` })),
                            on: { ENDSPEECH: '#root.dm1.wait'}
                            }
                }
            },
            // ...
            wait: {
                initial: "prompt",
                on: {
                    RECOGNISED: [
                        {cond: (context) => gram[context.recResult] !== undefined && gram[context.recResult].finished === true,
                        target: "done"},

                        {cond: (context) => gram[context.recResult] !== undefined && gram[context.recResult].finished === false,
                        target: "wait"},
                        {target: 'wait'}]  
                },
            ...promptAndAsk("Say 'finished', when you're done")
            },
            // ...
            done: {
                initial: "prompt",
                    states: {
                        prompt: {
                            entry: say("Good job."),
                            on: { ENDSPEECH: {target: '#root.init.goodbye'}},
                        }
                    }
            },
            // ...
            others: {
                initial: "prompt",
                // on: {ENDSPEECH: '#root.goodbbye'},
                    states: {
                        prompt: {
                            entry: say("mmm, you said something strange"),
                            on: { ENDSPEECH: '#root.dm1.positive.quest2'},
                        }
                    }
            }
    }}
)
















// ONLY DRAFTS




// done: {...Endings("Congratulations on your accomplishment!","#root.init")},

          // annoy:{
            //     initial: "prompt",
            //     on: {
            //         RECOGNISED: [
            //             {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
            //             target: "done"},

            //             {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
            //             target: ".wait"}],
                    
            //         // WAIT: '.wait'

            //         }
            //     },

             // ...
            // annoy: {
            //     initial: "prompt",
            //     on: {
            //         RECOGNISED: [
            //             {cond: (context) => context.option === 'agrreement', target: "done"},

            //             {cond: (context) => context.option === 'disagreement', target: ".wait"},
                        
            //             {target: ".wait"}], 

            //         WAIT: '.prompt'
            //     },
            //     states: {
            //         prompt: {
            //             entry: say("Have you done your task yet?"),
            //             on: { ENDSPEECH: "ask" }
            //         },
            //         ask: {
            //             entry: [ send('LISTEN'), send('WAIT', {delay: 5000})]
            //         },
            //         // wait2: {entry: [ send('WAIT', {delay: 3000})]},
            //         wait: {
            //             entry: [
            //                 say('Hm.')
            //             ],
            //             on: {
            //                 ENDSPEECH: [
            //                     {cond: () => (num++) <= 2, target: 'prompt'},
            //                     {target: '#root.dm1.done'}
            //                 ]
            //             }
            //         }
            //     }
            // },


            // ----

            // quest1: {
                //     on: {
                //         RECOGNISED: [
                //                 {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
                //                 actions: assign((context) => { return { approval: true } }),
                //                 target: "#root.dm1.create_do"},
            
                //                 {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
                //                 actions: assign((context) => { return { approval: false} }),
                //                 target: "#root.dm1.if_ideas"},

                //                 {target: "#root.dm1.done.others"}

                //                 // {cond: (context) => context.option === 'help', target: '.help'}
                //                 ]
                //         },
                //         ...promptHelpBye("I suppose you could do something productive. Do you agree?")
                //         },\



                // ------

                // done: {
                //     initial: "prompt",
                //     // on: {ENDSPEECH: ['#root.dm1.idle']},
                //         states: {
                //             prompt: {
                //                 entry: say("Congratulations on your accomplishment! Here's a reward"),
                //                 on: { ENDSPEECH: ['#root.dm1.idle', '#root.init.help.goodbye']}
                //         }, 
                //             others: {
                //                 entry: say("Ummm, you said something strange"),
                //                 on: { ENDSPEECH: '#root.dm1.positive.quest2'}
                //                 }
                //         }
                //     }   


                // ------


                // idea: {
                //     initial: "prompt",
                //     // on: {ENDSPEECH: ['#root.dm1.idle']},
                //         states: {
                //             prompt: {
                //                 entry: send((context) => ({
                //                     type: "SPEAK",
                //                     value:`You should work on your idea of ${context.idea}. Say 'finished', when you're done` })),
                //                 on: { ENDSPEECH: ['#root.dm1.idea_wait']}
                //             // },
                //     //         elevator: {
                //     //             entry: send(openInNewTab('https://www.youtube.com/watch?v=VBlFHuCzPgY&t=3s&ab_channel=AntoineB')),
                //     //             on: { ENDSPEECH: '#root.dm1.idea_wait'}
                //                 }
                //     }
                // }

                // ------

            // annoy: {
            //     initial: "prompt",
            //     on: {
            //         RECOGNISED: {
            //             target: "conditional3",
            //             actions: assign((context) => { return { option: context.recResult } }),
            //         },
            //         WAIT: 'wait'
            //     },
            //     states: {
            //         prompt: {
            //             entry: say("Let me know when you're done."),
            //             on: { ENDSPEECH: "ask" }
            //         },
            //         ask: {
            //             entry: [
            //                 send('LISTEN'),
            //                 send('WAIT', {delay: 10000})
            //             ]
            //         }
            //     }
            // },
            // ...
            // wait: {
                
            //     entry: [say('Have you done your task yet?')],
            //     on: {
            //         ENDSPEECH: [
            //             {cond: () => (num++, 1) <= 5, target: 'conditional3'},
            //             {target: '#root.dm1.idea_wait'}
            //         ]
            //     }
            // },
            // conditional3: {...Conditional('agreement', "#root.dm1.done", 'disagreement', "#root.dm1.annoy", "#root.dm1.annoy", '#root.dm1.idle', `Mhm.`)},


            // -----

                // ...
                // full_annoy:{
                //     initial: 'annoy',
                //     on: { 
                //         // RECOGNISED: {
                //         //         cond: (context) => help_commands.includes(context.recResult),
                //         //         target: '#root.init.help'
                //         //             },
    
                //         MAXSPEECH: [
                //             { 
                //                 cond: (context) => context.count < 5,
                //                 target: '#root.dm1.idea_wait'},
    
                //                 {cond: (context) => context.count == null,
                //                 actions: assign((context)=>{return {count: Number(0)}}),
                //                 target: '#root.dm1.maxspeech'}],
                //             },
                //     states:{
                //         hist:{type: 'history'},
                //         // .... // ...
                //         annoy: {
                //             on: {
                //                 RECOGNISED: [{
                //                     cond: (context) => "finished" in (gram[context.recResult] || {}),
                //                     actions: assign((context) => { return { finished: gram[context.recResult].finished } }),
                //                     target: "#root.dm1.done"}]
        
                //                 // },
                //                 // { cond: (context) => !(help_commands.includes(context.recResult)),
                //                 //     target: ".nomatch" }]
                //             },
                //             ...Prompt_Nomatch_Timeout('Have you done your task yet?', "Sorry I don't understand"),
                //         }
                // },
                // // ....
                // },
                // // ... 
                // maxspeech:{
                //     initial: 'prompt',
                //     on: {
                //         ENDSPEECH: {
                //             actions: assign((context)=> {return {count: context.count+1 }}),
                //             target: 'full_annoy.hist'
                //                 }
                //             },
                //             // target: 'fill_appointment_info.hist'
                //         states: {
                //             prompt: {entry: say('I AM A STUPID BOT ')}
                //     }
                // },

                // ...

                            // ..
        //     wait: {
        //         initial: 'prompt',
        //         on: { ENDSPEECH: '#root.dm1.annoy'},
        //         states: {
        //             prompt: {
        //                 entry: say("M."),
        //                 // on: { ENDSPEECH: "#root.dm1.annoy" }
        //             },
        //             // ask: {
        //             //     entry: [
        //             //         send('LISTEN'),
        //             //         send('WAIT', {delay: 10000})
        //             //     ]}
        //             }
        // },
        //     // ...
        //     annoy: {
        //         initial: "prompt",
        //         on: {
        //             RECOGNISED: {
        //                 target: "conditional3",
        //                 actions: assign((context) => { return { option: context.recResult } }),
        //             },
        //             WAIT: 'wait'
        //         },
        //         states: {
        //             prompt: {
        //                 entry: say("Have you finished your task?"),
        //                 on: { ENDSPEECH: "ask" }
        //             },
        //             ask: {
        //                 entry: [
        //                     send('LISTEN'),
        //                     send('WAIT', {delay: 10000})
        //                 ]
        //             }
        //         }
        //     },
            // conditional3: {...Conditional('agreement', "#root.dm1.done", 'disagreement', "#root.dm1.wait", "#root.dm1.annoy", '#root.dm1.idle', `Oh`)},
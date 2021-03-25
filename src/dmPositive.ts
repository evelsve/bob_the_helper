import { MachineConfig, send, assign } from "xstate";
import { Queries, bye, Conditional, promptAndAsk, finished, promptHelpBye, say, grammar } from "./index";






// export function promptHelpBye(prompt: string, idled: string): MachineConfig<SDSContext, any, SDSEvent> {
//     return ({
//         initial: 'prompt',
//         states: {
//             prompt: {
//                 entry: say(prompt),
//                 on: { ENDSPEECH: 'ask' }
//             },
//             ask: {entry: send('LISTEN')
//             },
//             help: {
//                 entry: say("We may be miscommunicating."),
//                 on: { ENDSPEECH: [idled,"#root.init.help"] }
//             },
//             goodbye:{
//                 entry: say(""),
//                 on: { ENDSPEECH: [idled,"#root.init.goodbye" ] }
//             }
//     }}
// )}





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

                            {cond: (context) => bye[context.recResult] !== undefined && bye[context.recResult].bye === false,
                            target: "#root.dm1.if_ideas"},

                            // {cond: (context) => context.option === 'help', target: ".help"},
                            // {cond: (context) => context.option === 'bye', target: ".goodbye"},
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
            conditional1: {...Conditional('agree', "create_do", 'disagree', "#root.dm1.if_ideas", "#root.dm1.others", '#root.dm1.idle', `Ok.`)},
            // ....
            query3: {...Queries("#root.init.distributor", "#root.init.help")},
            //...
            create_do:{
                initial: "prompt",
                on: {
                    RECOGNISED: 
                        {actions: assign((context) => { return { task: context.recResult } }),
                        target: "to_do"}
                    },
                    ...promptHelpBye("Tell me the things you have to accomplish.", '#root.dm1.idle')
            },
            // ...
            to_do: {
                initial: "prompt",
                states: {
                    prompt: {
                        entry: send((context) => ({
                            type: "SPEAK",
                            value:`Now go and complete the following tasks: ${context.task}` })),
                            on: { ENDSPEECH: '#root.dm1.wait'},  
                        }
                    }
            },
            // ...
            if_ideas: {
                // Note to self: help/bye implemented (uses conditional)
                on: {
                    RECOGNISED: [
                        {target: '#root.dm1.query2',
                        actions: assign((context) => { return { option: context.recResult } })},
                        
                        {target:'#root.dm1.others'}
                    ]},
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
                        {cond: (context) => finished[context.recResult] !== undefined && finished[context.recResult].finished === true,
                        target: "done"},

                        {cond: (context) => finished[context.recResult] !== undefined && finished[context.recResult].finished === false,
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
                            entry: say("Good job. Time to relax."),
                            on: { ENDSPEECH: {target: '#root.dm1.positive.quest2'}},
                        }
                    }
            },
            // ...
            others: {
                initial: "prompt",
                // on: {ENDSPEECH: '#root.goodbbye'},
                    states: {
                        prompt: {
                            entry: say("Umm, you said something strange"),
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
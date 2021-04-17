import { MachineConfig, send, assign } from "xstate";
import { Queries, bye, Conditional, promptAndAsk, finished, promptHelpBye, say, grammar } from "./index";


export const dmMachine1: MachineConfig<SDSContext, any, SDSEvent> = ({
    // NOTE: 
    // Goodbye is implemented via grammar, when a grammar is used as a conditional
    // or in the conditionals/distributor, when uses intents.
    // Both in to-do and idea neither of the two functions (goobye and help) are not working
    // as the machine is only listening for the input, and "spewing" it back at the user
    // without any conditions.

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

                            {cond: (context) => bye[context.recResult] !== undefined && bye[context.recResult].bye === true,
                            target: ["#root.dm1.idle", "#root.init.goodbye"]},

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
            others: {
                initial: "prompt",
                    states: {
                        prompt: {
                            entry: say("Umm, you said something strange"),
                            on: { ENDSPEECH: '#root.dm1.positive.quest2'},
                        }
                    }
            },
            // ...
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
            }
    }}
)






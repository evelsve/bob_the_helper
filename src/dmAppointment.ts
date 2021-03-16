import { MachineConfig, send, assign } from "xstate";
import {say, listen, Endings, misUnderstood} from "./index";
// import { SimulatedClock } from 'xstate/lib/SimulatedClock'; // >= 4.6.0


// GRAMMAR

const grammar: { 
    [index: string]: {
        appointment?: string,
        to_do?: string,
        timer?: string,
        person?: string,
        day?: string,
        time?: string,
        approval?:  boolean,
    }} =  {
            // ___________________________________________
            "hairdresser": { person: "hairdresser" },
            "doctor": { person: "doctor" },
            "dentist": { person: "dentist" },
            "lawyer": { person: "lawyer" },
            "psychotherapist": { person: "psychotherapist" },
            "John": { person: "John Appleseed" },
            "Peter": { person: "Peter Horter" },
            "Jack": { person: "Jack Tomerson" },
            "Tom": { person: "Tom Peterson" },
            "Jill": { person: "Jill Panele" },
            "Jane": { person: "Jane Mayer" },
            "Anna": { person: "Anna Pana" },
            "Lora": { person: "Lora Cat" },
            // ___________________________________________
            "on Monday": { day: "Monday" },
            "on Tuesday": { day: "Tuesday" },
            "on Wednesday": { day: "Wednesday" },
            "on Thursday": { day: "Thursday" },
            "on Friday": { day: "Friday" },
            "on Saturday": { day: "Saturday" },
            "on Sunday": { day: "Sunday" },
            "on Monday next week": { day: "Monday next week" },
            "on Tuesday next week": { day: "Tuesday next week" },
            "on Wednesday next week": { day: "Wednesday next week" },
            "on Thursday next week": { day: "Thursday next week" },
            "on Friday next week": { day: "Friday next week" },
            "on Saturday next week": { day: "Saturday next week" },
            "on Sunday next week": { day: "Sunday next week" },
            // ___________________________________________
            "8": { time: "eight" },
            "9": { time: "nine" },
            "10": { time: "ten" },
            "11": { time: "eleven" },
            "at noon": { time: "twelve" },
            "12": { time: "twelve" },
            "1": { time: "thirteen" },
            "2": { time: "fourteen" },
            "3": { time: "fifteen" },
            "4": { time: "sixteen" },
            "5": { time: "seventeen" },
            "6": { time: "six" },
            "7": { time: "seven" },
            "8 15": { time: "eight fifteen" },
            "9 15": { time: "nine fifteen" },
            "10 15": { time: "ten fifteen" },
            "11 15": { time: "eleven fifteen" },
            "12 15": { time: "twelve fifteen" },
            "1 15": { time: "one fifteen" },
            "2 15": { time: "two fifteen" },
            "3 15": { time: "three fifteen" },
            "4 15": { time: "four fifteen" },
            "5 15": { time: "five fifteen" },
            "6 15": { time: "six fifteen" },
            "7 15": { time: "seven fifteen" },
            "8 30": { time: "half past eight" },
            "9 30": { time: "half past nine" },
            "10 30": { time: "half past ten" },
            "11 30": { time: "half past eleven" },
            "half past twelve": { time: "half past twelve" },
            "12 30 ": { time: "half past twlve" },
            "1 30": { time: "half past one" },
            "2 30": { time: "half past two" },
            "3 30": { time: "half past three" },
            "4 30": { time: "half past four" },
            "5 30": { time: "half past five" },
            "6 30": { time: "half past six" },
            "7 30": { time: "half past seven" },
            // ___________________________________________
            "of course": { approval: true },
            "yes": { approval: true },
            "yeah": { approval: true },
            "yup": { approval: true },
            "sure": { approval: true },
            "no": { approval: false },
            "nah": { approval: false },
            "nope": { approval: false }}


export const dmMachine1: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    states: {
        // ...
        idle: {},
        // ...
        who: {
            initial: "prompt",
            on: {
                RECOGNISED: [
                    {cond: (context) => "person" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { person: grammar[context.recResult].person } }),
                    target: "day"},

                    {cond: (context) => context.option === 'help_on', target: ".help"},

                    { target: ".nomatch" }],
            },
            ...misUnderstood(`Who are you meeting with?`,  ["#root.dm1.idle", "#root.initial_welcome.help"])
        },
        // ...
        day: {
            initial: "prompt",
            on: {
                RECOGNISED: [
                    {cond: (context) => "day" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { day: grammar[context.recResult].day } }),
                    target: "approval" },

                    {cond: (context) => context.recResult === "",
                    target: ".help" },

                    // {cond: (context) => , TIMING COND
                    // target: ".prompt" },

                    { target: ".nomatch" } ]
                    // WAITING: 500
                },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.person} it is. On which day is your meeting?`
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry, I do not understand"),
                    on: { ENDSPEECH: "prompt" }
                },
                help: {
                    entry: say("We may be miscommunicating. Let's take a step back"),
                    on: { ENDSPEECH: "#root.dm1.who" }
                }
            },
            // ...misUnderstood(`OK. ${context.person} it is. On which day is your meeting?`, "#root.dm1.who"),
        },
        // ...
        approval: {
            initial: "prompt",
            on: {
                RECOGNISED: [
                    {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
                    actions: assign((context) => { return { approval: true } }),
                    target: "summary_whole"},

                    {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
                    actions: assign((context) => { return { approval: false} }),
                    target: "time"},

                    {cond: (context) => context.recResult === "help",
                    target: ".help" },

                    { target: ".nomatch" }
                ]
                },
                // ...misUnderstood(`Ok, meeting on ${context.day}. Will it take the whole day?`, "#root.dm1.day")},
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Ok, meeting on ${context.day}. Will it take the whole day?`
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry, I do not understand"),
                    on: { ENDSPEECH: "prompt" }
                },
                help: {
                    entry: say("We may be miscommunicating. Let's take a step back"),
                    on: { ENDSPEECH: "#root.dm1.day" }
                }
            }
        },
        // ...
        time: {
            initial: "prompt",
            on: {
                RECOGNISED: [
                    {cond: (context) => "time" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { time: grammar[context.recResult].time } }),
                    target: "summary_time"},

                    {cond: (context) => context.recResult === "help",
                    target: ".help" },

                    { target: ".nomatch" }]
            },
        ...misUnderstood(`What time is your meeting?`, "#root.dm1.approval")},
        // ...
        summary_time: {
            initial: "prompt",
            on: {
                RECOGNISED: [
                    {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
                    actions: assign((context) => { return { approval: true } }),
                    target: "created"},

                    {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
                    actions: assign((context) => { return { approval: false } }),
                    target: "who"},

                    {cond: (context) => context.recResult === "help",
                    target: ".help" },

                { target: ".nomatch" }
            ]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time}?`
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry, I do not understand"),
                    on: { ENDSPEECH: "prompt" }
                },
                help: {
                    entry: say("We may be miscommunicating. Let's take a step back"),
                    on: { ENDSPEECH: "#root.dm1.approval" }
                }
            }
        },
        // ...
        summary_whole: {
            initial: "prompt",
            on: {
                RECOGNISED: [
                    {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
                    actions: assign((context) => { return { approval: true } }),
                    target: "created"},

                    {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
                    actions: assign((context) => { return { approval: false } }),
                    target: "who"},

                    {cond: (context) => context.recResult === "help",
                    target: ".help" },

                    { target: ".nomatch" }]
                },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?`})),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry, I do not understand"),
                    on: { ENDSPEECH: "prompt" }
                },
                help: {
                    entry: say("We may be miscommunicating. Let's take a step back"),
                    on: { ENDSPEECH: "#root.dm1.approval" }
                }
            }    
        },
        created: {...Endings("Your appoinment has been created","#root.initial_welcome.goodbye"), 
        // always: "idle"
        }
    }
})

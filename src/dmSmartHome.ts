import { MachineConfig, send, assign } from "xstate";
import {say, promptAndAsk } from "./index";
import { loadGrammar } from './runparser'
import { parse } from './chartparser'
import { grammar } from './grammars/orderGrammar'


const Order = (input: string) => {
    const gram = loadGrammar(grammar);
    const prs = parse(input.split(/\s+/), gram);
    const result = prs.resultsForRule(gram.$root)[0]
    const answer = result.order.action + result.order.object;
    return answer
}

export const dmMachine4: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    states: {
        idle: {},
        welcome: {
            initial: "prompt",
            on: { ENDSPEECH: "task" },
            states: {
                prompt: { entry: say("Welcome to Smart Home") }
            }
        },
        task: {
            initial: "prompt",
            on: {
                RECOGNISED: [
                    {cond: (context) => {return { order: Order(context.recResult) } !== undefined},
                    actions: assign((context) => {return { order: Order(context.recResult) }}),
                    target: 'perform'},

                    { target: "perform.nomatch" }]
                },
            ...promptAndAsk("I await for your orders.")
        },
        perform: {
            initial: "prompt",
            states: {
                prompt: 
                    { entry: send((context) => ({type: "SPEAK", value: `The task ${context.order} has been accomplished`}))},
                nomatch: {
                    entry: say("Sorry, I do not understand"),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        }
    }
})
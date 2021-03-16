import { MachineConfig } from "xstate";
import { Endings } from "./index";

export const dmMachine3: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    // on: { ENDSPEECH: "#root.initial_welcome.help"},
    states: {
        idle: {},
        denial: {...Endings("Welcome to To-do. It will be improved later.","#root.dm3.idle")},
}})

import { MachineConfig } from "xstate";
import { Endings } from "./index";

export const dmMachine2: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    states: {
        idle: {},
        denial: {...Endings("Welcome to Timer. It will be improved later.","#root.dm2.idle")},
}}) 


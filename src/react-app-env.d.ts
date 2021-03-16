/// <reference types="react-scripts" />

declare module 'react-speech-kit';

interface SDSContext {
    recResult: string;
    nluData: any;
    ttsAgenda: string;
    person: string,
    day: string,
    time: string,
    approval:  boolean,
    intentResult: any;
    query: string,
    snippet: string,
    option: string,
    order: string,
}

type SDSEvent =
    | { type: 'CLICK' }
    | { type: 'RECOGNISED' }
    | { type: 'ASRRESULT', value: string }
    | { type: 'ENDSPEECH' }
    | { type: 'LISTEN' }
    // | { type: 'RETRY' }
    // | { type: 'WAIT' }
    | { type: 'SPEAK', value: string };



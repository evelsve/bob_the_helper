/// <reference types="react-scripts" />

declare module 'react-speech-kit';

interface SDSContext {
    recResult: string;
    nluData: any;
    ttsAgenda: string;
    approval:  boolean,
    // intentResult: any;
    query: string,
    snippet: string,
    option: string,
    task: string,
    genre: string,
    idea: string,
    url: string,
    game: string,
    bye: number,
    finished: boolean
}

type SDSEvent =
    | { type: 'CLICK' }
    | { type: 'RECOGNISED' }
    | { type: 'ASRRESULT', value: string }
    | { type: 'ENDSPEECH' }
    | { type: 'LISTEN' }
    | { type: 'SPEAK', value: string };



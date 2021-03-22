import { MachineConfig, send, assign } from "xstate";
import {say, listen, promptAndAsk, grammar } from "./index";

// import { nluRequest } from './index'
// import { Endings } from './index'

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

const game_grammar: { [index: string]: {game: string} } =

{
    "shooting": {game: "https://www.miniclip.com/games/genre-5/shoot-em-up/en/"},
    "arcade": {game: "https://www.miniclip.com/games/genre-517/arcade/en/"},
    "racing": {game: "https://www.miniclip.com/games/genre-477/racing/en/"},
}

export function openInNewTab(user_input: string): any{ 
  return (window.open(user_input, '_blank'))
}

export const dmMachine2: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    states: {

        idle: {},
        negative: {
            initial: "music",
            states: {

                music: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [
                                {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
                                actions: assign((context) => { return { approval: true } }),
                                target: "#root.dm2.negative.choose_music"},
            
                                {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
                                actions: assign((context) => { return { approval: false} }),
                                target: "#root.dm2.negative.ask_game"},
                                {target: "#root.dm2.negative.music.ask_again"}

                                // {target: "#root.dm1.done.others"}

                                // {cond: (context) => context.option === 'help', target: '.help'}
                                ]
                        },
                        states: {
                            prompt: {
                                entry: say("I am sorry to hear that. Would you like to listen to some music?"),
                                on: {ENDSPEECH : "ask"}
                            },
                            ask: {
                                entry: send('LISTEN')
                            },
                            ask_again: {
                                entry: say('I am sorry, I could not understand you. Please repeat.'),
                                on: { ENDSPEECH: "ask"}
                            }
                        }
                        },

                choose_music: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [{
                            cond: (context) => url_grammar[context.recResult] !== undefined && "url" in (url_grammar[context.recResult] || {}), // It checks if url is in grammar
                            actions: assign((context) => { return { url: url_grammar[context.recResult].url } }), // The computer keeps the information in the object context
                            target: "#root.dm2.negative.load_music"},
                            {target: "#root.dm2.negative.choose_music.ask_again"}
                        ]
                    },
                    states: {
                        prompt: {
                            entry: say("Great, let's dance our troubles away! Which genre would you like to listen to?"),
                            on: {ENDSPEECH : "ask"}
                        },
                        ask: {
                            entry: send('LISTEN')
                        },
                        ask_again: {
                            entry: say('I am sorry, I could not understand you. Please repeat.'),
                            on: { ENDSPEECH: "ask"}
                        }
                    }
                },
                load_music: {
                    initial: 'prompt',
                    states: {
                        prompt: {
                            entry: say('Loading music for you! Dance your troubles away. I hope you feel better homie.'),
                            on: { ENDSPEECH: 'play'}
                        },
                        play: {
                            entry: send((context) => ({
                                ...openInNewTab(context.url)
                            })),
                            on: { ENDSPEECH: "#root.dm2.idle"}
                        }
                    },   
                },

                ask_game: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [{cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
                            actions: assign((context) => { return { approval: true } }),
                            target: "#root.dm2.negative.choose_game"},
        
                            {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
                            actions: assign((context) => { return { approval: false} }),
                            target: "#root.dm2.negative.entertainment"},
                            {target: "#root.dm2.negative.ask_game.ask_again"}]
                    },
                states: {
                    prompt: {
                        entry: say("Okay then. Let's play a game instead, what do you think?"),
                            on: {ENDSPEECH : "ask"}
                        },
                        ask: {
                            entry: send('LISTEN')
                        },
                        ask_again: {
                            entry: say('I am sorry, I could not understand you. Please repeat.'),
                            on: { ENDSPEECH: "ask"}
                    }
                }
                },

                choose_game: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [{
                            cond: (context) => game_grammar[context.recResult] !== undefined && "game" in (game_grammar[context.recResult] || {}), // It checks if url is in grammar
                            actions: assign((context) => { return { game: game_grammar[context.recResult].game } }), // The computer keeps the information in the object context
                            target: "#root.dm2.negative.load_game"},
                            {target: "#root.dm2.negative.choose_game.ask_again"}]
                    },
                    states: {
                        prompt: {
                            entry: say("Nice! You choose to play an arcade, shooting or racing game!"),
                                on: {ENDSPEECH : "ask"}
                            },
                            ask: {
                                entry: send('LISTEN')
                            },
                            ask_again: {
                                entry: say('I am sorry, I could not understand you. Please repeat.'),
                                on: { ENDSPEECH: "ask"}
                        }
                    }
                },

                load_game: {
                    initial: 'prompt',
                    states: {
                        prompt: {
                            entry: say('Loading game for you! I hope you feel better my G.'),
                            on: { ENDSPEECH: 'play'}
                        },
                        play: {
                            entry: send((context) => ({
                                ...openInNewTab(context.game)
                            })),
                            on: { ENDSPEECH: "#root.dm2.idle"}
                        }
                    },   
                },

                entertainment: {
                    initial: 'prompt',
                    on: {
                        ENDSPEECH: [{cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === true,
                            actions: assign((context) => { return { approval: true } }),
                            target: "#root.dm2.negative.load_entertainment"},
        
                            {cond: (context) => grammar[context.recResult] !== undefined && grammar[context.recResult].approval === false,
                            actions: assign((context) => { return { approval: false} }),
                            target: "#root.dm2.negative.final_state"},
                            {target: "#root.dm2.negative.entertainment.ask_again"}]
                    },
                states: {
                    prompt: {
                        entry: say("Then would you like some random entertainment?"),
                            on: {ENDSPEECH : "ask"}
                        },
                        ask: {
                            entry: send('LISTEN')
                        },
                        ask_again: {
                            entry: say('I am sorry, I could not understand you. Please repeat.'),
                            on: { ENDSPEECH: "ask"}
                    }
                }
                },
                load_entertainment: {
                    initial: 'prompt',
                    states: {
                        prompt: {
                            entry: say('Loading entertainment for you! I hope you feel better my G'),
                            on: { ENDSPEECH: 'play'}
                        },
                        play: {
                            entry: send((context) => ({
                                ...openInNewTab('https://theuselessweb.com')
                            })),
                            on: { ENDSPEECH: "#root.dm2.idle"}
                        }
                    },   
                },
                final_state: {
                    initial: 'prompt',
                    states: {
                        prompt: {
                            entry: say('Okay! I hope you find another way to feel better!'),
                            on: { ENDSPEECH: '#root.dm2.idle'}
                        },
                }
            } 
        } 
    } }
} )
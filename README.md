# bob_the_helper

“Bob the Helper” app was developed by Eva Elzbieta Sventickaite and Kris Farrugia. It was inspired by Bob the Builder and is intended for children (7-10).

The intention was to make it as intuitive as possible from interactional point of view.

Interact with Bob in a way, which is most suitable for you.

However, keep in mind that it only has these functions:
- helps you focus on your to-do list or working on your ideas
- plays music, provides you games or entertainement

**Instructions**

- At most points in ROOT and dm1 you can quit the app by saying “quit”, “turn off” or something similar. Same goes for “help”.
- By replying to the initial prompt (i.e. “how are you?”), you can ask for some information about Bob.
- After listening to you, Bob will prompt some options depending on your mood. Different scenarios:

(i) Positive: Bob will suggest to you to be productive or to work on some of your ideas.
(ii) Negative: Bob will suggest to you to listen to some music, play some games or to be entertained. Depending on the chosen option, Bob will open the website with the requested option. When opening the website, the app is somehow crashing, an issue which will be fixed.
(iii) Neutral: We have only implemented a testing option. This will be coded in the foreseeable future.

The options mentioned above can be accessed directly after Bob’s first prompt. However, for anyone using Bob for the first time, we suggest you to respond to the implemented prompts accordingly.

**Rules**

Let Bob finish his prompts before replying. Speak as clearly as you can given that ASR has its limitations :)


**Contributions**

EVA:
- `index.ts`
- `dmPositive.ts`
- DEMO with Mark
- adjustments of visuals
- presentation: schema, `Bob v.2`

KRIS:
- `dmNegative.ts`
- training and testing `RASA`
- presentation: definition of app, theory

We wish to improve this app even after the DS course, as a small continuous project, so we welcome all the possible feedback.

const respond = require("./dummy/respond.js");
const Cache = require("./dummy/cache.js");
const Translation = require("./dummy/translation-api.js");
const Speech = require("./dummy/speech-api.js");
const Storage = require("./dummy/storage-api.js");

const cache = new Cache();
const translation = new Translation();
const speech = new Speech();
const storage = new Storage();

// These simulate two request coming from users.
// To keep things simple. for this test, we can assume that these request come in sequence.

const fakeRequests = [
  [
    "Hello World!",
    "How are you?",
    "Recognize the symptoms of COVID-19",
    "Postponement of booster vaccination periods",
    "How are you?",
    "Vaccination certificate"
  ],
  [
    "How are you?",
    "People 33-64 years of age",
    "How are you?",
    "Vaccination certificate"
  ]
];

// --- No need to edit anything above this line ---


(async () => {
  // TODO: Respond to the user with the translated texts in the same order including a link to a audio speech file for each.
  // Tip: You are free to await until the last request is done before moving to the next one. No need for parallelization in this test.

  for (const request of fakeRequests) {
    // Request contains an array of strings

    const response = {
      translations: [], // Add all the translated strings to this array in the same order as they came in
      speech: [] // Add all the speech URLs to this array in the same order as the translations
    }

    for (const text of request) {
      // the prefix is to avoid collisions with the cache when the translation is not found (translation returns the same string)
      const cacheItem = await cache.getItem(`translation_${text}`);
      // if we found the translation in the cache, we don't need to call the translation API
      if(cacheItem) {
        response.translations.push(cacheItem);
        // assuming this phrase was stored in the cache, we can use it to get the speech URL
        const cacheURL = await cache.getItem(`speech_${cacheItem}`);
        response.speech.push(cacheURL);
      } else {
        // if the translation is not in the cache, we need to call the translation API
        const translatedText = await translation.translate(text);
        // we store the translation in the cache
        await cache.setItem(`translation_${text}`, translatedText);
        response.translations.push(translatedText);
        // we get the speech URL
        const speechStream = await speech.speak(translatedText);
        const storageURL = await storage.pipe(speechStream);
        // we store the speech URL in the cache
        await cache.setItem(`speech_${translatedText}`, storageURL);
        response.speech.push(storageURL);
      }
    }

    respond(response);
  }
})();

// // Available functions:

// // Cache
// cache.getItem("someKeyHere"); // Returns a promise that resolves to a string if found or undefined if not.
// cache.setItem("someKeyHere", "someDataHere"); // Returns a promise that resolves after the cache has been stored.

// // Translation
// translation.translate("English Source Text"); // Returns a promise that resolves to a string containing the translation as a string.

// // Speech
// speech.speak("Texto fuente en español"); // Returns a promise that resolves to a readable stream that will stream binary data (async).

// // Storage
// storage.pipe(stream); // Returns a promise that resolves to a fake URL once the stream has ended. A unique URL for each source text will be provided.
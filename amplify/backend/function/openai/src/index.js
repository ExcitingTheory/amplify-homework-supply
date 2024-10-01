/* Amplify Params - DO NOT EDIT
  API_JAPANESE4_CHATHISTORYTABLE_ARN
  API_JAPANESE4_CHATHISTORYTABLE_NAME
  API_JAPANESE4_FILETABLE_ARN
  API_JAPANESE4_FILETABLE_NAME
  API_JAPANESE4_GRAPHQLAPIENDPOINTOUTPUT
  API_JAPANESE4_GRAPHQLAPIIDOUTPUT
  API_JAPANESE4_SECTIONTABLE_ARN
  API_JAPANESE4_SECTIONTABLE_NAME
  API_JAPANESE4_UNITTABLE_ARN
  API_JAPANESE4_UNITTABLE_NAME
  API_JAPANESE4_WORDTABLE_ARN
  API_JAPANESE4_WORDTABLE_NAME
  AUTH_JAPANESE46739AB6B_USERPOOLID
  ENV
  REGION
  STORAGE_FILES_BUCKETNAME
Amplify Params - DO NOT EDIT *//*
Use the following code to retrieve configured secrets from SSM:

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["OPENAI_API_KEY"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/



import OpenAI from 'openai';
// https://github.com/openai/openai-node
import AWS from 'aws-sdk';
import crypto from '@aws-crypto/sha256-js';
import { createHash } from 'crypto';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { default as fetch, Request } from 'node-fetch';

import { CognitoIdentityClient, ListIdentityPoolsCommand } from "@aws-sdk/client-cognito-identity"
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const tools = [
  {
    type: "function",
    function: {
      name: "addTimerToUnit",
      description: "Add a timer to the current unit",
      parameters: {
        type: "object",
        properties: {
          duration: {
            type: "number",
            description: "The duration of the timer in minutes",
          },
        },
        required: ["duration"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assignDueDate",
      description: "Assign a due date to the current unit",
      parameters: {
        type: "object",
        properties: {
          sectionId: {
            type: "string",
            description: "The id of the section to assign the due date to",
          },
          exact: {
            type: "string",
            description: "An exact date string for the due date. For example: '2023-12-25T00:00:00Z'",
          },
        },
        required: ["sectionId", "exact"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "createWord",
      description: "Create a new word when supplied a phrase and a definition not in the database",
      parameters: {
        type: "object",
        properties: {
          phrase: {
            type: "string",
            description: "The phrase for the word",
          },
          definition: {
            type: "string",
            description: "The definition for the word",
          },
        },
        required: ["phrase", "definition"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createQuestion",
      description: "Create a new question with a prompt and an answer not in the database",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The prompt for the question",
          },
          answer: {
            type: "string",
            description: "The answer for the question",
          },
        },
        required: ["prompt", "answer"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertQuiz",
      description: "Insert a new quiz",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "The prompt for the question",
                },
                answer: {
                  type: "string",
                  description: "The answer for the question",
                },
              },
              required: ["prompt", "answer"],
            },
          },
        },
        required: ["questions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertPlaylist",
      description: "Insert a new playlist",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["word", "question", "audio", "image", "video"],
                  description: "The type of item to insert",
                },
                id: {
                  type: "string",
                  description: "The id of the item to insert",
                },
              },
              required: ["type", "id"],
            },
          },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertAutoLink",
      description: "Insert a new auto link",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The url to link to",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertLink",
      description: "Insert a new link",
      parameters: {
        type: "object",
        properties: {
          phrase: {
            type: "string",
            description: "The phrase to link to",
          },
          url: {
            type: "string",
            description: "The url to link to",
          },
        },
        required: ["phrase", "url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertVocabMeaningAssociationExerciseAndCreateWords",
      description: "Insert a new vocabulary meaning association exercise from new words",
      parameters: {
        type: "object",
        properties: {
          words: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phrase: {
                  type: "string",
                  description: "The phrase for the word",
                },
                definition: {
                  type: "string",
                  description: "The definition for the word",
              },
              pronunciation: {
                type: "string",
                description: "The pronunciation for the word",
              },
            },
          },
            required: ["phrase", "definition", "pronunciation"],
          },
        },
        required: ["words"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertQuestionMeaningAssociationExerciseWithNewQuestions",
      description: "Insert a new meaning association exercise from new questions",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "The prompt for the question",
                },
                answer: {
                  type: "string",
                  description: "The answer for the question",
                },
              },
            },
            required: ["prompt", "answer"],
          },
        },
        required: ["questions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertVocabularyExerciseById",
      description: "Insert a new vocabulary meaning association exercise from existing word uuids",
      parameters: {
        type: "object",
        properties: {
          words: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The id of the word to insert",
                },
              },
            },
            required: ["id"],
          },
        },
        required: ["words"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertQuestionExerciseById",
      description: "Insert a new exercise from existing questions",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The id of the question to insert",
                },
              },
            },
            required: ["id"],
          },
        },
        required: ["questions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertYouTubeVideo",
      description: "Insert a new YouTube video",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The url of the YouTube video",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertImage",
      description: "Insert a new image",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The id of the image file",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertAudio",
      description: "Insert a new audio",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The id of the audio file",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertAnswerExercise",
      description: "Insert a new answer exercise",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The prompt for the exercise",
          },
          answer: {
            type: "string",
            description: "The answer for the exercise",
          },
        },
        required: ["prompt", "answer"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insertCustomAnswerExercise",
      description: "Insert a new custom answer exercise",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The prompt for the exercise",
          },
          answer: {
            type: "string",
            description: "The answer for the exercise",
          },
        },
        required: ["prompt", "answer"],
      },
    },
  },
]



const GRAPHQL_ENDPOINT = process.env.API_JAPANESE4_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENV = process.env.ENV;
const { Sha256 } = crypto;

const USERPOOL_ID = process.env.AUTH_JAPANESE46739AB6B_USERPOOLID;

const command = new ListIdentityPoolsCommand({ MaxResults: 60 }); // Member must have value less than or equal to 60
const client = new CognitoIdentityClient({ region: AWS_REGION });
const responseListPools = await client.send(command);

const pools = responseListPools?.IdentityPools || [];
// find the first pool that has the name that contains the pattern: `japanese46739ab6b_identitypool_6739ab6b__${ENV}`

let IDENTITY_POOL_ID = null;

for (const pool of pools) {
  console.log(pool?.IdentityPoolName)
  if (pool?.IdentityPoolName == `japanese46739ab6b_identitypool_6739ab6b__${ENV}`) {
    console.log('FOUND', pool?.IdentityPoolId)
    IDENTITY_POOL_ID = pool?.IdentityPoolId;
    break;
  }
}

if (!IDENTITY_POOL_ID) {
  console.log('Identity Pool not found, the page limit might be too low.')
  throw new Error('Identity Pool not found');
}

const createFile = /* GraphQL */ `
  mutation CREATE_FILE($input: CreateFileInput!) {
    createFile(input: $input) {
      id
      createdAt
      updatedAt
      name
      path
      owner
      identityId
      level
      description
      _version
      _lastChangedAt
      mimeType
      hex
      generated
    }
  }
`;

const voices = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
]

const resolvers = {
  Query: {
    verifyDefinition: async ctx => {
      // verify a definition matches a word, if it does not match, provide a reason why or hint?
      const { phrase, definition, expected, model } = ctx.arguments;
      const messages = [{
        role: "system",
        content: "You are a helpful assistant."
      }, {
        role: "user",
        content: `Is this ${definition} the definition of the phrase "${phrase}"? We are expecting this definition as an answer for comparison: "${expected}". Please confirm. If not, please provide a reason why. Answer in the following schema {"answer": true, "reason": "It is the definition of the word, but there are misspellings."} or {"answer": false, "reason": "because the definition is this instead: ..."}`
      }]

      const completion = await openai.chat.completions.create({
        messages,
        model,
      });

      const returnString = JSON.stringify(completion)
      return returnString;
    },
    verifyWord: async ctx => {
      // verify a word matches a definition, if it does not match, provide a reason why or hint?

      const { word, definition, expected, model } = ctx.arguments;
      const messages = [{
        role: "system",
        content: "You are a helpful assistant."
      }, {
        role: "user",
        content: `Does this ${word} match the following word: "${expected}?"
          
          Use the following definition: "${definition}"
          
          Please confirm. If not, please provide a reason why. Answer in the following schema {"answer": true, "reason": "because it is the definition of the word"} or {"answer": false, "reason": "because the definition is this instead: ..."}`
      }]

      const completion = await openai.chat.completions.create({
        messages,
        model,
      });

      const returnString = JSON.stringify(completion)
      return returnString;
    },
    verifyShortAnswer: async ctx => {
      // verify a short answer provided by a user matches a provided fact, if it does not match, provide a reason why or hint?

      const { answer, prompt, expected, model } = ctx.arguments;
      const messages = [{
        role: "system",
        content: "You are a helpful assistant."
      }, {
        role: "user",
        content: `Does this answer "${answer}" significantly match the expected input: "${expected}"?
          
          For context here is the original prompt: "${prompt}".
          
          Please confirm. If not, please provide a reason why. Answer in the following schema {"answer": true, "reason": "because it is the correct answer"} or {"answer": false, "reason": "because the correct answer is this instead"}`
      }]

      const completion = await openai.chat.completions.create({
        messages,
        model,
      });

      const returnString = JSON.stringify(completion)
      return returnString;
    },
    transcribe: async ctx => {
      // const transcription = await openai.audio.transcriptions.create({
      //   file: fs.createReadStream("/path/to/file/audio.mp3"),
      //   model: "whisper-1",
      // });

      // console.log(transcription.text);
      // verify a spoken phrase provided by audio file data matches a provided text phrase, if it does not match, provide a reason why or hint/example?

      const { audio, model } = ctx.arguments;

      const audioBuffer = Buffer.from(audio, 'base64');

      const transcription = await openai.audio.transcriptions.create({
        file: audioBuffer,
        model, // whisper-1
      });

      const returnString = JSON.stringify(transcription)
      return returnString;
    },
    verifyAudio: async ctx => {
      // verify a spoken phrase provided by audio file data matches a provided text phrase, if it does not match, provide a reason why or hint/example?

      // const transcription = await openai.audio.transcriptions.create({
      //   file: fs.createReadStream("/path/to/file/audio.mp3"),
      //   model: "whisper-1",
      // });

      // console.log(transcription.text);
      // verify a spoken phrase provided by audio file data matches a provided text phrase, if it does not match, provide a reason why or hint/example?

      const { audio, model, expected, chatModel } = ctx.arguments;
      // escape backticks, quotes, and other special characters TBD
      const expectedEscaped = expected.replace(/`/g, '\\`').replace(/"/g, '\\"')
      
      const audioBuffer = Buffer.from(audio, 'base64');
      const transcription = await openai.audio.transcriptions.create({
        file: audioBuffer,
        model, // whisper-1
        prompt: expectedEscaped,
      });

      const messages = [{
        role: "system",
        content: "You are a helpful assistant."
      }, {
        role: "user",
        content: `Does this text "${transcription.text}" match the expected input: "${expectedEscaped}"?
          
        Please confirm. If not, please provide a reason why. Answer in the following schema {"answer": true, "reason": "because it is the correct transcription"} or {"answer": false, "reason": "because the correct transcription is this instead"}`
      }]

      const completion = await openai.chat.completions.create({
        messages,
        model: chatModel,
      });

      const returnString = JSON.stringify({ transcription, completion })

      return returnString;
    },
    verifyAudioUrl: async ctx => {
      // verify a spoken phrase provided by audio file at a url matches a provided text phrase, if it does not match, provide a reason why or hint/example?
      const { audioUrl, model, expected, chatModel } = ctx.arguments;

      // escape the double quotes in all the strings
      const expectedEscaped = expected.replace(/"/g, '\\"').replace(/`/g, '\\`')
      const filename = `/tmp/audio-${uuidv4()}.mp3`
      const _file = fs.createWriteStream(filename);

      // fetch the audio file
      const response = await fetch(audioUrl);
      // write the audio file to disk
      response.body.pipe(_file);

      const transcription = await openai.audio.transcriptions.create({
        file:  fs.createReadStream(filename),
        model, // whisper-1
        prompt: expectedEscaped,
      });

      // ask chat to verify the transcription text with the expected prompt

      const messages = [{
        role: "system",
        content: "You are a helpful tutor and giving a learner feedback. Accept the learner's response and provide feedback. Partial credit is given for partially correct answers, but please provide a reason for the grade."
      }, {
        role: "user",
        content: `Does this text "${transcription.text}" match the expected input: "${expectedEscaped}"?
          
        Please confirm. If not, please provide a reason why. Answer in the following schema {"answer": true, "reason": "because it is the correct transcription"} or {"answer": false, "reason": "because the correct transcription is this instead"}`
      }]

      // ask chat to verify the transcription text with the expected prompt

      const completion = await openai.chat.completions.create({
        messages,
        model: chatModel,
      });

      const returnString = JSON.stringify({ transcription, completion })

      return returnString;

    },
    transcribeUrl: async ctx => {
      // verify a spoken phrase provided by audio file at a url matches a provided text phrase, if it does not match, provide a reason why or hint/example?

      const { audioUrl, model } = ctx.arguments;

      const audioBuffer = await fetch(audioUrl).then(res => res.buffer());

      const transcription = await openai.audio.transcriptions.create({
        file: audioBuffer,
        model, // whisper-1
      });

      const returnString = JSON.stringify(transcription)
      return returnString;
    },
    processImageUrl: async ctx => {
      // describe the contents of an image at a url

      const { imageUrl, model } = ctx.arguments;

      // const response = await openai.chat.completions.create({
      //   model: "gpt-4o",
      //   messages: [
      //     {
      //       role: "user",
      //       content: [
      //         { type: "text", text: "What’s in this image?" },
      //         {
      //           type: "image_url",
      //           image_url: {
      //             "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
      //             "detail": "low""
      //           },
      //         },
      //       ],
      //     },
      //   ],
      // });
      // console.log(response.choices[0]);

      const response = await openai.chat.completions.create({
        model, // gpt-4o
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What’s in this image?" },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                },
              },
            ],
          },
        ],
      });

      const returnString = JSON.stringify(response)

      return returnString;
    },
    processImage: async ctx => {
      // describe the contents of an image provided as base64 data

      const { image, model } = ctx.arguments;

      const response = await openai.chat.completions.create({
        model, //gpt-4o
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What’s in this image?" },
              {
                type: "image",
                image: {
                  data: image,
                  detail: "high"
                },
              },
            ],
          },
        ],
      });

      const returnString = JSON.stringify(response)

      return returnString;

    },
    verifyImageUrl: async ctx => {
      // verify a phrase provided by an image at a url matches a provided text phrase, if it does not match, provide a reason why or hint/example?

      const { imageUrl, phrase, expected, model, chatModel } = ctx.arguments;

      const response = await openai.chat.completions.create({
        model, // gpt-4o
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text", text: `Does this image match the following phrase: "${phrase}"? 

              Please confirm. If not, please provide a reason why. Answer in the following schema {"answer": true, "reason": "because it is an object in the image"} or {"answer": false, "reason": "because the image cannot be described like that, but is this instead: ..."}
              ` },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                },
              },
            ],
          },
        ],
      });

      const returnString = JSON.stringify(response)

      return returnString;
    },
    verifyImage: async ctx => {
      // verify a phrase provided by an image at a url matches a provided text phrase, if it does not match, provide a reason why or hint/example?

      const { image, expected, model } = ctx.arguments;

      console.log('verifyImage', ctx)
      console.log('verifyImage', image)

      const escapedExpected = expected.replace(/"/g, '\\"').replace(/`/g, '\\`')
      const dataUrl = `data:image/png;base64,${image}`;

      const response = await openai.chat.completions.create({
        model, // gpt-4o
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text", text: `Does this image match the following description: "${escapedExpected}"? 

              Please confirm. If not, please provide a reason why. Answer in the following schema {"answer": true, "reason": "because it is an object in the image"} or {"answer": false, "reason": "because the image cannot be described like that, but is this instead: ..."}
              ` },
              {
                type: "image_url",
                image_url: {
                  "url": dataUrl,
                  "detail": "high"
                },
              },
            ],
          },
        ],
      });

      const returnString = JSON.stringify(response)

      return returnString;

    },
  },
  Mutation: {
    generateAudio: async ctx => {
      // generate base64 audio from a provided text phrase

      const { phrase, voice, model } = ctx.arguments;
      console.log('Mutation.generateAudio.ctx', ctx)


      if (!voices.includes(voice)) {
        throw new Error(`Invalid voice: ${voice}`);
      }

      const mp3 = await openai.audio.speech.create({
        input: phrase,
        voice,
        model, // tts-1-hd or tts-1
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      // base64 encoding
      const base64 = buffer.toString('base64');
      const audioFileStr = `data:audio/mp3;base64,${base64}`
      console.log(audioFileStr);

      return { audioFileStr, phrase, voice, model };
    },
    generateAudioFile: async ctx => {
      console.log(ctx)
      const issuer = ctx?.identity?.claims?.iss.split('//')[1]
      console.log('USERPOOL_ID', USERPOOL_ID)
      console.log('issuer', issuer)
      console.log('IDENITY_POOL_ID', IDENTITY_POOL_ID)

      // x-api-identity
      const _token = ctx?.request?.headers?.['x-api-identity'] || ctx.request.headers.authorization

      // generate an audio file from a provided text phrase
      const cognitoidentity = new CognitoIdentityClient({
        credentials: fromCognitoIdentityPool({
          client: new CognitoIdentityClient(),
          identityPoolId: IDENTITY_POOL_ID, // How to get this??
          logins: {
            [issuer]: _token
          }
        }),
      });

      const credentials = await cognitoidentity.config.credentials()
      console.log(credentials)

      const identityId = credentials.identityId;

      if (!identityId) {
        throw new Error(`Invalid identityId: ${identityId}`);
      }

      const { phrase, voice, model } = ctx.arguments;
      const owner = ctx?.identity?.username;

      console.log(ctx)

      if (!voices.includes(voice)) {
        throw new Error(`Invalid voice: ${voice}`);
      }

      const mp3 = await openai.audio.speech.create({
        input: phrase,
        voice,
        model, // tts-1-hd or tts-1
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const hash = createHash('sha256')
      hash.update(model + voice + phrase);
      const phraseHex = hash.digest('hex');
      const speechFile = `${phraseHex}.mp3`;
      const s3Key = `protected/${identityId}/audio/${speechFile}`;

      // upload to s3
      const s3 = new AWS.S3();
      const uploadParams = {
        Bucket: process.env.STORAGE_FILES_BUCKETNAME,
        Key: s3Key,
        Body: buffer,
        ContentType: 'audio/mp3',
      };

      // const localeDate = new Date().toLocaleDateString();

      // save to database
      const fileOpts = {
        input: {
          name: phrase,
          path: `audio/${speechFile}`,
          owner,
          identityId,
          prompt: phrase,
          model,
          variant: voice,
          level: 'PROTECTED',
          description: `Generated audio file from ${model}, voiced by ${voice}`,
          mimeType: 'audio/mp3',
          hex: phraseHex,
          generated: true,
          duration: mp3?.duration,
          size: mp3?.size,
          // thumbnail: '',
        }
      };

      // save db and s3 key at the same time

      console.log('uploadParams', uploadParams);
      console.log('fileOpts', fileOpts);

      const [s3Upload, fileSave] = await Promise.allSettled([
        s3.upload(uploadParams).promise(),
        executeAppSyncQuery(createFile, fileOpts),
      ]);

      console.log('fileSave', fileSave);
      console.log('s3Upload', s3Upload);

      if (s3Upload.status === 'rejected') {
        throw new Error(s3Upload.reason);
      }
      if (fileSave.status === 'rejected') {
        throw new Error(fileSave.reason);
      }

      const {
        id,
        level,
        prompt,
        path,
        duration,
        size,
        generated,
        hex,
        mimeType,
        name,
        thumbnail, // todo generate thumbnail
        createdAt,
        updatedAt,
        _version,
        _lastChangedAt,
      } = fileSave.value.data.createFile;

      return {
        id,
        level,
        path,
        prompt,
        owner,
        identityId,
        duration,
        size,
        generated,
        hex,
        mimeType,
        name,
        model,
        variant: voice,
        thumbnail,
        createdAt,
        updatedAt,
        _version,
        _lastChangedAt,
      };
    },
    generateImage: async ctx => {
      console.log(ctx)      
      // generate an image from a provided text phrase
      const { phrase, model } = ctx.arguments;

      const response = await openai.images.generate({
        model, // dall-e-3
        prompt: phrase,
        n: 1,
        size: "1024x1024",
      });

      const image_url = response.data[0].url;

      //  convert to base64

      const imageBuffer = await fetch(image_url).then(res => res.buffer());

      const base64 = imageBuffer.toString('base64');
      const imageFileStr = `data:image/png;base64,${base64}`

      return { imageFileStr, phrase, model };


    },
    generateImageFile: async ctx => {
      // const response = await openai.images.generate({
      //   model: "dall-e-3",
      //   prompt: "a white siamese cat",
      //   n: 1,
      //   size: "1024x1024",
      // });
      // image_url = response.data[0].url;


      // generate an image file from a provided text phrase
      console.log(ctx)
      const issuer = ctx?.identity?.claims?.iss.split('//')[1]
      console.log('USERPOOL_ID', USERPOOL_ID)
      console.log('issuer', issuer)
      console.log('IDENITY_POOL_ID', IDENTITY_POOL_ID)

      // x-api-identity
      const _token = ctx?.request?.headers?.['x-api-identity'] || ctx.request.headers.authorization

      // generate an image file from a provided text phrase
      const cognitoidentity = new CognitoIdentityClient({
        credentials: fromCognitoIdentityPool({
          client: new CognitoIdentityClient(),
          identityPoolId: IDENTITY_POOL_ID,
          logins: {
            [issuer]: _token
          }
        }),
      });

      const credentials = await cognitoidentity.config.credentials()
      console.log(credentials)

      const identityId = credentials.identityId;

      if (!identityId) {
        throw new Error(`Invalid identityId: ${identityId}`);
      }

      const { phrase, model } = ctx.arguments;
      const owner = ctx?.identity?.username;

      console.log(ctx)

      const response = await openai.images.generate({
        model, // dall-e-3
        prompt: phrase,
        n: 1,
        size: "1024x1024",
      });

      const image_url = response.data[0].url;

      // upload the image to s3

      const s3 = new AWS.S3();

      const imageBuffer = await fetch(image_url).then(res => res.buffer());

      const hash = createHash('sha256')
      hash.update(model + phrase);
      const phraseHex = hash.digest('hex');
      const imageFile = `${phraseHex}.png`;

      const s3Key = `protected/${identityId}/images/${imageFile}`;

      const uploadParams = {
        Bucket: process.env.STORAGE_FILES_BUCKETNAME,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: 'image/png',
      };

      // save to database
      const fileOpts = {
        input: {
          name: phrase,
          path: `images/${imageFile}`,
          owner,
          model,
          prompt: phrase,
          // variant: null,
          identityId,
          level: 'PROTECTED',
          description: `Generated image file from ${model}, using prompt: ${phrase}`,
          mimeType: 'image/png',
          hex: phraseHex,
          generated: true,
          duration: 0,
          size: imageBuffer.length,
          thumbnail: '',
        }
        // const localeDate = new Date().toLocaleDateString();
      };

      // generate thumbnail

      // save db and s3 key at the same time

      console.log('uploadParams', uploadParams);
      console.log('fileOpts', fileOpts);

      const [s3Upload, fileSave] = await Promise.allSettled([
        s3.upload(uploadParams).promise(),
        executeAppSyncQuery(createFile, fileOpts),
      ]);

      console.log('fileSave', fileSave);
      console.log('s3Upload', s3Upload);

      if (s3Upload.status === 'rejected') {
        throw new Error(s3Upload.reason);
      }
      if (fileSave.status === 'rejected') {
        throw new Error(fileSave.reason);
      }

      const {
        id,
        level,
        prompt,
        path,
        duration,
        size,
        generated,
        hex,
        mimeType,
        name,
        thumbnail, // todo generate thumbnail
        createdAt,
        updatedAt,
        _version,
        _lastChangedAt,
      } = fileSave.value.data.createFile;

      return {
        id,
        level,
        path,
        prompt,
        owner,
        identityId,
        duration,
        size,
        generated,
        hex,
        mimeType,
        name,
        model,
        thumbnail,
        createdAt,
        updatedAt,
        _version,
        _lastChangedAt,
      };
    },
    deleteAssistantEditor: async ctx => {
      const {
        assistantId,
        threadId
       } = ctx.arguments;

      const assistant = await openai.beta.assistants.del(assistantId);

      const thread = await openai.beta.threads.del(threadId);

      const returnString = JSON.stringify({
        assistant,
        thread
      })

      console.log(returnString);

      return returnString
    },
    updateAssistantEditor: async ctx => {
      // update the assistant with new instructions and tools
      const {
        assistantId,
        additionalInstructions,
      } = ctx.arguments;
      

      console.log('updateAssistantEditor', ctx)
      console.log('updateAssistantEditor', assistantId)
      console.log('updateAssistantEditor', additionalInstructions)

      const assistant = await openai.beta.assistants.update(
        assistantId,
        {
          instructions: `You are a helpful teachers assistant that can assist with lesson planning and content creation. Use the following tools to interact with the content.\n${additionalInstructions}`,
          tools, // update tools
        }
      );

      return JSON.stringify(assistant);
    },
    useAssistantEditor: async ctx => {
      const {
        threadInstructions,
        additionalInstructions,
        assistantId,
        threadId
      } = ctx.arguments;

      console.log('useAssistantEditor', threadInstructions)
      console.log('useAssistantEditor', assistantId)


      const message =  openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: threadInstructions,
      });

      // const completion = await openai.chat.completions.create({
      //   messages: [{ role: "system", content: "You are a helpful assistant." }],
      //   model: "gpt-4o",
      // });
    
      // console.log(completion.choices[0]);

      // Create and poll run
      let run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: assistantId,
      });

      console.log(run)
      // if there are no tools runs returned from the run return the chat completion

      // return run
      const returnString = JSON.stringify(run)
      return returnString;

    },
    initAssistantEditor: async ctx => {

      console.log(ctx)
      console.log('initAssistantEditor', ctx.arguments)

      // TODO make this a separate function for creating an assistant and then calling it here
      
      /** Editor tasks for the assistant:
      
      1. Add timer to unit
      2. Assign Due Date to unit to a section
      3. Create a new word with a phrase and a definition, optionally generate a definition if not provided
      4. Create a new question with a prompt and an answer, optionally generate an answer if not provided
      5. Insert a new quiz
      6. Insert a new playlist
      7. Insert a new auto link
      8. Insert a new link
      9. Insert a new meaning association
      10. Insert a new youtube video
      11. Insert a new or existing image
      12. Insert a new or existing audio
      13. Insert a new answer exercise
      14. Insert a new custom answer exercise
      */


      const {
        model,
        additionalInstructions,
      } = ctx.arguments;



      const {
        userId // get from cognito
      } = ctx.identity;

      console.log('initAssistantEditor', userId)
      console.log('initAssistantEditor', model)
      console.log('initAssistantEditor', additionalInstructions)


      const assistant = await openai.beta.assistants.create({
        model,
        name: `${userId}_assistantEditor`, //add with user id?
        description: "Assistant for editing content",
        instructions: `You are a helpful teachers assistant that can assist with lesson planning and content creation. Use the following tools and data to interact with the content.\n${additionalInstructions}`,
        tools          
      });
      const assistantId = assistant.id;

      const thread = await openai.beta.threads.create();
      const threadId = thread.id;
      // return assistantId and threadId
      return JSON.stringify({ assistantId, threadId });
    },
    chatAssistantThread: async ctx => {
      const { 
        threadId,
        message } = ctx.arguments;

      const threadMessages = await openai.beta.threads.messages.create(
        threadId,
        { role: "user", content: message }
      );
    
      console.log(threadMessages);
    }
  },
};

const { Parameters } = await (new AWS.SSM())
  .getParameters({
    Names: ["OPENAI_API_KEY"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();


async function executeAppSyncQuery(query, variables) {

  console.log(`Query: ${JSON.stringify(query)}`);
  console.log(`Variables: ${JSON.stringify(variables)}`);

  const endpoint = new URL(GRAPHQL_ENDPOINT);

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: AWS_REGION,
    service: 'appsync',
    sha256: Sha256
  });

  const requestToBeSigned = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: endpoint.host
    },
    hostname: endpoint.host,
    body: JSON.stringify({
      query,
      variables
    }),
    path: endpoint.pathname
  });

  const signed = await signer.sign(requestToBeSigned);
  const request = new Request(endpoint, signed);

  let statusCode = 200;
  let body;
  let response;

  try {
    response = await fetch(request);
    body = await response.json();
    if (body.errors) statusCode = 400;
  } catch (error) {
    statusCode = 500;
    body = {
      errors: [
        {
          message: error.message
        }
      ]
    };
  }

  return body;
}

function findSecret(name) {
  const foundItem = Parameters.find(item => item['Name'] === process.env[name])
  return foundItem?.Value
}

const openai = new OpenAI({
  apiKey: findSecret('OPENAI_API_KEY')
});

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export async function handler(event) {
  const typeHandler = resolvers[event.typeName];
  if (typeHandler) {
    const resolver = typeHandler[event.fieldName];
    console.log('resolver found', resolver)
    if (resolver) {
      console.log('resolver executing', resolver)
      return await resolver(event);
      
    }
  }
  throw new Error("Resolver not found.");

};

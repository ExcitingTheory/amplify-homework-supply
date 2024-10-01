/*
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
/* Amplify Params - DO NOT EDIT
  API_JAPANESE4_GRAPHQLAPIENDPOINTOUTPUT
  API_JAPANESE4_GRAPHQLAPIIDOUTPUT
  API_JAPANESE4_GRAPHQLAPIKEYOUTPUT
  ENV
  REGION
  STORAGE_FILES_BUCKETNAME
Amplify Params - DO NOT EDIT */

const { Configuration, OpenAIApi } = require("openai");
const AWS = require("aws-sdk");

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  const { Parameters } = await (new AWS.SSM())
    .getParameters({
      Names: [
        'OPENAI_API_KEY',
      ].map(secretName => process.env[secretName]),
      WithDecryption: true,
    })
    .promise()

  function findSecret(name) {
    const foundItem = Parameters.find(item => item['Name'] === process.env[name])
    return foundItem?.Value
  }

  const configuration = new Configuration({
    organization: 'org-PPRepAgBhOsNacvinnxaNIpf',
    apiKey: findSecret('OPENAI_API_KEY'),
  });

  console.log(`EVENT: ${JSON.stringify(event)}`);
  const messages = JSON.parse(event.arguments.messages);
  const model = event?.arguments?.model || "gpt-3.5-turbo"
  console.log(`MESSAGES: ${event.arguments.messages}`);
  const openai = new OpenAIApi(configuration);

  const completion = await openai.createChatCompletion({
    messages,
    model,
    /**
     * mutation MyMutation {
        chat(messages: "[{\"role\": \"system\", \"content\": \"You are a helpful assistant.\"}, {\"role\": \"user\", \"content\": \"Hello world\"}]")
      }
     */
    // messages: [{"role": "system", "content": "You are a helpful assistant."}, {role: "user", content: "Hello world"}],
  });

  const returnString = JSON.stringify(completion?.data)

  return returnString
};

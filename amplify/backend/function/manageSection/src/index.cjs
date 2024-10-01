/* Amplify Params - DO NOT EDIT
    API_JAPANESE4_GRAPHQLAPIENDPOINTOUTPUT
    API_JAPANESE4_GRAPHQLAPIIDOUTPUT
    API_JAPANESE4_GRAPHQLAPIKEYOUTPUT
    AUTH_JAPANESE46739AB6B_USERPOOLID
    ENV
    REGION
Amplify Params - DO NOT EDIT */

/**
 * This provides methods to manage sections. 
 * 
 * @module manageSection
 * 
 * @param {Object} event - Lambda Event payload.
 * @param {Object} context - Lambda Context runtime methods and attributes.
 * 
 * @returns {Object} object - Lambda Function response.
 * 
 */


// import * as axios from 'axios'
const axios = require('axios');
const graphqlQuery = require('./query.cjs').query;
const { CognitoIdentityServiceProvider } = require('aws-sdk');
const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
const { Sha256 } = require("@aws-crypto/sha256-js");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { SignatureV4 } = require("@aws-sdk/signature-v4");
const { HttpRequest } = require("@aws-sdk/protocol-http");
const { default: fetch, Request } = require("node-fetch");


/**
 * Get user pool information from environment variables.
 */
const COGNITO_USERPOOL_ID = process.env.AUTH_JAPANESE46739AB6B_USERPOOLID;
if (!COGNITO_USERPOOL_ID) {
    throw new Error(`Function requires environment variable: 'COGNITO_USERPOOL_ID'`);
}
const COGNITO_USERNAME_CLAIM_KEY = 'cognito:username';

const GRAPHQL_ENDPOINT = process.env.API_JAPANESE4_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

function codeGenerator(length = 6) {
    /**
     * Generate a random string of characters.
     *
     * @param {number} length - The length of the string to generate.
     * 
     * @returns {string} randomString - The random string of characters.
     * 
     * @example
     * 
     *   codeGenerator(6)
     *   // => 'aBcDeF'
     * 
     *  codeGenerator(12)
     *  // => 'aBcDeFgHiJkL'
     * 
     */
    let charString = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    charString = charString.split('')
    // console.log('charString', charString)
    charStringLen = charString.length
    console.log(`Generating Base${charStringLen} random string with ${length} characters`)
    let randomString = '';

    for (let index = 0; index < length; index++) {
        const randomInt = Math.floor(Math.random() * charStringLen);
        randomString = randomString + charString[randomInt]
    }
    return randomString
}

async function addUserToGroup(username, groupname) {
    /**
     * Add a user to a group.
     * 
     * @param {string} username - The username of the user to add to the group.
     * @param {string} groupname - The name of the group to add the user to.
     * 
     * @returns {Object} object - The response from the Cognito API.
     */
    const params = {
        GroupName: groupname,
        UserPoolId: COGNITO_USERPOOL_ID,
        Username: username,
    };

    console.log(`Attempting to add ${username} to ${groupname}`);

    try {
        const result = await cognitoIdentityServiceProvider.adminAddUserToGroup(params).promise();
        console.log(`Success adding ${username} to ${groupname}`);
        return {
            message: `Success adding ${username} to ${groupname}`,
        };
    } catch (err) {
        console.log(err);
        throw err;
    }

}

async function removeUserFromGroup(username, groupname) {
    /**
     * Remove a user from a group.
     * 
     * If the user is not in the group, this will throw an error.
     * If the user is not the same as the one making the request, 
     * this will throw an error, unless the user is an admin, teacher, or the owner of the group.
     *  
     */

    const params = {

        GroupName: groupname,
        UserPoolId: COGNITO_USERPOOL_ID,
        Username: username,
    };
    
    console.log(`Attempting to remove ${username} from ${groupname}`);

    try {
        const result = await cognitoIdentityServiceProvider.adminRemoveUserFromGroup(params).promise();
        console.log(`Success removing ${username} from ${groupname}`);
        return {

            message: `Success removing ${username} from ${groupname}`,
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function listUsersInGroup(groupname) {
    /**
     * List users in a group.
     * 
     * @param {string} groupname - The name of the group to list users from.
     */

    const params = {
        GroupName: groupname,
        UserPoolId: COGNITO_USERPOOL_ID,

    };

    console.log(`Attempting to list users in ${groupname}`);

    try {
        const result = await cognitoIdentityServiceProvider.listUsersInGroup(params).promise();
        console.log(`Success listing users in ${groupname}`);
        return {
            message: `Success listing users in ${groupname}`,
            users: result.Users,
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
}



async function createGroup(groupname, description) {

    /**
     * Create a group.
     * 
     * @param {string} groupname - The name of the group to create.
     * @param {string} description - The description of the group to create.
     * 
     * @returns {Object} object - The response from the Cognito API.
     * 
     * @example
     * 
     *  createGroup('testgroup', 'This is a test group')
     * // => { message: 'Success adding group: testgroup' }
     * 
     */

    var params = {
        GroupName: groupname, /* required */
        UserPoolId: COGNITO_USERPOOL_ID, /* required */
        Description: description,
        Precedence: 0
    };

    console.log(`Attempting to create group ${groupname}`);

    try {
        const response = await cognitoIdentityServiceProvider.createGroup(params).promise();
        console.log(`Success creating group: ${groupname}`);
        console.log(response)
        return {
            message: `Success adding group: ${groupname}`,
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Using this as the entry point, you can use a single function to handle many resolvers.
 */
const resolvers = {
    Query: {
        listSectionStudents: async ctx => {

            //pass in the section code the section owner
            const sectionCode = ctx.arguments.sectionCode
            // const sectionOwner = ctx.arguments.owner
            const user = ctx.identity.username
            let sectionOwner = null

            const variables = {
                code: sectionCode
            };

            console.log('addSelfToSection.variables', variables)

            const endpoint = new URL(GRAPHQL_ENDPOINT);

            const signer = new SignatureV4({
                credentials: defaultProvider(),
                region: AWS_REGION,
                service: "appsync",
                sha256: Sha256,
            });

            const requestToBeSigned = new HttpRequest({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    host: endpoint.host,
                },
                hostname: endpoint.host,
                body: JSON.stringify({ query: graphqlQuery, variables }),
                path: endpoint.pathname,
            });

            const signed = await signer.sign(requestToBeSigned);
            const request = new Request(GRAPHQL_ENDPOINT, signed);

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
                            message: error.message,
                        },
                    ],
                };
            }

            console.log('JSON.stringify(body)', JSON.stringify(body))
            /**
             * {
    "data": {
        "sectionByCode": {
            "items": [
                {
                    "description": "description of section 1",
                    "name": "section 1"
                }
            ]
        }
    }
}

             */

            try {
                const section = body?.data?.sectionByCode?.items[0]
                console.log('section', section)
                if (!section) throw "Section not found"
                sectionOwner = section?.owner
            }
            catch (err) {
                console.log(err);
                throw err;
            }

            if (response?.data?.errors?.length > 0) {
                console.log(response.data.errors)
                throw new Error(response.data.errors[0].message)
            }

            // // check if the user is the owner of the section
            if (sectionOwner && user !== sectionOwner) {
                // throw new Error('You are not the owner of this section')
                return []
            }

            const sectionStudents = await listUsersInGroup(sectionCode)

            const sectionStudentsArray = sectionStudents.users.map((student) => {

                const studentUsername = student?.Username || 'No username'
                const studentEmail = student.Attributes.find((attribute) => attribute.Name === 'email')?.Value || 'No email'
                const studentName = student.Attributes.find((attribute) => attribute.Name === 'name')?.Value || 'No name'
                
                return {
                    id: studentUsername,
                    email: studentEmail, // TODO: Determine if email is something we want to expose?
                    name: studentName
                }
            })

            return sectionStudentsArray
        },
    },
    Mutation: {
        createSectionGroup: async ctx => {
            /**
             * Create a group for a section.
             * 
             * @param {string} name - The name of the group to create.
             * @param {string} description - The description of the group to create.
             * 
             * @returns {string} randomGroupName - The name of the group that was created.
             */
            // console.log('ctx', ctx)
            const randomGroupName = codeGenerator()
            // const randomGroupName = `${ctx.arguments.name}-${rando}`
            const groupDescription = `${ctx.arguments.name}: ${ctx.arguments.description}`
            await createGroup(randomGroupName, groupDescription)
            console.log('creating group named:', randomGroupName)
            console.log('description:', groupDescription)
            return randomGroupName
        },
        addSelfToSection: async ctx => {
            /**
             * Add the current user to a section.
             * 
             * @param {string} code - The code of the section to add the user to.
             * 
             * @returns {Object} object - The response from the Cognito API.
             */

            const variables = {
                code: ctx.arguments.code
            };

            console.log('addSelfToSection.variables', variables)

            const endpoint = new URL(GRAPHQL_ENDPOINT);

            const signer = new SignatureV4({
                credentials: defaultProvider(),
                region: AWS_REGION,
                service: "appsync",
                sha256: Sha256,
            });

            const requestToBeSigned = new HttpRequest({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    host: endpoint.host,
                },
                hostname: endpoint.host,
                body: JSON.stringify({ query: graphqlQuery, variables }),
                path: endpoint.pathname,
            });

            const signed = await signer.sign(requestToBeSigned);
            const request = new Request(GRAPHQL_ENDPOINT, signed);

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
                            message: error.message,
                        },
                    ],
                };
            }

            console.log('JSON.stringify(body)', JSON.stringify(body))
            /**
             * {
    "data": {
        "sectionByCode": {
            "items": [
                {
                    "description": "description of section 1",
                    "name": "section 1"
                }
            ]
        }
    }
}

             */

            try {
                const section = body?.data?.sectionByCode?.items[0]
                console.log('section', section)
                if (!section) throw "Section not found"
                const userAdded = await addUserToGroup(ctx.identity.username, section.code)
                console.log('userAdded', userAdded)
            }
            catch (err) {
                console.log(err);
                throw err;
            }

            if (response?.data?.errors?.length > 0) {
                console.log(response.data.errors)
                throw "Error from AppSync"
            }

            return "Added to section"
        }
    },
}

// event
// {
//   "typeName": "Query", /* Filled dynamically based on @function usage location */
//   "fieldName": "me", /* Filled dynamically based on @function usage location */
//   "arguments": { /* GraphQL field arguments via $ctx.arguments */ },
//   "identity": { /* AppSync identity object via $ctx.identity */ },
//   "source": { /* The object returned by the parent resolver. E.G. if resolving field 'Post.comments', the source is the Post object. */ },
//   "request": { /* AppSync request object. Contains things like headers. */ },
//   "prev": { /* If using the built-in pipeline resolver support, this contains the object returned by the previous function. */ },
// }

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    /**
     * This is the entry point for the Lambda function.
     * 
     * @param {Object} event - The event object from the Lambda function.
     * 
     * @returns {Object} object - The response from the Lambda function.
     * 
     * @example
     * This interface is handled by AppSync.
     * 
     * handler({
     *  "typeName": "Query",
     * "fieldName": "me",
     * "arguments": {},
     * "identity": {},
     * "source": {},
     * "request": {},
     * "prev": {}
     * })
     * // => { message: 'Hello from Lambda!' }
     * 
     */
    const typeHandler = resolvers[event.typeName];
    if (typeHandler) {
        const resolver = typeHandler[event.fieldName];
        if (resolver) {
            return await resolver(event);
        }
    }
    throw new Error("Resolver not found.");
};



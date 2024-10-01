// react component that renders the chat session with the user and the bot
import React, { useState, useEffect, useRef } from "react";
import { chat, initAssistantEditor, useAssistantEditor } from "../graphql/mutations";
import {
    TextField,
    Button,
    CircularProgress,
    Box,
} from "@mui/material";
import { generateClient } from 'aws-amplify/api';
import { DataStore } from '@aws-amplify/datastore';
import ChatIcon from '@mui/icons-material/Chat';
import { Assistant } from "../models";
import { Section } from "../models";
import { Unit } from "../models";
import UnitContext from "../context/unitContext";

import { updateAssistantEditor, deleteAssistantEditor } from "../graphql/mutations";

const client = generateClient();

const ChatSidebar = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const [assistantId, setAssistantId] = useState(null);
    const [threadId, setThreadId] = useState(null);
    const [modelId, setModelId] = useState(null);
    const [assistants, setAssistants] = useState([]);
    const [thisAssistant, setThisAssistant] = useState(null);
    const [sections, setSections] = useState([]);

    const {
        unit,
        files,
        questionBank,
        dictionary,
    } = React.useContext(UnitContext);

    // const [model, setModel] = useState("gpt-3.5-turbo");

    // const assistantId = useRef(null);

    const sendMessage = async () => {
        setIsBusy(true);
        const newMessages = [...messages, { role: "user", content: message }];
        setMessages(newMessages);
        setMessage("");

        const response = await client.graphql({
            query: chat,
            variables: {
                messages: JSON.stringify(newMessages),
                // model, TODO add model to the mutation when we have access to gpt-4
            },
        })

        // {
        //     "data": {
        //         "chat": "{statusCode=200, body={\"id\":\"chatcmpl-7mZh0vJW0M7u5VxTpaKnJqPJBWsf2\",\"object\":\"chat.completion\",\"created\":1691811302,\"model\":\"gpt-3.5-turbo-0613\",\"choices\":[{\"index\":0,\"message\":{\"role\":\"assistant\",\"content\":\"Hello! How can I assist you today?\"},\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":19,\"completion_tokens\":9,\"total_tokens\":28}}}"
        //     }
        // }



        // {
        //     "data": {
        //       "chat": "{\"id\":\"chatcmpl-7mk4grW87QmcciKFN6ewsSovcv1jq\",\"object\":\"chat.completion\",\"created\":1691851210,\"model\":\"gpt-3.5-turbo-0613\",\"choices\":[{\"index\":0,\"message\":{\"role\":\"assistant\",\"content\":\"Certainly! Here are some of the top search engines:\\n\\n1. Google (www.google.com)\\n2. Bing (www.bing.com)\\n3. Yahoo (www.yahoo.com)\\n4. Baidu (www.baidu.com)\\n5. Yandex (www.yandex.com)\\n6. DuckDuckGo (www.duckduckgo.com)\\n7. AOL (www.aol.com)\\n\\nPlease note that rankings and popularity may vary depending on the region and user preferences.\"},\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":28,\"completion_tokens\":94,\"total_tokens\":122}}"
        //     }
        //   }


        console.log('ChatSidebar.response', response)

        const assistantResponse = JSON.parse(response?.data?.chat || {});

        console.log('ChatSidebar.assistantResponse', assistantResponse)

        const systemMessage = assistantResponse.choices[0].message;

        // Merge the response message with the existing messages
        const mergedMessages = [...newMessages, systemMessage];
        setMessages(mergedMessages);
        setIsBusy(false);
    };

    const messageAssistant = async () => {
        setIsBusy(true);
        const newMessages = [...messages, { role: "user", content: message }];
        setMessages(newMessages);

        console.log('ChatSidebar.assistantId', assistantId)
        console.log('ChatSidebar.threadId', threadId)

        const response = await client.graphql({
            query: useAssistantEditor,
            variables: {
                assistantId,
                threadId,
                threadInstructions: JSON.stringify(newMessages),
            },
        })

        const toolsRuns = JSON.parse(response?.data?.useAssistantEditor || {})

        console.log('ChatSidebar.toolsRuns', toolsRuns)

        const functionCalls = toolsRuns?.required_action?.submit_tool_outputs?.tool_calls || []

        let systemMessage = ''

        for (let i = 0; i < functionCalls.length; i++) {
            const functionCall = functionCalls[i]
            console.log('ChatSidebar.functionCall', functionCall)
            const args = JSON.parse(functionCall?.function?.arguments|| {})
            const name = functionCall?.function?.name

            console.log('ChatSidebar.args', args)
            console.log('ChatSidebar.name', name)

            // for now append to the system message
            systemMessage += `Function: ${name}\n`
            systemMessage += `Arguments: ${JSON.stringify(args)}\n`
        }

        console.log('ChatSidebar.systemMessage', systemMessage)


        // Merge the response message with the existing messages

        const newMessageAssistant = [...messages, { role: "assistant", content: systemMessage }];

        const mergedMessages = [...newMessages, systemMessage];
        setMessages(newMessageAssistant);
        setIsBusy(false);

        // await DataStore.save(
        //     Assistant.copyOf(assistants[0]?.id, updated => {
        //         updated.messages = JSON.stringify(mergedMessages)
        //     })
        // )
    };

    function getInstructions(unit, files, questionBank, dictionary, sections) {
        let additionalInstructions
        // add the current time to the additional instructions
        additionalInstructions = `The following is a summary of records in the database.\nCurrent Time: ${new Date().toLocaleString()}\n\nAll available unit data:\n ${JSON.stringify(unit?.data)}\n`

        if (unit) {
            additionalInstructions += `\nThis Unit is being worked on:\nname|description|id\n${encodeURIComponent(unit.name)}|${encodeURIComponent(unit.description)}|${unit.id}\n`

            // additionalInstructions += `\nData to see what is being worked on: ${JSON.stringify(unit.data)}\n`

        }
        if (sections) {
            console.log('ChatSidebar.sections', sections)
            additionalInstructions += `\nSections already in the database:\nname|description|id\n`
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i]
                additionalInstructions += `${encodeURIComponent(section.name)}|${encodeURIComponent(section.description)}|${section.id}\n`
            }
        }
        if (files) {
            additionalInstructions += `\nFiles already in the database:\nid|name|description|type\n`
            const _files = Object.entries(files)
            console.log('ChatSidebar._files', _files)

            for (let i = 0; i < _files.length; i++) {
                const file = _files[i][1]
                additionalInstructions += `${file.id}|${encodeURIComponent(file.name)}|${encodeURIComponent(file.description)}|${file.mimeType}\n`
            }
        }
        if (questionBank) {
            additionalInstructions += `\nQuestions already in the database:\nid|prompt|answer\n`
            const _questions = Object.entries(questionBank)
            for (let i = 0; i < _questions.length; i++) {
                const question = _questions[i][1]
                additionalInstructions += `${question.id}|${question.prompt}|${question.answer}\n`
            }
        }
        if (dictionary) {
            additionalInstructions += `\nVocabulary Words already in the database:\nid|word|definition\n`

            const _dict = Object.entries(dictionary)
            for (let i = 0; i < _dict.length; i++) {
                const entry = _dict[i][1]
                additionalInstructions += `${entry.id}|${entry.phrase}|${entry.definition}\n`
            }
        }

        console.log('ChatSidebar.additionalInstructions', additionalInstructions)
        return additionalInstructions
    }

    const getAssistant = async (additionalInstructions) => {
        const model = "gpt-4o";

        console.log('ChatSidebar.getAssistant', model, additionalInstructions)
        const _assistant = await client.graphql({
            query: initAssistantEditor,
            variables: {
                model,
                additionalInstructions
            },
        })

        console.log('ChatSidebar._assistant', _assistant)

        const {
            assistantId,
            threadId
        } = JSON.parse(_assistant?.data?.initAssistantEditor || {})

        console.log('ChatSidebar.assistantId', assistantId)
        console.log('ChatSidebar.threadId', threadId)

        return {
            assistantId,
            threadId
        }
    }

    async function deleteAssistant() {
        console.log('deleteAssistant', assistantId)
        console.log('deleteAssistant.assistants', assistants)
        console.log('deleteAssistant.thisAssistant', thisAssistant)

        if (thisAssistant.id) {

            const dataWork = DataStore.delete(Assistant, thisAssistant.id)
            const gqlClient = client.graphql({
                query: deleteAssistantEditor,
                variables: {
                    assistantId,
                    threadId,
                },
            })

            Promise.all([dataWork, gqlClient])

            setMessages([])
            setAssistantId(null)
            setThreadId(null)
            setModelId(null)
            setThisAssistant(null)
        } else {
            console.error('Assistant does not have an id')
        }
    }

    async function fetchAssistants() {
        console.log('fetchAssistants', unit, files, questionBank, dictionary, sections)
        const additionalInstructions = getInstructions(unit, files, questionBank, dictionary, sections)

        console.log('fetchAssistants.additionalInstructions', additionalInstructions)

        const _assistants = await DataStore.query(Assistant)

        console.log('fetchAssistants._assistants', _assistants)
        if (_assistants.length === 0) {

        const {
            assistantId: _assistantId,
            threadId: _thread
        } = await getAssistant(additionalInstructions)
            setAssistantId(_assistantId)
            setThreadId(_thread)
            setModelId(null)
            setThisAssistant(null)

        } else if (_assistants.length > 0) {
            for (let i = 0; i < _assistants.length; i++) {
                const assistant = _assistants[i]

                console.log('fetchAssistants.assistant', assistant)
                if (!assistant?.assistantId) {
                    const {
                        assistantId: _assistantId,
                        threadId: _thread
                    } = await getAssistant(additionalInstructions)

                    //update the assistantId in the model
                    try {
                        await DataStore.save(
                            Assistant.copyOf(assistant, updated => {
                                updated.assistantId = _assistantId
                                updated.threadId = _thread
                            })
                        );
                        console.log('saved assistant')
                    } catch (errors) {
                        console.error(errors)
                    }

                    setAssistantId(_assistantId)
                    setThreadId(_thread)
                    setModelId(assistant.id)
                    setThisAssistant(assistant)

                    break
                } else if (assistant?.assistantId) {
                    setAssistantId(assistant?.assistantId)
                    setThreadId(assistant?.threadId)
                    setModelId(assistant.id)
                    setThisAssistant(assistant)
                    break
                }


            }
            setAssistants(_assistants)
            // if the assistant has messages, set the messages
            if (_assistants[0]?.messages) {
                setMessages(JSON.parse(_assistants[0].messages))
            }
        }
    }

    useEffect(() => {
        fetchAssistants()
        const subscription = DataStore.observe(Assistant).subscribe(() => fetchAssistants())

        return function cleanup() {
            subscription.unsubscribe();
        }
    }, [])

    useEffect(() => {
        fetchSections()
        async function fetchSections() {
            // const myUserId = user.username

            // const sectionData = await DataStore.query(Section, s => s.owner.ne(myUserId))

            const sectionData = await DataStore.query(Section)
            setSections(sectionData)
        }
        const subscription = DataStore.observe(Section).subscribe(() => fetchSections())

        return function cleanup() {
            subscription.unsubscribe();
        }
    }, [])


    // delete and reinitialize the assistant when files change
    // useEffect(() => {
    //     if (assistantId) {
    //         if (files || questionBank || dictionary || unit || sections) {
    //             reinitializeAssistant({
    //                 id: assistantId,
    //                 files,
    //                 questionBank,
    //                 dictionary,
    //                 unit,
    //                 sections
    //             })
    //         }
    //     }
    // }, [JSON.stringify(files), JSON.stringify(questionBank), JSON.stringify(dictionary), JSON.stringify(unit), JSON.stringify(sections), assistantId])

    return (
        <>
            <style global jsx>{`
                .chat-message.user {
                    background-color: lightgray;
                    margin: 0.5rem;
                    border-radius: 1rem;
                    max-width: 90%;
                    align-self: flex-start;
                }
                .chat-message.assistant {
                    background-color: lightblue;
                    border-radius: 1rem;
                    margin: 0.5rem;
                    max-width: 90%;
                    align-self: flex-end;
                }
            `}</style>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "calc(100vh - 15rem)",
                    overflowY: "auto",
                    width: "100%",
                    margin: '0',
                    padding: '0',

                }}
                className="chat-messages">
                <Box
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        margin: '0.5rem 0rem 0.5rem 0rem',
                        padding: '0.5rem',
                        borderBottom: '1px solid #ccc',
                    }}
                >
                    {/* <button
                            onClick={async () => {
                                fetchAssistants();
                            }
                            }>Create Assistant</button> */}
                    <button
                        onClick={async () => {
                            setMessages([]);
                            await deleteAssistant();
                            await fetchAssistants();

                        }
                        }>Clear Chat</button>
                </Box>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`chat-message ${message.role === "user" ? "user" : "assistant"
                            }`}
                    >
                        <pre
                            style={{
                                margin: '1rem',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                textWrap: 'wrap',
                            }}
                        >{message.content}</pre>
                    </div>
                ))}
            </div>
            <div
                // display="flex"
                // flexDirection="row"
                // justifyContent="space-between"
                className="chat-input"
                onClick={(e) => {
                    // do nothing
                    e.stopPropagation();

                }}
            >
                <Box
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        margin: '0.5rem 0rem 0.5rem 0rem',
                        padding: '0.5rem',
                        borderTop: '1px solid #ccc',
                    }}
                >

                    <TextField
                        value={message}
                        onInput={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                // sendMessage();
                                messageAssistant();

                            }
                        }}
                        type='text'
                        style={{
                            width: '90%',
                            margin: '0.2rem'
                        }}
                        id="outlined-basic"
                        label="Chat with your AI Assistant"
                        variant="outlined" />

                    {isBusy &&
                        <Button aria-label="chatting" disabled>
                            <CircularProgress />
                        </Button>

                    }
                    {!isBusy &&
                        <Button aria-label="chat" disabled>
                            <ChatIcon />
                        </Button>
                    }


                    {/* <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button> */}
                </Box>
            </div>
        </>
    );
}

export default ChatSidebar;

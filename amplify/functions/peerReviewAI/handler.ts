/**
 * Peer Review AI Handler
 *
 * Handles AI interactions within peer review rooms:
 * - handleAIMention: Processes @kai mentions in chat, generates responses
 * - generateReviewSummary: Summarises a completed peer review session
 *
 * Uses OpenAI GPT-4 for generation.
 */

import type { Handler } from 'aws-lambda'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { createNotification } from '../shared/notificationUtils'
import {
  readPublishedUnitContent,
  summarizeUnitText,
} from '../shared/unitContent'
import { MAX_UNIT_CONTENT_CHARS, buildAIMentionPrompt } from './prompt'

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_HOMEWORK_ROOM = `query GetHomeworkRoom($id: ID!) {
  getHomeworkRoom(id: $id) {
    id gradeId ownerId invitedUserIds status
    _version
    _lastChangedAt
    _deleted
  }
}`

const GET_GRADE = `query GetGrade($id: ID!) {
  getGrade(id: $id) {
    id unitID data accuracy complete feedback owner _version _lastChangedAt _deleted }
}`

const GET_UNIT = `query GetUnit($id: ID!) {
  getUnit(id: $id) { id name description _version _lastChangedAt _deleted }
}`

const GET_STUDENT_MEMORY = `query GetStudentMemory($studentId: String!) {
  listStudentMemoryByStudentId(studentId: $studentId) {
    items { id studentId memoryMarkdown _version _lastChangedAt _deleted }
  }
}`

const UPDATE_HOMEWORK_ROOM = `mutation UpdateHomeworkRoom($input: UpdateHomeworkRoomInput!) {
  updateHomeworkRoom(input: $input) { id status aiReviewSummary _version _lastChangedAt _deleted }
}`

// ============================================================================
// Configure Amplify
// ============================================================================

let client: any = null

function getClient() {
  if (!client) {
    Amplify.configure(
      {
        API: {
          GraphQL: {
            endpoint: process.env.API_ENDPOINT!,
            region: process.env.AWS_REGION!,
            defaultAuthMode: 'iam',
          },
        },
      },
      { ssr: true },
    )
    client = generateClient()
  }
  return client
}

// ============================================================================
// OpenAI Helper
// ============================================================================

async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 1000,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// ============================================================================
// Handler
// ============================================================================

export const handler: Handler = async (event) => {
  const { fieldName, arguments: args, identity } = event
  const gqlClient = getClient()

  try {
    switch (fieldName) {
      case 'handleAIMention':
        return await handleAIMention(gqlClient, args, identity)
      case 'generateReviewSummary':
        return await handleGenerateReviewSummary(gqlClient, args)
      default:
        throw new Error(`Unknown operation: ${fieldName}`)
    }
  } catch (error: any) {
    console.error(`[peerReviewAI] ${fieldName} error:`, error)
    throw error
  }
}

// ============================================================================
// handleAIMention — Respond to @kai in peer review chat
// ============================================================================

async function handleAIMention(
  gqlClient: any,
  args: { roomId: string; message: string; chatHistory?: string },
  identity: any,
) {
  const { roomId, message, chatHistory } = args

  // Fetch room and grade for context
  const { data: roomData } = await gqlClient.graphql({
    query: GET_HOMEWORK_ROOM,
    variables: { id: roomId },
  })
  const room = roomData?.getHomeworkRoom
  if (!room) throw new Error('Room not found')

  // Fetch grade data
  const { data: gradeData } = await gqlClient.graphql({
    query: GET_GRADE,
    variables: { id: room.gradeId },
  })
  const grade = gradeData?.getGrade
  if (!grade) throw new Error('Grade not found')

  // Fetch unit for assignment context
  const { data: unitData } = await gqlClient.graphql({
    query: GET_UNIT,
    variables: { id: grade.unitID },
  })
  const unit = unitData?.getUnit

  // Assignment text from the published unit (S3); the review still works without it
  const unitText = summarizeUnitText(
    await readPublishedUnitContent(grade.unitID),
    MAX_UNIT_CONTENT_CHARS,
  )

  // Fetch student memory
  const { data: memoryData } = await gqlClient.graphql({
    query: GET_STUDENT_MEMORY,
    variables: { studentId: grade.owner },
  })
  const memory =
    memoryData?.listStudentMemoryByStudentId?.items?.[0]?.memoryMarkdown || ''

  // Build system prompt
  const systemPrompt = buildAIMentionPrompt(unit, grade, memory, unitText)

  const userMessage = chatHistory
    ? `Chat history:\n${chatHistory}\n\nCurrent message: ${message}`
    : message

  const response = await callOpenAI(systemPrompt, userMessage)

  return { response, roomId }
}

// ============================================================================
// generateReviewSummary — Create AI summary of completed review
// ============================================================================

async function handleGenerateReviewSummary(
  gqlClient: any,
  args: { roomId: string; chatLog: string },
) {
  const { roomId, chatLog } = args

  // Fetch room
  const { data: roomData } = await gqlClient.graphql({
    query: GET_HOMEWORK_ROOM,
    variables: { id: roomId },
  })
  const room = roomData?.getHomeworkRoom
  if (!room) throw new Error('Room not found')

  // Fetch grade
  const { data: gradeData } = await gqlClient.graphql({
    query: GET_GRADE,
    variables: { id: room.gradeId },
  })
  const grade = gradeData?.getGrade

  const systemPrompt = `You are an AI teaching assistant summarizing a peer review session.
Create a brief, constructive summary (3-5 bullet points) of what was discussed,
what feedback was given, and any action items. Be encouraging and specific.
The summary will be shown to both the student and the reviewer.`

  const userMessage = `Assignment: ${grade?.unitID || 'Unknown'}
Student accuracy: ${grade?.accuracy ?? 'N/A'}%

Peer Review Chat Log:
${chatLog.slice(0, 8000)}

Please summarize this peer review session.`

  const summary = await callOpenAI(systemPrompt, userMessage, 500)

  // Save summary to room
  await gqlClient.graphql({
    query: UPDATE_HOMEWORK_ROOM,
    variables: {
      input: {
        id: roomId,
        status: 'REVIEW_COMPLETE',
        aiReviewSummary: summary,
        _version: room._version ?? 1,
      },
    },
  })

  // Notify room owner that review is complete
  if (room.ownerId) {
    try {
      await createNotification(gqlClient, {
        recipientId: room.ownerId,
        type: 'PEER_REVIEW_COMPLETE',
        title: 'Peer Review Complete',
        body: 'Your peer review session has been summarized. Check the results!',
        linkPath: `/review/${roomId}`,
        linkLabel: 'View Summary',
        referenceId: roomId,
        referenceType: 'HomeworkRoom',
        senderName: 'System',
      })
    } catch (err) {
      console.warn('[peerReviewAI] notification creation failed:', err)
    }
  }

  return { summary, roomId }
}

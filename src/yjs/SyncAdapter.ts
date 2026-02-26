/**
 * SyncAdapter - Converts Yjs updates to GraphQL mutations
 * 
 * Bridges Yjs CRDT state with Amplify GraphQL API for persistence
 */

import * as Y from 'yjs'
import { GraphQLClient } from 'graphql-request'

export interface SyncAdapterConfig {
  apiEndpoint: string
  apiKey?: string
  authToken?: string
}

export interface DocumentSnapshot {
  id: string
  docName: string
  snapshot: string // base64 encoded Y.encodeState
  version: number
  updatedAt: string
}

export class SyncAdapter {
  private client: GraphQLClient
  private snapshots: Map<string, DocumentSnapshot> = new Map()

  constructor(config: SyncAdapterConfig) {
    const headers: Record<string, string> = {}

    if (config.apiKey) {
      headers['x-api-key'] = config.apiKey
    }
    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`
    }

    this.client = new GraphQLClient(config.apiEndpoint, { headers })
  }

  /**
   * Save Y.Doc snapshot to GraphQL backend
   */
  async saveSnapshot(docName: string, ydoc: Y.Doc, docId: string): Promise<void> {
    try {
      const state = Y.encodeStateAsUpdate(ydoc)
      const stateBase64 = Buffer.from(state).toString('base64')

      const snapshot: DocumentSnapshot = {
        id: docId,
        docName,
        snapshot: stateBase64,
        version: 1,
        updatedAt: new Date().toISOString(),
      }

      // This would be replaced with actual Amplify GraphQL mutation
      // For now, just log and store locally
      console.log(`[SyncAdapter] Saving snapshot for ${docName}`)
      this.snapshots.set(docName, snapshot)
    } catch (error) {
      console.error(`[SyncAdapter] Error saving snapshot:`, error)
      throw error
    }
  }

  /**
   * Load Y.Doc from GraphQL backend
   */
  async loadSnapshot(docName: string): Promise<Uint8Array | null> {
    try {
      const snapshot = this.snapshots.get(docName)
      if (!snapshot) {
        return null
      }

      const state = Buffer.from(snapshot.snapshot, 'base64')
      return new Uint8Array(state)
    } catch (error) {
      console.error(`[SyncAdapter] Error loading snapshot:`, error)
      throw error
    }
  }

  /**
   * Sync Unit document
   */
  async syncUnit(unitId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const metadata = ydoc.getMap('metadata')
      const editorContent = ydoc.getText('editorContent').toString()

      // Extract snapshot
      const state = Y.encodeStateAsUpdate(ydoc)
      const stateBase64 = Buffer.from(state).toString('base64')

      // Would call: updateUnit(id, { data: editorContent, yjsSnapshot: stateBase64 })
      console.log(`[SyncAdapter] Syncing Unit ${unitId}`)
      console.log(`  - Editor content length: ${editorContent.length}`)
      console.log(`  - Snapshot size: ${stateBase64.length}`)
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing Unit:`, error)
      throw error
    }
  }

  /**
   * Sync Grade document
   */
  async syncGrade(gradeId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const gradeData = ydoc.getMap('data')
      const feedback = ydoc.getMap('feedback')

      // Convert Y.Map to plain objects
      const gradeObject: Record<string, any> = {}
      gradeData.forEach((value, key) => {
        gradeObject[key] = value
      })

      const feedbackObject: Record<string, any> = {}
      feedback.forEach((value, key) => {
        feedbackObject[key] = value
      })

      // Would call: updateGrade(id, { data: JSON.stringify(gradeObject), feedback: JSON.stringify(feedbackObject) })
      console.log(`[SyncAdapter] Syncing Grade ${gradeId}`)
      console.log(`  - Grade data keys: ${Object.keys(gradeObject).length}`)
      console.log(`  - Feedback keys: ${Object.keys(feedbackObject).length}`)
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing Grade:`, error)
      throw error
    }
  }

  /**
   * Sync Chat document
   */
  async syncChat(chatId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const messages = ydoc.getArray('chatMessages')
      const messageArray = Array.from(messages)

      // Would call: updateAssistantChat(id, { messages: JSON.stringify(messageArray) })
      console.log(`[SyncAdapter] Syncing Chat ${chatId}`)
      console.log(`  - Messages: ${messageArray.length}`)
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing Chat:`, error)
      throw error
    }
  }

  /**
   * Sync Question document
   */
  async syncQuestion(questionId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const questionData = ydoc.getMap('questions')

      const questions: Record<string, any> = {}
      questionData.forEach((value, key) => {
        questions[key] = value
      })

      // Would call: updateQuestion(id, { data: JSON.stringify(questions) })
      console.log(`[SyncAdapter] Syncing Question ${questionId}`)
      console.log(`  - Questions: ${Object.keys(questions).length}`)
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing Question:`, error)
      throw error
    }
  }

  /**
   * Sync ParsedContent document
   */
  async syncParsedContent(contentId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const parsedData = ydoc.getMap('parsedContent')
      const status = parsedData.get('status') || 'pending'
      const progress = parsedData.get('progress') || '0%'

      const vocabulary = parsedData.get('vocabularyJSON') || []
      const summaries = parsedData.get('summariesJSON') || []
      const concepts = parsedData.get('conceptsJSON') || []
      const questions = parsedData.get('questionsJSON') || []

      // Would call: updateParsedContent(id, { status, progress, vocabularyJSON, summariesJSON, ... })
      console.log(`[SyncAdapter] Syncing ParsedContent ${contentId}`)
      console.log(`  - Status: ${status} (${progress})`)
      console.log(`  - Vocabulary: ${(vocabulary as any[]).length || 0}`)
      console.log(`  - Summaries: ${(summaries as any[]).length || 0}`)
      console.log(`  - Concepts: ${(concepts as any[]).length || 0}`)
      console.log(`  - Questions: ${(questions as any[]).length || 0}`)
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing ParsedContent:`, error)
      throw error
    }
  }

  /**
   * Sync Workbook (Grade) document for collaborative student-tutor editing
   * 
   * This syncs the collaborative workbook data back to the Grade model.
   * The workbook uses Y.js for real-time collaboration between students and tutors.
   */
  async syncWorkbook(gradeId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const workbookData = ydoc.getMap('workbookData')
      const feedbackData = ydoc.getMap('feedback')
      const metadataData = ydoc.getMap('metadata')

      // Convert Y.Maps to plain objects
      const workbookObject: Record<string, any> = {}
      workbookData.forEach((value, key) => {
        workbookObject[key] = value
      })

      const feedbackObject: Record<string, any> = {}
      feedbackData.forEach((value, key) => {
        feedbackObject[key] = value
      })

      const metadataObject: Record<string, any> = {}
      metadataData.forEach((value, key) => {
        metadataObject[key] = value
      })

      // Calculate completion and accuracy
      const blockIds = Object.keys(workbookObject)
      const completedBlocks = blockIds.filter((id) => workbookObject[id].complete === true)
      const percentComplete = blockIds.length > 0 
        ? Math.round((completedBlocks.length / blockIds.length) * 100) 
        : 0

      const accuracies = blockIds
        .map((id) => workbookObject[id].accuracy)
        .filter((acc): acc is number => typeof acc === 'number')
      
      const accuracy = accuracies.length > 0
        ? Math.round(accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length)
        : 0

      // Would call: updateGrade(id, { 
      //   data: JSON.stringify(workbookObject), 
      //   feedback: JSON.stringify(feedbackObject),
      //   percentComplete,
      //   accuracy,
      //   complete: percentComplete === 100
      // })
      console.log(`[SyncAdapter] Syncing Workbook (Grade) ${gradeId}`)
      console.log(`  - Total blocks: ${blockIds.length}`)
      console.log(`  - Completed blocks: ${completedBlocks.length}`)
      console.log(`  - Completion: ${percentComplete}%`)
      console.log(`  - Accuracy: ${accuracy}%`)
      console.log(`  - Feedback entries: ${Object.keys(feedbackObject).length}`)
      console.log(`  - Metadata entries: ${Object.keys(metadataObject).length}`)
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing Workbook:`, error)
      throw error
    }
  }

  /**
   * Load workbook data from Grade into Y.Doc
   * 
   * This initializes a collaborative workbook session from existing Grade data
   */
  async loadWorkbook(gradeId: string, gradeDataJson: string, ydoc: Y.Doc): Promise<void> {
    try {
      const workbookData = ydoc.getMap('workbookData')
      
      if (!gradeDataJson) {
        console.log(`[SyncAdapter] No existing data for workbook ${gradeId}`)
        return
      }

      const gradeData = JSON.parse(gradeDataJson)
      
      // Populate Y.Map with grade data
      Object.entries(gradeData).forEach(([blockId, blockData]) => {
        workbookData.set(blockId, blockData)
      })

      console.log(`[SyncAdapter] Loaded ${Object.keys(gradeData).length} blocks into workbook ${gradeId}`)
    } catch (error) {
      console.error(`[SyncAdapter] Error loading workbook:`, error)
      throw error
    }
  }

  /**
   * Get snapshot metadata
   */
  getSnapshotInfo(docName: string): Record<string, any> | null {
    const snapshot = this.snapshots.get(docName)
    if (!snapshot) return null

    return {
      docName: snapshot.docName,
      size: snapshot.snapshot.length,
      version: snapshot.version,
      updatedAt: snapshot.updatedAt,
    }
  }
}

export default SyncAdapter

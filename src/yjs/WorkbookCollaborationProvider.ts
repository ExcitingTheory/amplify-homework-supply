/**
 * WorkbookCollaborationProvider - Specialized YJS provider for collaborative student workbooks
 * 
 * Enables real-time collaboration between students and tutors on workbook assignments.
 * Uses per-student Grade ID as the room identifier, ensuring each student has their
 * own collaborative space that tutors can join.
 * 
 * @module WorkbookCollaborationProvider
 */

import * as Y from 'yjs'
import { YjsDocProvider, YjsProviderConfig } from './YjsProvider'
import { Awareness } from 'y-protocols/awareness'

export interface WorkbookUser {
  username: string
  role: 'student' | 'tutor' | 'instructor' | 'admin'
  displayName?: string
  color?: string
  cursor?: {
    blockId?: string
    position?: number
  }
}

export interface WorkbookCollaborationConfig extends Omit<YjsProviderConfig, 'docName'> {
  gradeId: string // The Grade record ID - this is the unique workbook identifier
  user: WorkbookUser // Current user information
  onTutorJoin?: (tutor: WorkbookUser) => void
  onTutorLeave?: (tutor: WorkbookUser) => void
  onStudentDisconnect?: () => void
  autoSyncToGrade?: boolean // Automatically sync to Grade.data field
  syncInterval?: number // Debounce interval for Grade.data sync (ms)
}

export interface WorkbookBlockData {
  [blockId: string]: {
    complete?: boolean
    accuracy?: number
    userAnswer?: any
    feedback?: string
    timestamp?: string
    attempts?: number
  }
}

export interface CommentReply {
  id: string
  author: string
  authorRole: string
  displayName?: string
  text: string
  createdAt: string
}

export interface CommentThread {
  id: string
  blockId: string
  author: string
  authorRole: string
  displayName?: string
  text: string
  replies: CommentReply[]
  resolved: boolean
  createdAt: string
}

export interface HistoryEntry {
  userId: string
  displayName: string
  timestamp: string
  fieldChanged: string
  oldValue: any
  newValue: any
}

/**
 * Collaborative provider for student workbooks with tutor support
 * 
 * Features:
 * - Per-student workbook rooms using Grade ID
 * - Real-time collaboration between student and tutors
 * - Awareness tracking (who's editing, cursor positions)
 * - Auto-sync to Grade.data field
 * - Permission checks based on user roles
 * 
 * @example
 * ```typescript
 * const provider = new WorkbookCollaborationProvider({
 *   gradeId: 'grade-123',
 *   user: {
 *     username: 'student@example.com',
 *     role: 'student',
 *     displayName: 'John Doe',
 *     color: '#3b82f6'
 *   },
 *   onTutorJoin: (tutor) => {
 *     console.log(`Tutor ${tutor.displayName} joined to help`)
 *   }
 * })
 * 
 * // Get workbook data
 * const workbookData = provider.getWorkbookData()
 * 
 * // Update block
 * provider.updateBlock('quiz-block-1', {
 *   userAnswer: 2,
 *   complete: true,
 *   accuracy: 100
 * })
 * ```
 */
export class WorkbookCollaborationProvider extends YjsDocProvider {
  private gradeId: string
  private user: WorkbookUser
  private workbookConfig: WorkbookCollaborationConfig
  private syncTimer: NodeJS.Timeout | null = null
  private cursorDebounceTimer: NodeJS.Timeout | null = null
  private activeTutors: Map<number, WorkbookUser> = new Map()
  
  // Y.js structures for workbook data
  private workbookMap: Y.Map<any>
  private metadataMap: Y.Map<any>
  private feedbackMap: Y.Map<any>
  private commentsMap: Y.Map<CommentThread>

  constructor(config: WorkbookCollaborationConfig) {
    // Create the document name from the grade ID
    const docName = `workbook-${config.gradeId}`
    
    super({
      ...config,
      docName,
    })

    this.gradeId = config.gradeId
    this.user = config.user
    this.workbookConfig = {
      autoSyncToGrade: true,
      syncInterval: 3000, // 3 second debounce
      ...config,
    }

    // Initialize Y.js data structures
    this.workbookMap = this.getMap('workbookData')
    this.metadataMap = this.getMap('metadata')
    this.feedbackMap = this.getMap('feedback')
    this.commentsMap = this.getMap('comments') as Y.Map<CommentThread>

    // Set up awareness with user info
    this.initializeAwareness()

    // Listen for awareness changes (tutors joining/leaving)
    this.setupAwarenessHandlers()

    // Set up auto-sync to Grade.data if enabled
    if (this.workbookConfig.autoSyncToGrade) {
      this.setupAutoSync()
    }
  }

  /**
   * Initialize awareness with current user information
   */
  private initializeAwareness(): void {
    const awareness = this.getAwareness()
    awareness.setLocalState({
      user: this.user,
      timestamp: Date.now(),
      lastInteraction: Date.now(),
      gradeId: this.gradeId,
    })
  }

  /**
   * Set up handlers for awareness changes (users joining/leaving)
   */
  private setupAwarenessHandlers(): void {
    const awareness = this.getAwareness()

    awareness.on('change', ({ added, removed }: { added: number[]; removed: number[] }) => {
      // Handle users joining
      added.forEach((clientId) => {
        if (clientId === awareness.clientID) return // Skip self

        const state = this.getClientState(clientId)
        if (state?.user) {
          const user = state.user as WorkbookUser

          // Track if it's a tutor/instructor
          if (user.role === 'tutor' || user.role === 'instructor' || user.role === 'admin') {
            this.activeTutors.set(clientId, user)
            this.workbookConfig.onTutorJoin?.(user)
          }
        }
      })

      // Handle users leaving
      removed.forEach((clientId) => {
        const tutor = this.activeTutors.get(clientId)
        if (tutor) {
          this.activeTutors.delete(clientId)
          this.workbookConfig.onTutorLeave?.(tutor)
        }

        // Check if student disconnected
        const state = this.getClientState(clientId)
        if (state?.user?.role === 'student') {
          this.workbookConfig.onStudentDisconnect?.()
        }
      })
    })
  }

  /**
   * Set up automatic syncing to Grade.data field
   */
  private setupAutoSync(): void {
    const ydoc = this.getDoc()

    ydoc.on('update', () => {
      // Debounce the sync
      if (this.syncTimer) {
        clearTimeout(this.syncTimer)
      }

      this.syncTimer = setTimeout(() => {
        this.triggerGradeSync()
      }, this.workbookConfig.syncInterval)
    })
  }

  /**
   * Trigger sync to Grade.data field
   * This would be implemented by the consuming code using DataStore
   */
  private triggerGradeSync(): void {
    // Emit event that can be caught by consuming code
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('workbook-sync', {
        detail: {
          gradeId: this.gradeId,
          data: this.getWorkbookData(),
          feedback: this.getFeedback(),
          metadata: this.getMetadata(),
        },
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * Get all workbook block data
   */
  getWorkbookData(): WorkbookBlockData {
    const data: WorkbookBlockData = {}
    this.workbookMap.forEach((value, key) => {
      data[key] = value
    })
    return data
  }

  /**
   * Update a single block's data
   */
  updateBlock<T extends Partial<WorkbookBlockData[string]>>(
    blockId: string,
    data: T
  ): void {
    const currentData = this.workbookMap.get(blockId) || {}
    const updatedData = {
      ...currentData,
      ...data,
      timestamp: new Date().toISOString(),
    }
    this.workbookMap.set(blockId, updatedData)

    // Record history for each changed field
    for (const key of Object.keys(data)) {
      if (key === 'timestamp') continue
      const oldVal = currentData[key]
      const newVal = (data as any)[key]
      if (oldVal !== newVal) {
        this.recordHistory(blockId, key, oldVal, newVal)
      }
    }

    this.touchLastInteraction()
  }

  /**
   * Get data for a specific block
   */
  getBlock(blockId: string): WorkbookBlockData[string] | undefined {
    return this.workbookMap.get(blockId)
  }

  /**
   * Delete a block's data
   */
  deleteBlock(blockId: string): void {
    this.workbookMap.delete(blockId)
  }

  /**
   * Get all feedback data
   */
  getFeedback(): Record<string, any> {
    const feedback: Record<string, any> = {}
    this.feedbackMap.forEach((value, key) => {
      feedback[key] = value
    })
    return feedback
  }

  /**
   * Add or update feedback for a block
   */
  setFeedback(blockId: string, feedback: any): void {
    this.feedbackMap.set(blockId, {
      ...feedback,
      timestamp: new Date().toISOString(),
      author: this.user.username,
      authorRole: this.user.role,
    })
  }

  /**
   * Get workbook metadata
   */
  getMetadata(): Record<string, any> {
    const metadata: Record<string, any> = {}
    this.metadataMap.forEach((value, key) => {
      metadata[key] = value
    })
    return metadata
  }

  /**
   * Update workbook metadata
   */
  updateMetadata(key: string, value: any): void {
    this.metadataMap.set(key, value)
  }

  /**
   * Get list of currently active tutors
   */
  getActiveTutors(): WorkbookUser[] {
    return Array.from(this.activeTutors.values())
  }

  /**
   * Get all connected users (students + tutors)
   */
  getConnectedUsers(): WorkbookUser[] {
    const users: WorkbookUser[] = []
    const awareness = this.getAwareness()

    awareness.getStates().forEach((state) => {
      if (state.user) {
        users.push(state.user as WorkbookUser)
      }
    })

    return users
  }

  /**
   * Check if a tutor is currently helping
   */
  hasTutorPresent(): boolean {
    return this.activeTutors.size > 0
  }

  /**
   * Update current user's cursor position
   */
  updateCursor(blockId: string, position?: number): void {
    // Debounce cursor updates by 300ms
    if (this.cursorDebounceTimer) {
      clearTimeout(this.cursorDebounceTimer)
    }

    this.cursorDebounceTimer = setTimeout(() => {
      const awareness = this.getAwareness()
      const currentState = awareness.getLocalState()

      awareness.setLocalState({
        ...currentState,
        user: {
          ...this.user,
          cursor: {
            blockId,
            position,
          },
        },
        lastInteraction: Date.now(),
      })
    }, 300)
  }

  /**
   * Update the lastInteraction timestamp in awareness state.
   * Called on user actions like block updates.
   */
  private touchLastInteraction(): void {
    const awareness = this.getAwareness()
    const currentState = awareness.getLocalState()
    if (currentState) {
      awareness.setLocalState({
        ...currentState,
        lastInteraction: Date.now(),
      })
    }
  }

  /**
   * Load initial data from Grade.data JSON
   */
  loadFromGradeData(gradeDataJson: string | null): void {
    if (!gradeDataJson) return

    try {
      const gradeData = JSON.parse(gradeDataJson)

      // Populate workbook map with grade data
      Object.entries(gradeData).forEach(([blockId, blockData]) => {
        this.workbookMap.set(blockId, blockData)
      })

      console.log(`[WorkbookCollaboration] Loaded ${Object.keys(gradeData).length} blocks from Grade.data`)
    } catch (error) {
      console.error('[WorkbookCollaboration] Error loading Grade.data:', error)
    }
  }

  /**
   * Export workbook data as JSON for saving to Grade.data
   */
  exportToGradeData(): string {
    const data = this.getWorkbookData()
    return JSON.stringify(data)
  }

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage(): number {
    const blocks = this.getWorkbookData()
    const blockIds = Object.keys(blocks)

    if (blockIds.length === 0) return 0

    const completedBlocks = blockIds.filter(
      (id) => blocks[id].complete === true
    ).length

    return Math.round((completedBlocks / blockIds.length) * 100)
  }

  /**
   * Calculate overall accuracy
   */
  getOverallAccuracy(): number {
    const blocks = this.getWorkbookData()
    const blockIds = Object.keys(blocks)

    if (blockIds.length === 0) return 0

    const accuracies = blockIds
      .map((id) => blocks[id].accuracy)
      .filter((acc): acc is number => typeof acc === 'number')

    if (accuracies.length === 0) return 0

    const sum = accuracies.reduce((acc, val) => acc + val, 0)
    return Math.round(sum / accuracies.length)
  }

  /**
   * Check if user has permission to edit
   */
  canEdit(): boolean {
    // Students can always edit their own workbook
    if (this.user.role === 'student') return true

    // Tutors, instructors, and admins can edit as well
    if (['tutor', 'instructor', 'admin'].includes(this.user.role)) return true

    return false
  }

  /**
   * Check if user can provide feedback
   */
  canProvideFeedback(): boolean {
    return ['tutor', 'instructor', 'admin'].includes(this.user.role)
  }

  /**
   * Clean up and destroy provider
   */
  destroy(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }
    if (this.cursorDebounceTimer) {
      clearTimeout(this.cursorDebounceTimer)
    }
    this.activeTutors.clear()
    super.destroy()
  }

  // ========================================================================
  // Comments
  // ========================================================================

  /**
   * Add a new comment thread to a block.
   */
  addComment(blockId: string, text: string): CommentThread {
    const thread: CommentThread = {
      id: crypto.randomUUID(),
      blockId,
      author: this.user.username,
      authorRole: this.user.role,
      displayName: this.user.displayName,
      text,
      replies: [],
      resolved: false,
      createdAt: new Date().toISOString(),
    }

    this.commentsMap.set(`${blockId}-${thread.id}`, thread)
    this.touchLastInteraction()
    return thread
  }

  /**
   * Reply to an existing comment thread.
   */
  replyToComment(threadKey: string, text: string): void {
    const thread = this.commentsMap.get(threadKey)
    if (!thread) return

    const reply: CommentReply = {
      id: crypto.randomUUID(),
      author: this.user.username,
      authorRole: this.user.role,
      displayName: this.user.displayName,
      text,
      createdAt: new Date().toISOString(),
    }

    this.commentsMap.set(threadKey, {
      ...thread,
      replies: [...thread.replies, reply],
    })
    this.touchLastInteraction()
  }

  /**
   * Resolve or unresolve a comment thread.
   */
  resolveThread(threadKey: string, resolved: boolean = true): void {
    const thread = this.commentsMap.get(threadKey)
    if (!thread) return

    this.commentsMap.set(threadKey, { ...thread, resolved })
  }

  /**
   * Get all comment threads, optionally filtered by blockId.
   */
  getComments(blockId?: string): CommentThread[] {
    const threads: CommentThread[] = []
    this.commentsMap.forEach((thread) => {
      if (!blockId || thread.blockId === blockId) {
        threads.push(thread)
      }
    })
    return threads
  }

  /**
   * Get the comments Y.Map for observation in hooks.
   */
  getCommentsMap(): Y.Map<CommentThread> {
    return this.commentsMap
  }

  // ========================================================================
  // Block-Level Change History
  // ========================================================================

  private static readonly MAX_HISTORY_ENTRIES = 50

  /**
   * Record a history entry for a block change.
   * Call this when a block is updated with field-level changes.
   */
  recordHistory(blockId: string, fieldChanged: string, oldValue: any, newValue: any): void {
    const historyArrayName = `history-${blockId}`
    const historyArray = this.getDoc().getArray<HistoryEntry>(historyArrayName)

    const entry: HistoryEntry = {
      userId: this.user.username,
      displayName: this.user.displayName || this.user.username,
      timestamp: new Date().toISOString(),
      fieldChanged,
      oldValue,
      newValue,
    }

    historyArray.push([entry])

    // Trim to last N entries
    if (historyArray.length > WorkbookCollaborationProvider.MAX_HISTORY_ENTRIES) {
      const excess = historyArray.length - WorkbookCollaborationProvider.MAX_HISTORY_ENTRIES
      historyArray.delete(0, excess)
    }
  }

  /**
   * Get history entries for a block.
   */
  getBlockHistory(blockId: string): HistoryEntry[] {
    const historyArray = this.getDoc().getArray<HistoryEntry>(`history-${blockId}`)
    return Array.from(historyArray)
  }
}

export default WorkbookCollaborationProvider

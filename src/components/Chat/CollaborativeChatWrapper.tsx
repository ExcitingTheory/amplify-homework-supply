/**
 * CollaborativeChatWrapper — Connects ChatPanel to app context.
 *
 * This component bridges SectionContext/GamificationContext with the ChatPanel.
 * Place it inside any page that has SectionProvider to enable collaborative chat.
 */

'use client'

import React, { useContext, useMemo } from 'react'
import { usePathname, useParams } from 'next/navigation'
import AuthContext from '../../context/authContext'
import SectionContext from '../../context/sectionContext'
import { ChatPanel } from './ChatPanel'
import { TopicScope, ChatUser } from '../../yjs/ChatCollaborationProvider'
import { MemberInfo } from '../../utils/chatMentions'

// ============================================================================
// Types
// ============================================================================

export interface CollaborativeChatWrapperProps {
  /** Override room type (defaults to auto-detect from route) */
  roomType?: 'section' | 'squad'
  /** Override room ID */
  roomId?: string
  /** Override scope */
  scope?: TopicScope
  /** Override members list for @mention autocomplete */
  members?: MemberInfo[]
}

// ============================================================================
// Component
// ============================================================================

export function CollaborativeChatWrapper({
  roomType: roomTypeProp,
  roomId: roomIdProp,
  scope: scopeProp,
  members: membersProp,
}: CollaborativeChatWrapperProps = {}) {
  const pathname = usePathname()
  const params = useParams()
  const { user } = useContext(AuthContext) as any
  const { sections } = useContext(SectionContext) as any

  // Build ChatUser from auth context
  const chatUser: ChatUser | null = useMemo(() => {
    if (!user?.attributes?.sub) return null
    return {
      username: user.attributes.sub,
      displayName:
        user.attributes?.name ||
        user.attributes?.preferred_username ||
        user.username ||
        'Anonymous',
      role: user.attributes?.['custom:role'] || 'learner',
    }
  }, [user])

  // Auto-detect scope from route
  const detectedScope: TopicScope = useMemo(() => {
    if (scopeProp) return scopeProp
    const id = params?.id as string | undefined
    if (pathname?.includes('/unit/') && id) return `unit:${id}` as TopicScope
    if (pathname?.includes('/workbook/') && id) return `workbook:${id}` as TopicScope
    if (pathname?.includes('/squad')) return 'squad' as TopicScope
    return 'section' as TopicScope
  }, [pathname, params, scopeProp])

  // Auto-detect room type and ID
  const roomType: 'section' | 'squad' = roomTypeProp || (detectedScope === 'squad' ? 'squad' : 'section')

  const roomId = useMemo(() => {
    if (roomIdProp) return roomIdProp
    // Use the first section ID as the default room
    if (roomType === 'section' && sections?.length > 0) {
      return sections[0].id
    }
    return null
  }, [roomIdProp, roomType, sections])

  // Build members list from section data (simplified — expand as needed)
  const members: MemberInfo[] = useMemo(() => {
    if (membersProp) return membersProp
    // For now return empty — will be populated from section membership data
    return []
  }, [membersProp])

  // Don't render if we can't identify the user or room
  if (!chatUser || !roomId) return null

  return (
    <ChatPanel
      roomType={roomType}
      roomId={roomId}
      user={chatUser}
      scope={detectedScope}
      members={members}
    />
  )
}

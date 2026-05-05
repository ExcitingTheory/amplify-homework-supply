/**
 * Mock peerReviewHooks for Storybook
 * Returns static peer review room state without real Yjs connections.
 */

import { useState, useCallback } from 'react';

export function usePeerReviewRoom(options) {
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      author: 'alice',
      displayName: 'Alice',
      content: 'I think your answer on Q3 could mention osmosis more clearly.',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: 'USER',
    },
    {
      id: 'msg-2',
      author: 'bob',
      displayName: 'Bob',
      content: 'Good point! I also noticed the diagram labels might be switched.',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      type: 'USER',
    },
  ]);

  const sendMessage = useCallback((content, messageType = 'USER', referencedBlockId) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        author: options?.user?.username || 'mock-user',
        displayName: options?.user?.displayName || 'Mock User',
        content,
        timestamp: new Date().toISOString(),
        type: messageType,
        referencedBlockId,
      },
    ]);
  }, [options?.user?.username, options?.user?.displayName]);

  if (!options) {
    return {
      provider: null,
      messages: [],
      roomState: null,
      peers: [],
      typingPeers: [],
      isConnected: false,
      sendMessage: () => {},
      setTyping: () => {},
      inviteUser: () => {},
      closeRoom: () => {},
    };
  }

  return {
    provider: null,
    messages,
    roomState: {
      status: 'OPEN',
      ownerId: 'student-alice-sub',
      gradeId: options.gradeId || 'grade-1',
      createdAt: new Date().toISOString(),
    },
    peers: [
      { username: 'bob', role: 'Learners', displayName: 'Bob' },
    ],
    typingPeers: [],
    isConnected: true,
    sendMessage,
    setTyping: () => {},
    inviteUser: (userId) => console.log('[Mock] Invite user:', userId),
    closeRoom: () => console.log('[Mock] Close room'),
  };
}

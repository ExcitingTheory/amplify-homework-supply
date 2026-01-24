/**
 * VirtualizedMessageList Component
 * 
 * Virtualized list for rendering chat messages with optimal performance.
 * Only renders messages that are visible in the viewport + overscan,
 * dramatically improving performance for long chat histories.
 * 
 * Features:
 * - Virtual scrolling with @tanstack/react-virtual
 * - Dynamic height calculation per message
 * - Auto-scroll to bottom on new messages
 * - "New messages" indicator when scrolled up
 * - Smooth scroll animations
 * - Accessibility support
 */

import React, { useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LexicalMessageRenderer } from './LexicalMessageRenderer';
import { useAutoScroll } from './hooks/useAutoScroll';
import styles from './VirtualizedMessageList.module.css';

/**
 * Message Header Component
 * Shows role and timestamp for each message
 */
const MessageHeader = ({ role, timestamp }) => {
  const roleLabel = role === 'user' ? 'You' : 'Assistant';
  const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : '';
  
  return (
    <div style={{ 
      fontSize: '12px', 
      color: 'var(--text-secondary, #666)', 
      marginBottom: '8px',
      fontWeight: 500,
    }}>
      {roleLabel} {timeStr && `• ${timeStr}`}
    </div>
  );
};

MessageHeader.propTypes = {
  role: PropTypes.oneOf(['user', 'assistant']).isRequired,
  timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
};

/**
 * Tool Results Component
 * Displays results from tool/function calls
 */
const ToolResults = ({ parts }) => {
  if (!parts || parts.length === 0) return null;
  
  return (
    <div style={{ marginTop: '8px' }}>
      {parts.map((part, idx) => {
        if (part.type?.startsWith('tool-') && part.state === 'output-available') {
          return (
            <div 
              key={idx}
              style={{
                background: 'var(--tool-result-bg, #f6f8fa)',
                border: '1px solid var(--tool-result-border, #e1e4e8)',
                borderRadius: '6px',
                padding: '8px 12px',
                margin: '4px 0',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary, #666)' }}>
                {part.type.replace('tool-', '')}
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {typeof part.output === 'object' 
                  ? JSON.stringify(part.output, null, 2)
                  : part.output
                }
              </pre>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

ToolResults.propTypes = {
  parts: PropTypes.arrayOf(PropTypes.object),
};

/**
 * VirtualizedMessageList Component
 * 
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects
 * @param {boolean} [props.showScrollButton=true] - Show scroll-to-bottom button
 * @param {number} [props.estimatedMessageHeight=150] - Estimated height per message for virtualization
 * @param {number} [props.overscan=5] - Number of items to render above/below viewport
 * @param {Function} [props.onMessageClick] - Callback when message is clicked
 * @param {Object} [props.emptyState] - Custom empty state component
 * @param {Function} [props.renderMessage] - Custom message renderer (message, index) => JSX
 * @param {Function} [props.renderToolPart] - Custom tool part renderer (part, message, index) => JSX
 * @param {boolean} [props.useLexicalRenderer=true] - Use Lexical for markdown rendering
 */
export const VirtualizedMessageList = ({ 
  messages,
  showScrollButton = true,
  estimatedMessageHeight = 150,
  overscan = 5,
  onMessageClick,
  emptyState,
  renderMessage,
  renderToolPart,
  useLexicalRenderer = true,
}) => {
  const parentRef = useRef(null);
  
  // Auto-scroll hook
  const { isAtBottom, hasNewMessages, scrollToBottom, handleScroll } = useAutoScroll(
    messages,
    parentRef,
    { bottomThreshold: 50, smoothScroll: true }
  );
  
  // Virtual scrolling configuration
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedMessageHeight,
    overscan,
  });
  
  // Memoize virtual items for performance
  const virtualItems = virtualizer.getVirtualItems();
  
  // Empty state
  if (messages.length === 0) {
    if (emptyState) {
      return emptyState;
    }
    
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>💬</div>
        <div className={styles.emptyText}>No messages yet</div>
        <div className={styles.emptyHint}>Start a conversation to get help</div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div 
        ref={parentRef} 
        className={styles.scrollContainer}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const message = messages[virtualItem.index];
            
            // Allow custom message rendering
            if (renderMessage) {
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {renderMessage(message, virtualItem.index)}
                </div>
              );
            }
            
            // Default rendering with Lexical
            const isUser = message.role === 'user';
            
            // Extract text content from message parts
            const textContent = message.parts
              ?.filter(p => p.type === 'text')
              .map(p => p.text)
              .join('') || message.content || '';
            
            // Extract tool parts
            const toolParts = message.parts
              ?.filter(p => p.type?.startsWith('tool-')) || [];
            
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className={`${styles.messageWrapper} ${isUser ? styles.user : styles.assistant}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={() => onMessageClick?.(message)}
                role="article"
                aria-label={`${isUser ? 'User' : 'Assistant'} message`}
              >
                <MessageHeader 
                  role={message.role} 
                  timestamp={message.createdAt} 
                />
                
                {textContent && useLexicalRenderer && (
                  <LexicalMessageRenderer
                    content={textContent}
                    isStreaming={message.isStreaming}
                  />
                )}
                
                {textContent && !useLexicalRenderer && (
                  <div>{textContent}</div>
                )}
                
                {toolParts.length > 0 && !renderToolPart && (
                  <ToolResults parts={toolParts} />
                )}
                
                {toolParts.length > 0 && renderToolPart && (
                  toolParts.map((part, idx) => (
                    <div key={part.toolCallId || idx}>
                      {renderToolPart(part, message, idx)}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollButton && !isAtBottom && hasNewMessages && (
        <button 
          className={styles.scrollToBottom}
          onClick={() => scrollToBottom()}
          aria-label="Scroll to bottom - new messages available"
          type="button"
        >
          <span>↓</span>
          <span>New messages</span>
        </button>
      )}
    </div>
  );
};

VirtualizedMessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    parts: PropTypes.arrayOf(PropTypes.object),
    content: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    isStreaming: PropTypes.bool,
  })).isRequired,
  showScrollButton: PropTypes.bool,
  estimatedMessageHeight: PropTypes.number,
  overscan: PropTypes.number,
  onMessageClick: PropTypes.func,
  emptyState: PropTypes.node,
};

export default VirtualizedMessageList;

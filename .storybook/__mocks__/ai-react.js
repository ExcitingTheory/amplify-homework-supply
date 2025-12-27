/**
 * Mock ai/react for Storybook
 * Provides a mock implementation of the useChat hook
 */

import { useState, useCallback } from 'react';
import { mockChatAPI } from './chat-api';

export function useChat({ api, body, onError }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use the mock API
      const responseText = await mockChatAPI([...messages, userMessage], body?.context);
      
      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: responseText,
      };

      // Simulate streaming by adding words gradually
      const words = responseText.split(' ');
      let currentContent = '';
      
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        currentContent += (i > 0 ? ' ' : '') + words[i];
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.findIndex(m => m.id === assistantMessage.id);
          
          if (lastIndex >= 0) {
            newMessages[lastIndex] = { ...assistantMessage, content: currentContent };
          } else {
            newMessages.push({ ...assistantMessage, content: currentContent });
          }
          
          return newMessages;
        });
      }
    } catch (error) {
      console.error('[Mock useChat] Error:', error);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, body, onError]);

  const reload = useCallback(() => {
    setMessages([]);
    setInput('');
  }, []);

  const stop = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop,
  };
}

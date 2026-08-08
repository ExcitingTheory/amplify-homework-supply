/**
 * VirtualizedMessageList Storybook Stories
 * 
 * Demonstrates the virtualized chat message list with various scenarios
 */

import React from 'react';
import { VirtualizedMessageList } from './VirtualizedMessageList';
import { expect } from 'storybook/test'

export default {
  title: '💬 AI Assistant/Components/Virtualized Message List',
  component: VirtualizedMessageList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Virtualized chat message list with Lexical rendering and auto-scroll behavior.',
      },
    },
  },
};

// Generate mock messages
const generateMessages = (count, includeTools = false) => {
  const messages = [];
  
  for (let i = 0; i < count; i++) {
    const isUser = i % 2 === 0;
    const parts = [];
    
    // Add text part
    if (isUser) {
      parts.push({
        type: 'text',
        text: `User message ${i + 1}: Can you help me with Japanese grammar?`,
      });
    } else {
      // Vary assistant responses
      const responses = [
        `Sure! Let me explain. **Grammar** is important in Japanese.\n\nHere's an example:\n\`\`\`javascript\nconst greeting = "こんにちは";\nconsole.log(greeting);\n\`\`\``,
        `Of course! Japanese uses three writing systems:\n- Hiragana (ひらがな)\n- Katakana (カタカナ)\n- Kanji (漢字)`,
        `Here's a *simple* rule: Subject + Object + **Verb**`,
        `Response ${i + 1} with some markdown formatting and code.`,
      ];
      
      parts.push({
        type: 'text',
        text: responses[i % responses.length],
      });
      
      // Occasionally add tool invocation
      if (includeTools && i % 5 === 0) {
        parts.push({
          type: 'tool-search_content',
          toolCallId: `call-${i}`,
          state: 'output-available',
          input: { query: 'Japanese grammar' },
          output: {
            success: true,
            results: [
              { type: 'word', id: '1', phonetic: 'こんにちは', definition: 'Hello' },
              { type: 'word', id: '2', phonetic: 'ありがとう', definition: 'Thank you' },
            ],
          },
        });
      }
    }
    
    messages.push({
      id: `msg-${i}`,
      role: isUser ? 'user' : 'assistant',
      parts,
      createdAt: new Date(Date.now() - (count - i) * 60000).toISOString(),
    });
  }
  
  return messages;
};

// Template
const Template = (args) => (
  <div style={{ height: '600px', border: '1px solid #ccc' }}>
    <VirtualizedMessageList {...args} />
  </div>
);

// Stories

export const Empty = Template.bind({});
Empty.args = {
  messages: [],
};

export const FewMessages = Template.bind({});
FewMessages.args = {
  messages: generateMessages(5),
};
FewMessages.parameters = {
  docs: {
    description: {
      story: 'A short conversation with 5 messages - no virtualization needed.',
    },
  },
};

export const ManyMessages = Template.bind({});
ManyMessages.args = {
  messages: generateMessages(100),
};
ManyMessages.parameters = {
  docs: {
    description: {
      story: 'Long conversation with 100 messages - virtualization optimizes rendering. Scroll to see performance.',
    },
  },
};

export const LargeConversation = Template.bind({});
LargeConversation.args = {
  messages: generateMessages(500),
};
LargeConversation.parameters = {
  docs: {
    description: {
      story: '500 messages - demonstrates extreme virtualization. Only ~10-20 messages rendered in DOM at once.',
    },
  },
};

export const WithToolCalls = Template.bind({});
WithToolCalls.args = {
  messages: generateMessages(20, true),
};
WithToolCalls.parameters = {
  docs: {
    description: {
      story: 'Messages with tool invocations (search results). Shows default tool rendering.',
    },
  },
};

export const StreamingMessage = Template.bind({});
StreamingMessage.args = {
  messages: [
    ...generateMessages(5),
    {
      id: 'streaming',
      role: 'assistant',
      parts: [{
        type: 'text',
        text: 'This is a streaming message that is still being generated',
      }],
      isStreaming: true,
      createdAt: new Date().toISOString(),
    },
  ],
};
StreamingMessage.parameters = {
  docs: {
    description: {
      story: 'Simulates a message being streamed from the AI. Shows streaming cursor.',
    },
  },
};

export const CustomRendering = Template.bind({});
CustomRendering.args = {
  messages: generateMessages(20),
  renderMessage: (message, index) => (
    <div
      style={{
        padding: '12px',
        marginBottom: '8px',
        background: message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
        borderRadius: '8px',
        borderLeft: '4px solid ' + (message.role === 'user' ? '#2196f3' : '#4caf50'),
      }}
    >
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
        {message.role === 'user' ? '👤 You' : '🤖 Assistant'} • Message {index + 1}
      </div>
      <div>
        {message.parts
          ?.filter(p => p.type === 'text')
          .map(p => p.text)
          .join('')}
      </div>
    </div>
  ),
};
CustomRendering.parameters = {
  docs: {
    description: {
      story: 'Custom message renderer - bypass Lexical and use your own UI.',
    },
  },
};

export const NoScrollButton = Template.bind({});
NoScrollButton.args = {
  messages: generateMessages(50),
  showScrollButton: false,
};
NoScrollButton.parameters = {
  docs: {
    description: {
      story: 'Disables the "new messages" scroll button.',
    },
  },
};

export const LargMessages = Template.bind({});
LargMessages.args = {
  messages: [
    {
      id: 'large-1',
      role: 'user',
      parts: [{
        type: 'text',
        text: 'Can you explain Japanese verb conjugation?',
      }],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'large-2',
      role: 'assistant',
      parts: [{
        type: 'text',
        text: `# Japanese Verb Conjugation

Japanese verbs conjugate based on **three groups**:

## Group 1: Godan Verbs (五段動詞)

These verbs end in う (u) syllables and conjugate in a specific pattern.

Examples:
- 書く (kaku) - to write
- 話す (hanasu) - to speak
- 飲む (nomu) - to drink

### Conjugation Pattern

| Form | Example |
|------|---------|
| Dictionary | 書く (kaku) |
| Masu | 書きます (kakimasu) |
| Nai | 書かない (kakanai) |
| Ta | 書いた (kaita) |

## Group 2: Ichidan Verbs (一段動詞)

These verbs end in either る (ru) and have a specific stem.

Examples:
- 食べる (taberu) - to eat
- 見る (miru) - to see

\`\`\`javascript
// Code example
const verb = {
  dictionary: "食べる",
  masu: "食べます",
  nai: "食べない",
  ta: "食べた"
};
\`\`\`

## Group 3: Irregular Verbs

Only two verbs:
1. する (suru) - to do
2. 来る (kuru) - to come

> **Note**: These must be memorized separately!

---

Does this help? Let me know if you need more examples!`,
      }],
      createdAt: new Date().toISOString(),
    },
  ],
  estimatedMessageHeight: 400,
};
LargMessages.parameters = {
  docs: {
    description: {
      story: 'Large messages with complex markdown - demonstrates dynamic height calculation.',
    },
  },
};


Empty.play = async ({ canvasElement }) => {
  expect(canvasElement.textContent?.length).toBeGreaterThan(0)
}

FewMessages.play = async ({ canvasElement }) => {
  expect(canvasElement.textContent?.length).toBeGreaterThan(0)
}

ManyMessages.play = async ({ canvasElement }) => {
  expect(canvasElement.textContent?.length).toBeGreaterThan(0)
}

LargeConversation.play = async ({ canvasElement }) => {
  expect(canvasElement.textContent?.length).toBeGreaterThan(0)
}

WithToolCalls.play = async ({ canvasElement }) => {
  expect(canvasElement.textContent?.length).toBeGreaterThan(0)
}

StreamingMessage.play = async ({ canvasElement }) => {
  expect(canvasElement.textContent?.length).toBeGreaterThan(0)
}

CustomRendering.play = async ({ canvasElement }) => {
  expect(canvasElement.textContent?.length).toBeGreaterThan(0)
}

NoScrollButton.play = async ({ canvasElement }) => {
  expect(canvasElement.textContent?.length).toBeGreaterThan(0)
}

LargMessages.play = async ({ canvasElement }) => {
  expect(canvasElement.textContent?.length).toBeGreaterThan(0)
}

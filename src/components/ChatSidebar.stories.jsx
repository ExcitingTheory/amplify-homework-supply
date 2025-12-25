import React from 'react';
import ChatSidebar from './ChatSidebar';

export default {
  title: 'Components/ChatSidebar',
  component: ChatSidebar,
  parameters: {
    layout: 'padded',
  },
};

export const Default = {
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithMessages = {
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
};

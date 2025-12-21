import React from 'react';
import SidebarTabs from './SidebarTabs';

export default {
  title: 'Components/SidebarTabs',
  component: SidebarTabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'SidebarTabs provides a tabbed interface for Dictionary, Questions, Assistant, Files, and Help sections.',
      },
    },
  },
};

export const Default = {
  render: () => (
    <div style={{ maxWidth: '600px' }}>
      <SidebarTabs />
    </div>
  ),
};

/**
 * Mock CollaborationPlugin for Storybook
 * Provides a no-op collaboration plugin for stories
 */

import React from 'react';

export default function YjsCollaborationPlugin(props) {
  console.log('[Mock] CollaborationPlugin rendered with props:', props);
  return null; // This plugin doesn't render anything in the UI
}

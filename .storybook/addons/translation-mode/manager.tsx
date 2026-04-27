import React from 'react';
import { addons, types } from 'storybook/manager-api';
import { TranslationPanelWrapper } from './components/TranslationPanelWrapper';

// Register the translation mode addon
addons.register('storybook/addon-translation-mode', (api) => {
  console.debug('[Storybook] Translation Mode addon registered');
  
  // Add translation editor panel to the addons panel
  addons.add('storybook/addon-translation-mode/panel', {
    type: types.PANEL,
    title: 'Translations',
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: ({ active }) => <TranslationPanelWrapper api={api} active={active ?? false} />,
  });
});

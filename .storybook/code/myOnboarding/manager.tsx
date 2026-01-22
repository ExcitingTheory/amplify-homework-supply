import { addons, types } from '@storybook/manager-api';
import React from 'react';
import OnboardingPanel from '../../components/OnboardingPanel';

// Register the onboarding panel as a right panel
addons.register('storybook/addon-onboarding-custom', (api: any) => {
  addons.add('storybook/addon-onboarding-custom/panel', {
    type: types.PANEL,
    title: 'Onboarding',
    match: ({ viewMode }) => viewMode === 'story',
    render: () => <OnboardingPanel api={api} />,
  });
});

import { defineFunction } from '@aws-amplify/backend';

export const notificationCronHandler = defineFunction({
  name: 'notification-cron',
  timeoutSeconds: 120,
  memoryMB: 256,
  resourceGroupName: 'data',
  schedule: 'every 1h',
});

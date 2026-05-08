/**
 * @fileoverview Mock for i18next-resources-to-backend (legacy)
 */

export default function resourcesToBackend() {
  return {
    type: 'backend',
    init: () => {},
    read: (language, namespace, callback) => callback(null, {}),
  };
}

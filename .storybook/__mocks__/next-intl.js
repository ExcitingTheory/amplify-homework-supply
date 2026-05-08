/**
 * @fileoverview Mock for next-intl that integrates with Translation Mode
 * This mock ensures all t() calls in stories are captured for translation editing
 */

// Simple mock that returns the key as-is (or from loaded translations)
export const useTranslations = (namespace) => {
  return (key, params) => {
    // Return the key itself for storybook display
    return key;
  };
};

export const useLocale = () => 'en';

export const useMessages = () => ({});

export const NextIntlClientProvider = ({ children }) => children;

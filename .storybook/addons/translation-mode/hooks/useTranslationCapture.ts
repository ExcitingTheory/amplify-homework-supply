import { useContext, useCallback, useEffect } from 'react';
import { TranslationCaptureContext, CapturedTranslation } from '../contexts/TranslationCaptureContext';

interface UseTranslationCaptureOptions {
  storyName?: string;
}

export const useTranslationCapture = (options?: UseTranslationCaptureOptions) => {
  const { captureTranslation } = useContext(TranslationCaptureContext);

  const capture = useCallback(
    (translation: Omit<CapturedTranslation, 'usedIn'>) => {
      captureTranslation({
        ...translation,
        usedIn: options?.storyName ? [options.storyName] : undefined,
      });
    },
    [captureTranslation, options?.storyName]
  );

  return { captureTranslation: capture };
};

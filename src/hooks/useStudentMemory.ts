/**
 * useStudentMemory — Fetches and caches the current student's AI memory document.
 * Used to pass personalized context to OpenAI verify operations.
 */
import { useState, useEffect, useRef } from 'react';
import { getAmplifyClient } from '../utils/amplifyClient';

export function useStudentMemory(studentId?: string): string | undefined {
  const [memory, setMemory] = useState<string | undefined>(undefined);
  const fetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!studentId || fetchedForRef.current === studentId) return;
    fetchedForRef.current = studentId;

    const client = getAmplifyClient();
    if (!client?.models?.StudentMemory) return;

    client.models.StudentMemory.list({
      filter: { studentId: { eq: studentId } },
    }).then(({ data }: any) => {
      const items = data || [];
      if (items.length > 0 && items[0]?.memoryMarkdown) {
        setMemory(items[0].memoryMarkdown);
      }
    }).catch((err: any) => {
      console.warn('[useStudentMemory] Failed to fetch memory:', err);
    });
  }, [studentId]);

  return memory;
}

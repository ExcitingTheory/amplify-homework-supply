/**
 * useVerifyContext — Provides studentMemory, contentContext, and exerciseHistory
 * for AI verify calls. Used by AnswerComponent and CustomAnswerComponent to
 * personalize feedback.
 */
import { useContext, useMemo } from 'react';
import UnitContext from '../context/unitContext';
import FilesContext from '../context/fileContext';
import { useStudentMemory } from './useStudentMemory';
import { buildContentContext } from '../utils/buildContentContext';

/**
 * Build a compact summary of completed blocks from the current session.
 * Included in verify calls so AI has context of prior responses.
 */
function buildExerciseHistory(gradeData: Record<string, any> | undefined): string {
  if (!gradeData || typeof gradeData !== 'object') return '';

  const completedBlocks = Object.entries(gradeData)
    .filter(([, block]) => block?.complete)
    .map(([blockId, block]) => {
      const parts: string[] = [`Block ${blockId}:`];
      if (block.accuracy != null) parts.push(`accuracy=${block.accuracy}%`);
      if (block.userAnswer) parts.push(`answer="${String(block.userAnswer).slice(0, 200)}"`);
      if (block.nailedIt) parts.push('(Nailed It!)');
      return parts.join(' ');
    })
    .slice(0, 10); // Limit to 10 blocks to keep token count reasonable

  if (completedBlocks.length === 0) return '';
  return `## Completed Blocks This Session\n${completedBlocks.join('\n')}`;
}

export function useVerifyContext() {
  const { unit, files, session, grade } = useContext(UnitContext);
  const { documents } = useContext(FilesContext);

  const studentMemory = useStudentMemory(session?.username);

  const contentContext = useMemo(() => {
    const docArray = documents
      ? Object.values(documents).filter(Boolean)
      : [];
    const base = buildContentContext({
      unit,
      files,
      documents: docArray,
    });
    const history = buildExerciseHistory(grade?.data);
    return history ? `${base}\n\n${history}` : base;
  }, [unit?.id, files, documents, grade?.data]);

  return { studentMemory, contentContext };
}

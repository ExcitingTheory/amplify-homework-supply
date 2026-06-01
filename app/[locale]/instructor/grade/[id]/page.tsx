import { getServerClient } from '@/utils/amplifyServerClient';
import { runWithAmplifyServerContext } from '@/utils/amplifyServerUtils';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { GradeActions } from './GradeActions';
import { Alert, Box } from '@mui/material';

function parseJson(value: any) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Cached unit content fetch. Unit content (name, rubric, data) is shared
 * across all grades and rarely changes. Cache keyed by (unitId, unitVersion).
 * Revalidate via revalidateTag(`unit-${unitId}`) when unit is saved.
 */
async function getCachedUnitContent(unitId: string, unitVersion: string) {
  const client = getServerClient();
  const { data: unitData, errors } = await client.models.Unit.get({ id: unitId });
  if (errors?.length) throw new Error(errors[0].message);
  if (!unitData) throw new Error('Unit not found');
  return { id: unitData.id, name: unitData.name || '', data: unitData.data || '' };
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ unitId?: string; studentName?: string; sectionId?: string }>;
}

export default async function InstructorGradePage({ params, searchParams }: Props) {
  const { id: gradeId } = await params;
  const { unitId: queryUnitId, studentName: queryStudentName } = await searchParams;

  // Server-side auth check — redirect to login if not authenticated
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    if (!session?.tokens?.idToken) {
      redirect(`/?returnUrl=/instructor/grade/${gradeId}`);
    }
  } catch {
    redirect(`/?returnUrl=/instructor/grade/${gradeId}`);
  }

  try {
    const client = getServerClient();

    // Fetch the target grade
    const { data: grade, errors: gradeErrors } = await client.models.Grade.get({ id: gradeId });
    if (gradeErrors?.length) throw new Error(gradeErrors[0].message);
    if (!grade) throw new Error('Grade not found');

    const targetUnitId = grade.unitID || queryUnitId;
    if (!targetUnitId) throw new Error('No unit ID found on grade');

    // Get unit version for cache key, then fetch cached content
    const { data: unitMeta } = await client.models.Unit.get(
      { id: targetUnitId },
      { selectionSet: ["id", "_version"] }
    );
    const unitVersion = String(unitMeta?._version || 0);
    const unit = await getCachedUnitContent(targetUnitId, unitVersion);

    // Fetch ALL grades for this student + unit (all attempts)
    const { data: allGrades, errors: allGradesErrors } = await client.models.Grade.list({
      filter: {
        unitID: { eq: targetUnitId },
        owner: { eq: grade.owner },
      },
    });
    if (allGradesErrors?.length) throw new Error(allGradesErrors[0].message);

    // Sort by createdAt descending (newest first)
    const sortedGrades = (allGrades || [])
      .filter((g: any) => g != null && g.id != null)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((g: any, index: number, arr: any[]) => ({
        id: g.id,
        attempt: arr.length - index,
        accuracy: g.accuracy || 0,
        percentComplete: g.percentComplete || 0,
        complete: g.complete || false,
        data: parseJson(g.data),
        feedback: parseJson(g.feedback),
        moderationStatus: g.moderationStatus || null,
        moderationFlags: parseJson(g.moderationFlags) || null,
        moderationCheckedAt: g.moderationCheckedAt || null,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      }));

    // Set moderation from latest grade
    const latest = sortedGrades[0];
    const moderation = latest ? {
      status: latest.moderationStatus,
      flags: latest.moderationFlags,
      checkedAt: latest.moderationCheckedAt,
    } : null;

    const studentName = queryStudentName || grade.owner || 'Student';

    return (
      <GradeActions
        unit={unit}
        grades={sortedGrades}
        studentName={studentName}
        moderation={moderation}
      />
    );
  } catch (err: any) {
    return (
      <Box sx={{ mt: '5rem', p: 2, maxWidth: '1400px', mx: 'auto' }}>
        <Alert severity="error">
          {err.message || 'Failed to load grade data'}
        </Alert>
      </Box>
    );
  }
}

import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { redirect } from "next/navigation";
import { getServerClient } from "@/utils/amplifyServerClient";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { StudentProfileClient } from "./StudentProfileClient";

interface StudentProfilePageProps {
  params: Promise<{ id: string; locale: string; studentId: string }>;
}

export default async function StudentProfilePage({
  params,
}: StudentProfilePageProps) {
  const { id, studentId } = await params;

  let username: string | null = null;
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    username =
      (session?.tokens?.idToken?.payload?.["cognito:username"] as
        string | undefined) ||
      (session?.tokens?.idToken?.payload?.sub as string | undefined) ||
      null;
  } catch {
    // Fall through.
  }

  if (!username) {
    redirect("/?returnUrl=" + encodeURIComponent(`/section/${id}/student/${studentId}`));
  }

  const client = getServerClient();

  let sectionName = "Section";
  let initialProfile: Record<string, any> | null = null;
  let initialMemory: Record<string, any> | null = null;
  let initialActions: Record<string, any>[] = [];

  try {
    const [sectionRes, profileRes, memoryRes, actionRes] = await Promise.all([
      (client as any).models.Section.get({ id }),
      (client as any).models.StudentProfile.list({
        filter: {
          sectionID: { eq: id },
          studentId: { eq: studentId },
        },
        limit: 20,
      }),
      (client as any).models.StudentMemory.list({
        filter: {
          sectionID: { eq: id },
          studentId: { eq: studentId },
        },
        limit: 20,
      }),
      (client as any).models.StudentActionRecord.list({
        filter: {
          sectionID: { eq: id },
          studentId: { eq: studentId },
        },
        limit: 50,
      }),
    ]);

    sectionName = sectionRes?.data?.name || sectionName;
    initialProfile = (profileRes?.data || [])[0] || null;
    initialMemory = (memoryRes?.data || [])[0] || null;
    initialActions = actionRes?.data || [];
  } catch (error) {
    console.error("[StudentProfilePage] Failed to load student profile detail", error);
  }

  const studentLabel =
    initialProfile?.studentName ||
    initialMemory?.studentId ||
    decodeURIComponent(studentId);

  return (
    <StudentProfileClient
      sectionId={id}
      studentId={studentId}
      sectionName={sectionName}
      initialProfile={initialProfile}
      initialMemory={initialMemory}
      initialActions={initialActions}
      studentLabel={studentLabel}
    />
  );
}

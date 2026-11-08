import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Box, Button, Card, Container, Stack, Typography } from "@mui/material";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { listSectionStudents } from "../../../../actions/section";

interface SectionStudentsPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function SectionStudentsPage({
  params,
}: SectionStudentsPageProps) {
  const { id } = await params;

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
    redirect("/?returnUrl=" + encodeURIComponent(`/section/${id}/students`));
  }

  const client = getServerClient();
  let sectionName = "Section";
  let students: Array<{ id: string; name?: string; email?: string }> = [];

  try {
    const [sectionRes, roster] = await Promise.all([
      (client as any).models.Section.get({ id }),
      listSectionStudents(id),
    ]);

    sectionName = sectionRes?.data?.name || sectionName;
    students = (roster?.success ? roster.students || [] : []).filter(
      (student) => student && student.id,
    );
  } catch (error) {
    console.error("[SectionStudentsPage] Failed to load section roster", error);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary">
              Section profiles
            </Typography>
            <Typography variant="h4">{sectionName}</Typography>
          </Box>
          <Button component={Link} href={`/section/${id}`} variant="outlined">
            Back to gradebook
          </Button>
        </Box>

        {students.length === 0 ? (
          <Card sx={{ p: 3 }}>
            <Typography variant="body1">
              No students are enrolled in this section yet.
            </Typography>
          </Card>
        ) : (
          students.map((student) => (
            <Card key={student.id} sx={{ p: 2.5 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Box>
                  <Typography variant="h6">
                    {student.name || student.email || student.id}
                  </Typography>
                  {student.email ? (
                    <Typography variant="body2" color="text.secondary">
                      {student.email}
                    </Typography>
                  ) : null}
                </Box>
                <Button
                  component={Link}
                  href={`/section/${id}/student/${encodeURIComponent(student.id)}`}
                  variant="contained"
                >
                  Open profile
                </Button>
              </Stack>
            </Card>
          ))
        )}
      </Stack>
    </Container>
  );
}

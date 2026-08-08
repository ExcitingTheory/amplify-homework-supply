import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";

const XP_REASON_LABELS = {
  HOMEWORK_SUBMITTED: "Homework Submitted",
  AI_FEEDBACK_REVISED: "AI Feedback Revised",
  ALL_BLOCKS_COMPLETED: "Unit Completed",
  PEER_REVIEW_GIVEN: "Peer Review Given",
  PEER_REVIEW_HOSTED: "Peer Review Hosted",
  NAILED_IT: "Nailed It",
  ON_TIME_SUBMISSION: "On-Time Submission",
  STREAK_3DAY: "3-Day Streak",
  STREAK_7DAY: "7-Day Streak",
  STREAK_14DAY: "14-Day Streak",
  STREAK_30DAY: "30-Day Streak",
  PERFECT_SCORE: "Perfect Score",
  COMEBACK: "Comeback",
  PERSONAL_BEST: "Personal Best",
  EASTER_EGG: "Easter Egg Found",
  SQUAD_CHALLENGE_BONUS: "Squad Challenge Bonus",
  PRACTICE_DRILL_COMPLETED: "Practice Drill",
  PRACTICE_DRILL_ACCURACY_BONUS: "Drill Accuracy Bonus",
};

/** Client component — renderable in Storybook without server context. */
export function XPHistoryContent({ logs = [], totalXP = 0 }) {
  return (
    <Box
      sx={{
        marginTop: "1rem",
        padding: "1rem",
        maxWidth: "60rem",
        margin: "5rem auto 3rem",
      }}
    >
      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" fontWeight={700} color="primary">
            {totalXP.toLocaleString()} XP
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total earned from {logs.length} activities
          </Typography>
        </CardContent>
      </Card>

      {/* XP Log List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            {logs.map((log, index) => (
              <li key={log.id}>
                {index > 0 && <Divider />}
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={
                      XP_REASON_LABELS[log.reason] || log.reason || "XP Award"
                    }
                    secondary={
                      log.createdAt
                        ? new Date(log.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : ""
                    }
                  />
                  <Chip
                    label={`+${log.xpAmount || 0} XP`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </ListItem>
              </li>
            ))}
            {logs.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No XP earned yet"
                  secondary="Complete assignments and activities to earn XP!"
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}

export default async function XPHistoryPage() {
  // Auth check — get the current user's identity server-side
  let username = null;
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    username =
      session?.tokens?.idToken?.payload?.["cognito:username"] ||
      session?.tokens?.idToken?.payload?.sub;
  } catch {
    // Not authenticated
  }

  if (!username) {
    redirect("/");
  }

  // Fetch XP logs for the authenticated user
  let logs = [];
  let totalXP = 0;

  try {
    const client = getServerClient();
    const { data } = await client.models.StudentXPLog.list({
      filter: { studentId: { eq: username } },
      limit: 200,
    });
    const items = (data || [])
      .filter((item) => item != null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    logs = items;
    totalXP = items.reduce((sum, log) => sum + (log.xpAmount || 0), 0);
  } catch (err) {
    console.error("[XPHistory RSC] Failed to fetch logs:", err);
  }

  return <XPHistoryContent logs={logs} totalXP={totalXP} />;
}

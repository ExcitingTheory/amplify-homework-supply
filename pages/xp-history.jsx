import * as React from "react";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nextConfig from "../next-i18next.config";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import MainToolbar from "../src/components/MainToolbar";
import MyAuth from "../src/components/AmplifyAuthenticator";
import { getAmplifyClient } from "../src/utils/amplifyClient";
import { fetchAuthSession } from "aws-amplify/auth";

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
  GUILD_CHALLENGE_BONUS: "Guild Challenge Bonus",
  PRACTICE_DRILL_COMPLETED: "Practice Drill",
  PRACTICE_DRILL_ACCURACY_BONUS: "Drill Accuracy Bonus",
};

function XPHistoryContent() {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [totalXP, setTotalXP] = React.useState(0);
  const client = React.useMemo(() => getAmplifyClient(), []);

  React.useEffect(() => {
    async function fetchLogs() {
      try {
        const session = await fetchAuthSession();
        const username =
          session?.tokens?.idToken?.payload?.["cognito:username"] ||
          session?.tokens?.idToken?.payload?.sub;
        if (!username) return;

        const { data } = await client.models.StudentXPLog.list({
          filter: { studentId: { eq: username } },
        });
        const items = (data || [])
          .filter((item) => item != null)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        setLogs(items);
        setTotalXP(items.reduce((sum, log) => sum + (log.xpAmount || 0), 0));
      } catch (err) {
        console.error("[XPHistory] Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [client]);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography>Loading XP history...</Typography>
      </Box>
    );
  }

  return (
    <>
      <AppBar position="fixed" color="inherit">
        <MainToolbar>
          <Box sx={{ flexGrow: 1, margin: "1rem" }}>
            <Typography variant="h6" component="div">
              XP History
            </Typography>
          </Box>
        </MainToolbar>
      </AppBar>
      <Box
        sx={{
          marginTop: "5rem",
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
                <React.Fragment key={log.id}>
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
                </React.Fragment>
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
    </>
  );
}

export default function XPHistoryPage() {
  return (
    <MyAuth>
      <XPHistoryContent />
    </MyAuth>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "pages", "components"],
        nextI18nextConfig,
      )),
    },
  };
}

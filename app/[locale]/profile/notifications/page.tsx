import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import NotificationList from "../../../../src/components/NotificationList";

export default function NotificationsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper sx={{ overflow: "hidden" }}>
        <NotificationList />
      </Paper>
    </Container>
  );
}

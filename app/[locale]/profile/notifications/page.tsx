"use client";

import React from "react";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import { useRouter } from "next/navigation";
import NotificationList from "../../../../src/components/NotificationList";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper sx={{ overflow: "hidden" }}>
        <NotificationList onNavigate={(path) => router.push(path)} />
      </Paper>
    </Container>
  );
}

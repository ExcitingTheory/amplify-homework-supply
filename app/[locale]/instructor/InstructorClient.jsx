"use client";
import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import { getAmplifyClient } from "@/utils/amplifyClient";
import AuthContext from "@/context/authContext";
import { useChatPageContext } from "@/hooks/useChatPageContext";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import InstructorDashboard from "@/components/InstructorDashboard";
import { CollaborativeChatWrapper } from "@/components/Chat/CollaborativeChatWrapper";

function InstructorPage() {
  const { session: authSession } = React.useContext(AuthContext);
  const [mySections, setMySections] = useState([]);
  const sectionCountRef = useRef(0);

  const userId =
    authSession?.idToken?.payload?.sub ||
    authSession?.username ||
    authSession?.userId;

  useChatPageContext({ sections: mySections });

  useEffect(() => {
    if (!userId) return;
    const client = getAmplifyClient();
    const subscription = client.models.Section.observeQuery().subscribe({
      next: ({ items }) => {
        const validItems = items.filter(
          (item) => item != null && item.id != null,
        );
        if (
          validItems.length === sectionCountRef.current &&
          sectionCountRef.current > 0
        )
          return;
        sectionCountRef.current = validItems.length;
        setMySections(validItems.filter((s) => s.owner === userId));
      },
      error: (error) => {
        const msg =
          error?.message ||
          error?.errors?.[0]?.message ||
          JSON.stringify(error);
        if (
          msg === "{}" ||
          msg === "undefined" ||
          msg.includes("DuplicatedOperationError") ||
          msg.includes("Not Authorized")
        )
          return;
        console.error("[Instructor] Section subscription error:", error);
      },
    });
    return () => subscription.unsubscribe();
  }, [userId]);

  return (
    <>
      <Box
        id="main-content"
        component="main"
        data-tour="dashboard"
        sx={{
          width: "100%",
          maxWidth: "80rem",
          mx: "auto",
          px: { xs: 1.5, sm: 2 },
          py: 3,
        }}
      >
        <InstructorDashboard sections={mySections} />
      </Box>
      <CollaborativeChatWrapper />
    </>
  );
}

export default function InstructorClient() {
  return (
    <GamificationProviderWrapper>
      <InstructorPage />
    </GamificationProviderWrapper>
  );
}

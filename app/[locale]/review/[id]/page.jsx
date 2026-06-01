"use client";
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useTranslations } from "next-intl";

import UnitContext, { UnitProvider } from "@/context/unitContext";
import { FilesProvider } from "@/context/fileContext";
import { DictionaryProvider } from "@/context/dictionaryContext";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import { Workbook } from "@/components/Editor3";
import { PeerReviewChat } from "@/components/PeerReview";
import { PeerReviewFeedbackPrompt } from "@/components/PeerReview/PeerReviewFeedbackPrompt";
import { usePeerReviewRoom } from "@/yjs/peerReviewHooks";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { awardXP } from "../../../actions/gamification";
import {
  handleAIMention as handleAIMentionAction,
  generateReviewSummary as generateReviewSummaryAction,
} from "../../../actions/peerReview";
import { useParams } from "next/navigation";

/**
 * PeerReviewContent — Inner content that consumes UnitContext
 * and renders a split-pane: read-only workbook + chat.
 */
function PeerReviewContent() {
  const { id: roomId } = useParams();
  const t = useTranslations("pages");
  const { session, unit, grade } = useContext(UnitContext);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [closing, setClosing] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);

  // Fetch HomeworkRoom record
  useEffect(() => {
    if (!roomId || !session?.username) return;

    const client = getAmplifyClient();
    client.models.HomeworkRoom.get({ id: roomId })
      .then(({ data }) => {
        if (!data) {
          setError("Review room not found");
        } else {
          setRoom(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load review room:", err);
        setError("Failed to load review room");
      })
      .finally(() => setLoading(false));
  }, [roomId, session?.username]);

  // Connect to the peer review Yjs room
  const peerReview = usePeerReviewRoom(
    room
      ? {
          roomId: room.id,
          gradeId: room.gradeId,
          user: {
            username: session?.username || "",
            role: session?.groups?.[0] || "Learners",
            displayName: session?.username,
          },
          connect: true,
          persistence: false,
        }
      : null,
  );

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  const isOwner = room?.ownerId === session?.username;
  const isClosed = room?.status === "REVIEW_COMPLETE";

  const handleCloseReview = async () => {
    if (!roomId || closing) return;
    setClosing(true);
    try {
      // Build chat log from messages
      const chatLog = peerReview.messages
        .map((m) => `[${m.displayName || m.author}]: ${m.content}`)
        .join("\n");

      // Generate AI summary and close the room
      await generateReviewSummaryAction(roomId, chatLog);

      // Close via Yjs provider
      peerReview.closeRoom();

      // Award XP to participants
      const username = session?.username;
      if (username) {
        // Award host XP
        awardXP(username, "PEER_REVIEW_HOSTED", roomId);
        // Award reviewer XP to peers
        for (const peer of peerReview.peers) {
          if (peer.username !== username) {
            awardXP(peer.username, "PEER_REVIEW_GIVEN", roomId);
          }
        }
      }

      // Show feedback prompt to owner
      if (isOwner) {
        setShowFeedbackPrompt(true);
      }
    } catch (err) {
      console.error("[PeerReview] Error closing review:", err);
    } finally {
      setClosing(false);
    }
  };

  const handleReviewFeedback = (helpful) => {
    console.log(
      `[PeerReview] Owner feedback: ${helpful ? "helpful" : "not helpful"}`,
    );
    // Could persist this to HomeworkRoom or analytics in the future
  };

  const handleAIMention = async (message, chatHistory) => {
    if (!roomId) return;
    try {
      const result = await handleAIMentionAction(roomId, message, chatHistory);
      // Insert AI response as an AI_SUGGESTION message
      if (result?.success && result?.response) {
        peerReview.sendMessage(result.response, "AI_SUGGESTION");
      }
    } catch (err) {
      console.error("[PeerReview] AI mention error:", err);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" noWrap>
          {t("Peer Review")}
        </Typography>
        <Chip
          label={isClosed ? "Completed" : "In Progress"}
          size="small"
          color={isClosed ? "default" : "success"}
          variant="outlined"
        />
        {peerReview.peers.length > 0 && (
          <Chip
            label={`${peerReview.peers.length + 1} online`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
        {isOwner && !isClosed && (
          <Button
            variant="contained"
            color="warning"
            size="small"
            disabled={closing}
            onClick={handleCloseReview}
          >
            {closing ? "Closing..." : "End Review"}
          </Button>
        )}
      </Box>

      {/* Split pane: workbook (left) + chat (right) */}
      <Box
        sx={{
          display: "flex",
          height: "calc(100vh - 96px)",
        }}
      >
        {/* Workbook — read-only for peers, editable for owner */}
        <Box
          sx={{
            flex: "1 1 60%",
            overflow: "auto",
            borderRight: 1,
            borderColor: "divider",
            p: 2,
          }}
        >
          {unit && grade ? (
            <Workbook readOnly={!isOwner} />
          ) : (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Skeleton
                variant="rectangular"
                height={200}
                sx={{ borderRadius: 1, mb: 2 }}
              />
              <Skeleton variant="text" width="60%" sx={{ mx: "auto" }} />
            </Box>
          )}
        </Box>

        {/* Chat panel */}
        <Box
          sx={{
            flex: "0 0 40%",
            maxWidth: 480,
            minWidth: 320,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <PeerReviewChat
            messages={peerReview.messages}
            typingPeers={peerReview.typingPeers}
            isClosed={isClosed}
            onSendMessage={(content) => peerReview.sendMessage(content)}
            onTyping={peerReview.setTyping}
            currentUsername={session?.username || ""}
            onAIMention={handleAIMention}
          />
        </Box>
      </Box>

      <PeerReviewFeedbackPrompt
        open={showFeedbackPrompt}
        onSubmit={handleReviewFeedback}
        onClose={() => setShowFeedbackPrompt(false)}
      />
    </>
  );
}

/**
 * Peer Review page — split-pane workbook + chat.
 *
 * Route: /review/[id] where [id] is the HomeworkRoom ID.
 */
export default function PeerReviewPage() {
  return (
    <UnitProvider>
      <FilesProvider>
        <DictionaryProvider>
          <PeerReviewContent />
        </DictionaryProvider>
      </FilesProvider>
    </UnitProvider>
  );
}

"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PublishedUnitHtmlThumbnail from "@/components/PublishedUnitHtmlThumbnail";
import { PrefetchButton } from "@/components/PrefetchButton";
import PrefetchBadge from "@/components/PrefetchBadge";
import { OpenPeerReviewButton } from "@/components/PeerReview/OpenPeerReviewButton";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { openDiscussion } from "@/utils/chatDiscussBus";
import { useNotifications } from "../../context/notificationContext";
import { DASHBOARD_TOKENS } from "./constants";
import {
  AssignmentCardView,
  type AssignmentCardData,
} from "./AssignmentCardView";

export interface AssignmentCardProps extends AssignmentCardData {
  onCreateReviewRoom?: (
    gradeId: string,
    invitedUserIds: string[],
  ) => Promise<string>;
  onRoomCreated?: (roomId: string) => void;
  /** Omit the S3/gradient thumbnail entirely — for contexts (like the dashboard hero) that don't want imagery. */
  hideThumbnail?: boolean;
}

export function AssignmentCard({
  assignment,
  unit,
  latestGrade,
  locked = false,
  lockStatus,
  isUpNext = false,
  nailedItCount = 0,
  eyebrowLabel,
  onGradient = false,
  accommodation,
  onOpenDrill,
  onRequestGuidance,
  onCreateReviewRoom,
  onRoomCreated,
  hideThumbnail = false,
}: AssignmentCardProps) {
  const t = useTranslations("components");
  const tCard = useTranslations("components.assignmentCard");
  const isCompleted = !!latestGrade;
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const { notifications = [] } = useNotifications();
  const reviewInvitation = React.useMemo(
    () =>
      notifications.find(
        (notification) =>
          notification.type === "PEER_REVIEW_INVITE" &&
          !notification.interacted &&
          notification.linkPath?.includes("/review/"),
      ),
    [notifications],
  );

  return (
    <AssignmentCardView
      assignment={assignment}
      unit={unit}
      latestGrade={latestGrade}
      locked={locked}
      lockStatus={lockStatus}
      isUpNext={isUpNext}
      nailedItCount={nailedItCount}
      eyebrowLabel={eyebrowLabel}
      onGradient={onGradient}
      accommodation={accommodation}
      onOpenDrill={onOpenDrill}
      onRequestGuidance={onRequestGuidance}
      t={tCard}
      reducedMotion={reducedMotion}
      reviewInvitation={reviewInvitation}
      onJoinReview={(path) => router.push(path)}
      onDiscuss={() =>
        openDiscussion({
          sectionID:
            (isCompleted && latestGrade
              ? latestGrade.sectionID
              : assignment.sectionID) || undefined,
          scope: `unit:${assignment.unitID}`,
          topicName: unit?.name || t("assignmentCard.discussionTopicFallback"),
        })
      }
      thumbnail={
        hideThumbnail ? undefined : (
          <PublishedUnitHtmlThumbnail
            unitId={assignment.unitID}
            thumbnailS3Key={unit?.thumbnail}
            fallbackS3Key={unit?.featuredImage}
            fallbackIdentityId={unit?.identityId}
            title={unit?.name}
            size={56}
            desktopWidth={120}
            aspectRatio="1/1"
            fillHeight
          />
        )
      }
      prefetchBadge={<PrefetchBadge unitId={assignment.unitID} />}
      peerReviewButton={
        isCompleted && latestGrade && onCreateReviewRoom ? (
          <OpenPeerReviewButton
            gradeId={latestGrade.id}
            onCreateRoom={onCreateReviewRoom}
            onRoomCreated={onRoomCreated || (() => {})}
          />
        ) : null
      }
      startButton={(() => {
        const button = (
          <PrefetchButton
            data-tour={isCompleted ? undefined : "start-workbook-button"}
            variant="contained"
            size="small"
            href={`/workbook/${assignment.unitID}`}
            startIcon={<EditNoteIcon />}
            sx={{
              width: { xs: "100%", sm: "auto" },
              borderRadius: onGradient
                ? `${DASHBOARD_TOKENS.radius.button}px`
                : undefined,
              ...(onGradient && {
                bgcolor: "common.white",
                color: "#1a1a1a",
                "&:hover": { bgcolor: alpha("#fff", 0.85) },
              }),
            }}
          >
            {isCompleted
              ? t("assignmentCard.review")
              : t("assignmentCard.startWorkbook")}
          </PrefetchButton>
        );

        if (!onGradient) {
          return (
            <Box sx={{ ml: { sm: "auto" }, width: { xs: "100%", sm: "auto" } }}>
              {button}
            </Box>
          );
        }

        // Hero/gradient placement — ring the primary action in a
        // continuously rotating gradient border so it reads clearly
        // against the busy hero background.
        return (
          <Box
            sx={{
              position: "relative",
              ml: { sm: "auto" },
              width: { xs: "100%", sm: "auto" },
              flexShrink: 0,
              p: "2px",
              borderRadius: `${DASHBOARD_TOKENS.radius.button + 2}px`,
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: "50%",
                left: "50%",
                // The button is far wider than it is tall (more so once it
                // stretches full-width on mobile), so a square overscan
                // isn't enough to cover the short axis through a full spin
                // \u2014 overscan height far more than width to compensate.
                width: "200%",
                height: "2000%",
                transform: "translate(-50%, -50%)",
                // Bright, saturated 2-color loop — decorative accent, so it
                // intentionally doesn't follow the muted brand palette.
                background:
                  "conic-gradient(from 0deg, #FFD60A, #FF3CAC, #FFD60A)",
                ...(reducedMotion
                  ? {}
                  : {
                      animation: "startButtonGradientSpin 3s linear infinite",
                    }),
              },
              "@keyframes startButtonGradientSpin": {
                "0%": { transform: "translate(-50%, -50%) rotate(0deg)" },
                "100%": { transform: "translate(-50%, -50%) rotate(360deg)" },
              },
            }}
          >
            <Box sx={{ position: "relative" }}>{button}</Box>
          </Box>
        );
      })()}
    />
  );
}

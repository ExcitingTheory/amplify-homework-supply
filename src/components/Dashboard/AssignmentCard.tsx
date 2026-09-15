"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PublishedUnitHtmlThumbnail from "@/components/PublishedUnitHtmlThumbnail";
import { PrefetchButton } from "@/components/PrefetchButton";
import PrefetchBadge from "@/components/PrefetchBadge";
import { OpenPeerReviewButton } from "@/components/PeerReview/OpenPeerReviewButton";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { openDiscussion } from "@/utils/chatDiscussBus";
import { useNotifications } from "../../context/notificationContext";
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
}

export function AssignmentCard({
  assignment,
  unit,
  latestGrade,
  locked = false,
  lockStatus,
  isUpNext = false,
  nailedItCount = 0,
  accommodation,
  onOpenDrill,
  onRequestGuidance,
  onCreateReviewRoom,
  onRoomCreated,
}: AssignmentCardProps) {
  const t = useTranslations("components.assignmentCard");
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
      accommodation={accommodation}
      onOpenDrill={onOpenDrill}
      onRequestGuidance={onRequestGuidance}
      t={t}
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
          topicName: unit?.name || "Assignment discussion",
        })
      }
      thumbnail={
        <PublishedUnitHtmlThumbnail
          unitId={assignment.unitID}
          thumbnailS3Key={unit?.thumbnail}
          fallbackS3Key={unit?.featuredImage}
          fallbackIdentityId={unit?.identityId}
        />
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
      startButton={
        <PrefetchButton
          data-tour={isCompleted ? undefined : "start-workbook-button"}
          variant="contained"
          size="small"
          href={`/workbook/${assignment.unitID}`}
          startIcon={<EditNoteIcon />}
          sx={{
            ml: { sm: "auto" },
          }}
        >
          {isCompleted ? t("review") : t("startWorkbook")}
        </PrefetchButton>
      }
    />
  );
}

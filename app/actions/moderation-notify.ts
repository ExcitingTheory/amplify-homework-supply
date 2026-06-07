"use server";

/**
 * Moderation Notification Server Action
 *
 * When content is flagged by moderation, this action finds the relevant
 * instructors and admins and creates MODERATION_FLAGGED notifications.
 */

import { getServerClient } from "@/utils/amplifyServerClient";

interface ModerationNotifyParams {
  modelName: string;
  recordId: string;
  sectionId?: string;
  ownerId?: string;
  flaggedCategories: string[];
}

/**
 * Send MODERATION_FLAGGED notifications to section instructor(s) and admins.
 * Called after moderation detects flagged content.
 */
export async function notifyModerationFlagged(
  params: ModerationNotifyParams,
): Promise<void> {
  const { modelName, recordId, sectionId, ownerId, flaggedCategories } = params;

  const client = getServerClient() as any;
  const recipientIds: string[] = [];

  // 1. Find section instructor if sectionId is provided
  if (sectionId) {
    try {
      const { data: section } = await client.models.Section.get({
        id: sectionId,
      });
      if (section?.instructor) {
        recipientIds.push(section.instructor);
      }
      if (section?.owner && section.owner !== section.instructor) {
        recipientIds.push(section.owner);
      }
    } catch (err) {
      console.warn(
        "[moderation-notify] Failed to fetch section instructor:",
        err,
      );
    }
  }

  // 2. Find admins via Cognito group (query users in Admins group)
  // Since we can't easily list Cognito group members from a server action,
  // we query Notifications for known admin recipients from recent system announcements.
  // Alternative: use a dedicated AdminUsers model or env var with admin IDs.
  try {
    const { data: adminSections } = await client.models.Section.list({
      filter: { writableGroups: { contains: "Admins" } },
      limit: 10,
    });
    // Admins who own sections are likely platform admins
    for (const s of adminSections || []) {
      if (s.owner && !recipientIds.includes(s.owner)) {
        recipientIds.push(s.owner);
      }
    }
  } catch {
    // Non-critical - continue with instructor notification
  }

  if (recipientIds.length === 0) {
    console.warn(
      "[moderation-notify] No recipients found for moderation notification",
    );
    return;
  }

  // 3. Create notifications for each recipient
  const categoryList = flaggedCategories.join(", ");
  const title = `Content flagged: ${modelName}`;
  const body = `A ${modelName.toLowerCase()} submission was flagged for: ${categoryList}`;

  // Determine link path based on model type
  let linkPath = "";
  let linkLabel = "Review Content";
  if (modelName === "Grade") {
    linkPath = `/instructor/grade/${recordId}`;
    linkLabel = "Review Submission";
  } else if (modelName === "Unit") {
    linkPath = `/units/${recordId}`;
    linkLabel = "Review Unit";
  } else if (modelName === "HomeworkRoom") {
    linkPath = `/review/${recordId}`;
    linkLabel = "Review Room";
  }

  const notifications = recipientIds.map((recipientId) =>
    client.models.Notification.create({
      recipientId,
      type: "MODERATION_FLAGGED",
      category: "MODERATION",
      title,
      body,
      linkPath,
      linkLabel,
      referenceId: recordId,
      referenceType: modelName,
      senderName: "Moderation System",
      seen: false,
      interacted: false,
      metadata: JSON.stringify({
        modelName,
        recordId,
        sectionId,
        ownerId,
        flaggedCategories,
      }),
    }),
  );

  const results = await Promise.allSettled(notifications);
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.warn(
      `[moderation-notify] ${failed.length}/${results.length} notifications failed`,
    );
  }
}

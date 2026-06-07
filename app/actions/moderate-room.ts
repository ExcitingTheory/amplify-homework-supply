"use server";

/**
 * Batch Moderation for Collaboration Room Messages
 *
 * Moderates accumulated chat messages stored in HomeworkRoom.messages JSON field.
 * Triggered when a room is closed or moves to review status.
 * This catches content that may have been sent through Yjs sync
 * (which can't be moderated in real-time without decoding binary).
 */

import { getServerClient } from "@/utils/amplifyServerClient";
import { moderateContent } from "./moderate";
import { notifyModerationFlagged } from "./moderation-notify";

interface RoomMessage {
  id?: string;
  userId: string;
  text: string;
  timestamp: number;
}

/**
 * Moderate all messages in a collaboration room in batch.
 * Called when room status changes (close, review complete).
 *
 * @returns Array of flagged message indices (if any)
 */
export async function moderateRoomMessages(roomId: string): Promise<{
  totalMessages: number;
  flaggedCount: number;
  flaggedIndices: number[];
}> {
  const client = getServerClient() as any;

  // Fetch the room and its messages
  const { data: room } = await client.models.HomeworkRoom.get({ id: roomId });
  if (!room) {
    return { totalMessages: 0, flaggedCount: 0, flaggedIndices: [] };
  }

  // Parse messages JSON
  let messages: RoomMessage[] = [];
  try {
    if (typeof room.messages === "string") {
      messages = JSON.parse(room.messages);
    } else if (Array.isArray(room.messages)) {
      messages = room.messages;
    }
  } catch {
    return { totalMessages: 0, flaggedCount: 0, flaggedIndices: [] };
  }

  if (messages.length === 0) {
    return { totalMessages: 0, flaggedCount: 0, flaggedIndices: [] };
  }

  // Batch messages into chunks for moderation (to reduce API calls)
  // Moderate up to 10 messages at a time by concatenating
  const BATCH_SIZE = 10;
  const flaggedIndices: number[] = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    const batchText = batch
      .map((m) => m.text || "")
      .filter((t) => t.length > 0)
      .join("\n---\n");

    if (!batchText) continue;

    try {
      const result = await moderateContent({ content: batchText });

      if (result.flagged) {
        // If the batch is flagged, check individual messages
        for (let j = 0; j < batch.length; j++) {
          const msgText = batch[j].text;
          if (!msgText || msgText.length === 0) continue;

          const individualResult = await moderateContent({
            content: msgText,
          });
          if (individualResult.flagged) {
            flaggedIndices.push(i + j);
          }
        }
      }
    } catch (err) {
      console.warn(
        `[batch-moderation] Failed to moderate batch starting at ${i}:`,
        err,
      );
    }
  }

  // If any messages were flagged, notify instructors
  if (flaggedIndices.length > 0) {
    const flaggedMessages = flaggedIndices.map((idx) => messages[idx]);
    const uniqueUsers = [...new Set(flaggedMessages.map((m) => m.userId))];

    await notifyModerationFlagged({
      modelName: "HomeworkRoom",
      recordId: roomId,
      sectionId: room.sectionID || undefined,
      ownerId: room.ownerId,
      flaggedCategories: [`${flaggedIndices.length} message(s) flagged`],
    }).catch((err) =>
      console.warn("[batch-moderation] Notification failed:", err),
    );

    console.warn("[batch-moderation] Flagged messages in room:", {
      roomId,
      flaggedCount: flaggedIndices.length,
      totalMessages: messages.length,
      users: uniqueUsers,
    });
  }

  return {
    totalMessages: messages.length,
    flaggedCount: flaggedIndices.length,
    flaggedIndices,
  };
}

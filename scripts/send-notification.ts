#!/usr/bin/env npx tsx
/**
 * Admin CLI: Send System Notifications
 *
 * Usage:
 *   npx tsx scripts/send-notification.ts --type announcement \
 *     --title "System Update" \
 *     --body "New features available!" \
 *     --expires "2026-06-01T00:00:00Z"
 *
 *   npx tsx scripts/send-notification.ts --type maintenance \
 *     --title "Scheduled Maintenance" \
 *     --body "System will be down May 15, 2-4 AM UTC."
 *
 *   npx tsx scripts/send-notification.ts --type announcement \
 *     --title "Class Update" \
 *     --body "Check the new assignment" \
 *     --section "section-id-123"
 */

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { signIn } from "aws-amplify/auth";
import { parseArgs } from "node:util";

// ============================================================================
// GraphQL
// ============================================================================

const LIST_STUDENT_PROFILES = `query ListStudentProfiles($limit: Int, $nextToken: String) {
  listStudentProfiles(limit: $limit, nextToken: $nextToken) {
    items { id studentId studentName }
    nextToken
  }
}`;

const LIST_SECTION_STUDENTS = `query ListSectionStudents($sectionId: String!) {
  listAssignments(filter: { sectionID: { eq: $sectionId } }) {
    items { learner }
  }
}`;

const CREATE_NOTIFICATION = `mutation CreateNotification($input: CreateNotificationInput!) {
  createNotification(input: $input) { id recipientId type title }
}`;

// ============================================================================
// CLI Argument Parsing
// ============================================================================

const { values } = parseArgs({
  options: {
    type: { type: "string", default: "announcement" },
    title: { type: "string" },
    body: { type: "string" },
    link: { type: "string" },
    expires: { type: "string" },
    section: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: false,
});

if (values.help || !values.title) {
  console.log(`
Usage: npx tsx scripts/send-notification.ts [options]

Options:
  --type <type>       "announcement" or "maintenance" (default: announcement)
  --title <title>     Notification title (required)
  --body <body>       Notification body text
  --link <path>       Link path (e.g., "/offline")
  --expires <iso>     ISO 8601 expiration date
  --section <id>      Send only to users in this section
  -h, --help          Show this help message
`);
  process.exit(values.help ? 0 : 1);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  // Load Amplify config
  let amplifyConfig: any;
  try {
    amplifyConfig = await import("../amplify_outputs.json");
  } catch {
    console.error("Error: amplify_outputs.json not found. Run 'npx ampx sandbox' first.");
    process.exit(1);
  }

  Amplify.configure(amplifyConfig.default || amplifyConfig);

  // Authenticate as admin
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.error("Error: Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables.");
    process.exit(1);
  }

  try {
    await signIn({ username, password });
    console.log("Authentication successful.");
  } catch (err: any) {
    console.error("Authentication failed:", err.message);
    process.exit(1);
  }

  const client = generateClient();

  // Determine notification type
  const notificationType = values.type === "maintenance"
    ? "SYSTEM_MAINTENANCE"
    : "SYSTEM_ANNOUNCEMENT";

  // Get recipient list
  let recipientIds: string[] = [];

  if (values.section) {
    // Section-specific: get students in this section
    console.log(`Querying students in section ${values.section}...`);
    const { data } = await (client as any).graphql({
      query: LIST_SECTION_STUDENTS,
      variables: { sectionId: values.section },
    });
    const assignments = data?.listAssignments?.items || [];
    const uniqueIds = new Set<string>(
      assignments.filter((a: any) => a?.learner).map((a: any) => a.learner),
    );
    recipientIds = [...uniqueIds];
  } else {
    // All users: paginate through student profiles
    console.log("Querying all student profiles...");
    let nextToken: string | null = null;
    do {
      const { data } = await (client as any).graphql({
        query: LIST_STUDENT_PROFILES,
        variables: { limit: 100, nextToken },
      });
      const items = data?.listStudentProfiles?.items || [];
      recipientIds.push(...items.map((p: any) => p.studentId));
      nextToken = data?.listStudentProfiles?.nextToken || null;
    } while (nextToken);
  }

  console.log(`Found ${recipientIds.length} recipients`);

  if (recipientIds.length === 0) {
    console.log("No recipients found. Exiting.");
    process.exit(0);
  }

  // Create notifications in batches
  let created = 0;
  let failed = 0;
  const batchSize = 25;

  for (let i = 0; i < recipientIds.length; i += batchSize) {
    const batch = recipientIds.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((recipientId) =>
        (client as any).graphql({
          query: CREATE_NOTIFICATION,
          variables: {
            input: {
              recipientId,
              type: notificationType,
              category: "SYSTEM",
              title: values.title,
              body: values.body || undefined,
              linkPath: values.link || undefined,
              linkLabel: values.link ? "Learn More" : undefined,
              senderName: "System",
              seen: false,
              interacted: false,
              expiresAt: values.expires || undefined,
              createdAt: new Date().toISOString(),
            },
          },
        }),
      ),
    );

    for (const r of results) {
      if (r.status === "fulfilled") created++;
      else {
        failed++;
        console.warn("Failed:", (r as PromiseRejectedResult).reason?.message);
      }
    }

    process.stdout.write(`\rProgress: ${Math.min(i + batchSize, recipientIds.length)}/${recipientIds.length}`);
  }

  console.log(`\n\nDone! Created: ${created}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

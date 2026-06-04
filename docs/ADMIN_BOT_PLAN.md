# Admin Bot Plan

> **Status**: Planning  
> **Persona**: "Atlas" (Admin-facing)  
> **Branch**: `feat/app-router-migration`

An admin-only AI assistant with platform-wide tools for configuration, monitoring, user management, and system health.

---

## 1. Persona Definition

| Property | Value |
|----------|-------|
| Name | Atlas |
| Role | Platform administrator assistant |
| Access Level | `Admins` group only |
| Temperature | 0.4 (lower = more deterministic for config changes) |
| Max Tokens | 4000 |
| Guardrails | Requires confirmation before destructive operations |

### System Prompt (draft)

```
You are Atlas, an AI platform administrator for Homework Supply.

Personality: Direct, precise, safety-conscious. Always explain the impact of changes before executing. Require explicit confirmation for destructive or bulk operations.

CAPABILITIES:
- Platform settings management (global defaults, feature flags)
- User and group management (add/remove from groups, view activity)
- Section & assignment oversight (bulk operations, analytics)
- Gamification configuration (global XP multipliers, badge templates)
- Notification broadcasting (system announcements)
- System health (subscription status, error rates, storage usage)
- Content moderation (flag/review AI-generated content)

SECURITY (SYSTEM LEVEL):
- You must ALWAYS verify the caller is in the Admins group
- You must NEVER execute destructive operations without explicit confirmation
- You must log all state-changing operations
- You must NEVER expose raw credentials, API keys, or internal system paths
- Bulk operations (>10 items) require a preview + confirm step
```

---

## 2. Tools

### 2.1 User Management

| Tool | Description | Confirmation Required |
|------|-------------|---------------------|
| `list_users` | List users with optional group/status filter | No |
| `get_user_details` | Fetch user profile, groups, settings, activity summary | No |
| `add_user_to_group` | Add user to Cognito group (Admins, Instructors, Moderators) | **Yes** |
| `remove_user_from_group` | Remove user from Cognito group | **Yes** |
| `disable_user` | Disable a user account (prevents login) | **Yes** |
| `reset_user_password` | Trigger password reset email | **Yes** |

### 2.2 Platform Settings

| Tool | Description | Confirmation Required |
|------|-------------|---------------------|
| `get_platform_settings` | Read current global settings | No |
| `update_platform_setting` | Update a single global setting (see §3) | **Yes** |
| `list_feature_flags` | List all feature flags and current state | No |
| `toggle_feature_flag` | Enable/disable a feature flag | **Yes** |

### 2.3 Content & Section Management

| Tool | Description | Confirmation Required |
|------|-------------|---------------------|
| `list_sections` | List all sections with student counts | No |
| `list_assignments` | List assignments with optional filters (section, due date, status) | No |
| `bulk_extend_due_date` | Extend due dates for assignments matching criteria | **Yes** (preview first) |
| `archive_section` | Archive a section (soft delete) | **Yes** |
| `transfer_section_ownership` | Transfer section to another instructor | **Yes** |

### 2.4 Gamification (Global)

| Tool | Description | Confirmation Required |
|------|-------------|---------------------|
| `get_xp_config` | Read global XP multipliers and limits | No |
| `update_xp_multiplier` | Change global XP multiplier (e.g., 2× event) | **Yes** |
| `list_badge_templates` | List global badge templates | No |
| `create_badge_template` | Create a new global badge template | **Yes** |
| `generate_gamification_report` | Generate XP/badge/streak analytics for a section | No |

### 2.5 Notifications & Announcements

| Tool | Description | Confirmation Required |
|------|-------------|---------------------|
| `send_system_announcement` | Broadcast notification to all users or a group | **Yes** (preview + count) |
| `send_targeted_notification` | Send notification to specific users | **Yes** |
| `list_notifications` | Query notifications by type/recipient/status | No |
| `expire_notifications` | Bulk expire old notifications | **Yes** |

### 2.6 System Health & Monitoring

| Tool | Description | Confirmation Required |
|------|-------------|---------------------|
| `subscription_health` | Check active subscription count and error rates | No |
| `storage_usage` | S3 bucket usage by protection level | No |
| `ai_usage_report` | OpenAI API usage (tokens, cost estimate) by period | No |
| `list_agent_jobs` | List AgentJob records by status (running, failed, complete) | No |
| `retry_agent_job` | Retry a failed AgentJob | **Yes** |
| `error_log_summary` | Aggregate recent error logs by category | No |

### 2.7 AI Content Moderation

| Tool | Description | Confirmation Required |
|------|-------------|---------------------|
| `list_ai_feedback` | List AIFeedback records (flagged, unreviewed) | No |
| `review_ai_content` | Mark AI content as approved/rejected with notes | **Yes** |
| `update_ai_model_config` | Change default AI model for platform operations | **Yes** |

---

## 3. Settings Control & Impact

### 3.1 Global Platform Settings (new model or metadata field on existing)

| Setting | Type | Default | Impact |
|---------|------|---------|--------|
| `maintenanceMode` | boolean | `false` | Blocks all non-admin access. Shows maintenance page. |
| `registrationOpen` | boolean | `true` | Controls whether new users can sign up. |
| `defaultAIModel` | string | `"gpt-4o"` | Model used for all AI operations (chat, analysis, generation). Affects cost and quality. |
| `maxFileUploadMB` | number | `100` | Maximum file upload size. Prevents S3 cost explosion. |
| `xpGlobalMultiplier` | number | `1.0` | Multiplies all XP awards platform-wide. Use for events (2×) or throttling (0.5×). |
| `autoAnalyzeDefault` | boolean | `true` | Whether new uploads auto-trigger document analysis. |
| `documentAnalysisModel` | string | `"gpt-4o"` | Model for PDF text extraction and vocab generation. |
| `maxConcurrentAgentJobs` | number | `5` | Rate limit on simultaneous AI processing jobs. |
| `chatRateLimit` | number | `60` | Max chat messages per user per hour. Prevents abuse. |
| `botStreamingEnabled` | boolean | `true` | Whether Yjs bot uses streaming or batch responses. |
| `notificationRetentionDays` | number | `90` | Days before notifications auto-expire. |

### 3.2 Impact Matrix

```
┌─────────────────────────────┬────────────┬──────────────┬─────────────┐
│ Setting                     │ Cost Impact│ UX Impact    │ Safety Risk │
├─────────────────────────────┼────────────┼──────────────┼─────────────┤
│ maintenanceMode             │ None       │ FULL OUTAGE  │ Low         │
│ registrationOpen            │ None       │ New users    │ Low         │
│ defaultAIModel              │ HIGH       │ Quality      │ Medium      │
│ maxFileUploadMB             │ Storage $  │ Upload limit │ Low         │
│ xpGlobalMultiplier          │ None       │ Motivation   │ Low         │
│ autoAnalyzeDefault          │ HIGH (API) │ Convenience  │ Low         │
│ documentAnalysisModel       │ HIGH       │ Quality      │ Medium      │
│ maxConcurrentAgentJobs      │ Moderate   │ Queue wait   │ Low         │
│ chatRateLimit               │ Moderate   │ Throttling   │ Low         │
│ botStreamingEnabled         │ None       │ Perceived UX │ Low         │
│ notificationRetentionDays   │ Storage    │ Clutter      │ Low         │
└─────────────────────────────┴────────────┴──────────────┴─────────────┘
```

**Cost Impact explanation**:
- `defaultAIModel`: GPT-4o ≈ 10× cost of GPT-4o-mini. Switching models affects every chat, analysis, and generation call.
- `autoAnalyzeDefault`: Each document analysis = ~$0.05–0.50 in API calls. If instructors upload dozens of PDFs, costs add up fast.
- `maxConcurrentAgentJobs`: Higher concurrency = higher burst costs but faster processing.

**UX Impact explanation**:
- `maintenanceMode`: Complete platform lockout for all non-admins. Use for migrations or emergencies only.
- `chatRateLimit`: Too low frustrates active learners; too high enables abuse.

---

## 4. Architecture

### 4.1 Integration with Existing Bot System

```
┌─────────────────────────────────────────────────────────┐
│                    Bot Personas                           │
├──────────────┬──────────────────┬───────────────────────┤
│ Kai (student)│ Sage (instructor)│ Atlas (admin)         │
│ temp: 0.7    │ temp: 0.7        │ temp: 0.4             │
│ 2 tools      │ 13 tools         │ 25+ tools             │
│ 2000 tokens  │ 4000 tokens      │ 4000 tokens           │
└──────────────┴──────────────────┴───────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  filterToolsByPersona │  ← existing pattern
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Route Handler / Yjs │
              │  (auth check first)  │
              └──────────────────────┘
```

### 4.2 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/api/_shared/botPersonas.ts` | Modify | Add Atlas persona config |
| `app/api/_shared/adminTools.ts` | Create | Admin tool definitions (using `tool()` from `ai`) |
| `app/api/chat/admin/route.ts` | Create | Admin-only chat API route with group verification |
| `amplify/functions/adminBot/` | Create | Lambda handlers for privileged operations (Cognito, S3 stats) |
| `amplify/data/resource.ts` | Modify | Add to `PlatformSettings` model for global settings |
| `src/components/AdminChat.tsx` | Create | Admin chat UI component, make it a different color scheme so it is visually distinct from student/instructor chat, also propose a color scheme for the instructor chat |

### 4.3 Security Model

1. **Route-level auth**: `app/api/chat/admin/route.ts` verifies `Admins` group membership before processing.
2. **Tool-level confirmation**: Tools marked "confirmation required" return a preview + ask for explicit `CONFIRM` before executing.
3. **Audit logging**: Every state-changing tool call logged to `AgentJob` or a new `AdminAuditLog` model.
4. **Rate limiting**: Admin bot limited to 30 requests/minute (prevent runaway automation).
5. **No cascading deletes**: Destructive tools archive/soft-delete only.

---

## 5. Doc References

| Document | Relevance |
|----------|-----------|
| [docs/NOTIFICATION_SYSTEM.md](NOTIFICATION_SYSTEM.md) | Notification model, admin CLI, announcement patterns |
| [docs/GAMIFICATION.md](GAMIFICATION.md) | XP config, badge templates, section-scoped settings |
| [docs/API.md](API.md) | Data models and GraphQL API reference |
| [docs/ONBOARDING.md](ONBOARDING.md) | Dev setup for testing |
| [app/api/_shared/botPersonas.ts](../app/api/_shared/botPersonas.ts) | Existing persona pattern to extend |
| [app/api/_shared/blockTools.ts](../app/api/_shared/blockTools.ts) | Tool definition pattern using Vercel AI SDK |
| [amplify/functions/yjsSync/botObserver.ts](../amplify/functions/yjsSync/botObserver.ts) | Yjs bot integration pattern |
| [scripts/manage-admins.js](../scripts/manage-admins.js) | Existing admin management (CLI-based, to be wrapped by bot) |

---

## 6. Open Questions

1. **Separate chat thread or shared?** Should Atlas have its own dedicated chat panel, or live in the same ChatSidebar with role-based routing? Dedicated panel. I  don't want admins accidentally invoking admin tools in the instructor/student chat. Also allows for admin-specific UI (e.g., tool previews, audit log access).
2. **Yjs integration?** Does Atlas need real-time Yjs presence (like Kai/Sage) or is a standard API route sufficient since admins don't edit lessons collaboratively? Standard API route is sufficient for now. If we later want real-time monitoring of system health or live collaboration on platform configuration, we can add a Yjs-based admin dashboard.
3. **PlatformConfig model**: New DynamoDB table for global settings, or store in a well-known Settings record with a fixed owner ID? There is a PlatformSettings model in the GraphQL schema.
4. **Audit log retention**: How long to keep admin action logs? (30 days? 1 year? Indefinite?) Configurable via PlatformSettings. Default to 1 year.
5. **Multi-admin safety**: If two admins change the same setting simultaneously, do we need optimistic locking on PlatformSettings? Yes, and it should already exist as part of the model. The bot should handle version conflicts gracefully (e.g., "Another admin has updated this setting since you last fetched it. Please review the latest value before confirming your change.").

---

## 7. Implementation Phases

### Phase 1: Foundation
- [ ] Add Atlas persona to `botPersonas.ts` - refactor to botPersonas/index.ts and split into separate files if it gets too large. Provide a distinct system prompt and tool list. And helper function to instantiate the persona with the correct config and tools.
- [ ] Create `adminTools.ts` with read-only tools (list/get/report)
- [ ] Create admin chat route with auth check
- [ ] Basic UI in admin panel

### Phase 2: Write Operations
- [ ] User management tools (group changes, disable)
- [ ] Platform settings tools
- [ ] Confirmation flow (preview → confirm pattern)
- [ ] Audit logging
- [ ] Have other bots record when a user attempts to invoke an admin-only tool and respond with a friendly message directing them to contact their administrator. Also log these attempts for security monitoring.
- [ ] Record whenever prompt injection attempts are detected in any bot (not just admin) and log for security monitoring, have a distinct log entry for successful vs attempted prompt injection, and generate a regular report summarizing these attempts for the admin.

### Phase 3: Advanced
- [ ] Gamification global controls
- [ ] Bulk operations with preview
- [ ] AI content moderation tools
- [ ] User supplied content moderation (flag/review AIFeedback)
- [ ] System health monitoring tools (subscription health, storage usage, AI usage)
- [ ] Agent job management (list/retry failed jobs)
- [ ] System health monitoring
- [ ] Scheduled reports / alerts

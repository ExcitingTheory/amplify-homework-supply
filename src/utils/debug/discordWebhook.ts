/**
 * Discord Webhook Integration for Debug Diagnostics
 * 
 * Sends diagnostic snapshots to a Discord channel via webhook.
 * Useful for support teams to automatically receive user diagnostics.
 * 
 * Setup:
 * 1. Create a Discord webhook in your support channel
 * 2. Set NEXT_PUBLIC_DISCORD_WEBHOOK_URL in .env.local
 * 3. Users can opt-in to send diagnostics when exporting
 */

import { StateSnapshot } from './StateSnapshot';

export interface DiscordWebhookConfig {
  /** Discord webhook URL (from channel settings) */
  webhookUrl: string;
  /** Optional username override */
  username?: string;
  /** Optional avatar URL override */
  avatarUrl?: string;
}

export interface DiagnosticReport {
  /** Full state snapshot */
  snapshot: StateSnapshot;
  /** User-provided description (optional) */
  description?: string;
  /** User email/identifier (optional) */
  userContact?: string;
  /** S3 signed URL for full artifact (30-day expiration) */
  artifactUrl?: string;
}

/**
 * Sanitize sensitive data before sending to Discord
 */
function sanitizeSnapshot(snapshot: StateSnapshot): StateSnapshot {
  const sanitized = { ...snapshot };
  
  // Redact sensitive fields from contexts (may contain auth info)
  if (sanitized.contexts) {
    sanitized.contexts = Object.fromEntries(
      Object.entries(sanitized.contexts).map(([key, value]) => {
        // Redact authentication tokens if present
        if (key.toLowerCase().includes('auth') && typeof value === 'object' && value !== null) {
          return [key, {
            ...value as Record<string, unknown>,
            session: '[REDACTED]',
            tokens: '[REDACTED]',
            credentials: '[REDACTED]',
          }];
        }
        return [key, value];
      })
    );
  }
  
  // Redact sensitive localStorage/sessionStorage
  const redactKeys = ['token', 'auth', 'credential', 'password', 'secret'];
  if (sanitized.localStorage) {
    sanitized.localStorage = Object.fromEntries(
      Object.entries(sanitized.localStorage).map(([key, value]) => [
        key,
        redactKeys.some(k => key.toLowerCase().includes(k)) ? '[REDACTED]' : value
      ])
    );
  }
  if (sanitized.sessionStorage) {
    sanitized.sessionStorage = Object.fromEntries(
      Object.entries(sanitized.sessionStorage).map(([key, value]) => [
        key,
        redactKeys.some(k => key.toLowerCase().includes(k)) ? '[REDACTED]' : value
      ])
    );
  }
  
  return sanitized;
}

/**
 * Format snapshot data for Discord (limited to 2000 chars per field)
 */
function formatForDiscord(snapshot: StateSnapshot): string {
  const info = [
    `**Timestamp:** ${new Date(snapshot.timestamp).toLocaleString()}`,
    `**Version:** ${snapshot.version}`,
    `**URL:** ${snapshot.environment.url}`,
    `**Browser:** ${snapshot.environment.userAgent.substring(0, 100)}`,
    `**Platform:** ${snapshot.environment.platform}`,
    `**Screen:** ${snapshot.environment.screenSize.width}x${snapshot.environment.screenSize.height}`,
  ];
  
  if (snapshot.errors?.length > 0) {
    info.push(`**Errors:** ${snapshot.errors.length} error(s) detected`);
  }
  
  // Add data store summary if available
  if (snapshot.dataStore) {
    const modelCounts = Object.entries(snapshot.dataStore)
      .filter(([key]) => Array.isArray(snapshot.dataStore[key as keyof typeof snapshot.dataStore]))
      .map(([key, value]) => `${key}:${(value as unknown[]).length}`)
      .join(', ');
    if (modelCounts) {
      info.push(`**Data:** ${modelCounts}`);
    }
  }
  
  return info.join('\n');
}

/**
 * Create Discord embed for diagnostic report
 */
function createEmbed(report: DiagnosticReport, sanitized: StateSnapshot) {
  const hasErrors = sanitized.errors && sanitized.errors.length > 0;
  
  return {
    title: '🐛 Support Diagnostic Report',
    description: report.description || 'User submitted diagnostic report',
    color: hasErrors ? 0xff0000 : 0x00ff00, // Red if errors, green otherwise
    fields: [
      {
        name: '📊 System Information',
        value: formatForDiscord(sanitized),
        inline: false,
      },
      ...(report.userContact ? [{
        name: '👤 User Contact',
        value: report.userContact,
        inline: true,
      }] : []),
      ...(hasErrors ? [{
        name: '❌ Recent Errors',
        value: sanitized.errors!.slice(0, 3).map((err, i) => 
          `${i + 1}. ${err.message?.substring(0, 100)}...`
        ).join('\n') || 'See attached file',
        inline: false,
      }] : []),
      ...(report.artifactUrl ? [{
        name: '📎 Full Diagnostic Artifact (S3)',
        value: `[Download JSON (30-day link)](${report.artifactUrl})`,
        inline: false,
      }] : []),
    ],
    timestamp: new Date(sanitized.timestamp).toISOString(),
    footer: {
      text: 'Homework Supply Debug System',
    },
  };
}

/**
 * Send diagnostic report to Discord webhook
 * 
 * @param report - Diagnostic report with snapshot and optional metadata
 * @param config - Discord webhook configuration
 * @returns Promise with success status
 */
export async function sendToDiscord(
  report: DiagnosticReport,
  config: DiscordWebhookConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Sanitize sensitive data
    const sanitized = sanitizeSnapshot(report.snapshot);
    
    // Create embed
    const embed = createEmbed(report, sanitized);
    
    // Create Discord message payload
    const payload = {
      username: config.username || 'Support Bot',
      avatar_url: config.avatarUrl,
      embeds: [embed],
    };
    
    // Send to Discord
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Discord Webhook] Failed to send:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    // Optionally send full snapshot as file attachment
    // (Discord webhooks support file uploads via multipart/form-data)
    if ((sanitized.logs && sanitized.logs.length > 1000) || (sanitized.errors && sanitized.errors.length > 0)) {
      await sendFullSnapshot(sanitized, config.webhookUrl);
    }
    
    console.log('[Discord Webhook] Diagnostic report sent successfully');
    return { success: true };
    
  } catch (error) {
    console.error('[Discord Webhook] Error sending diagnostic:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send full snapshot as file attachment (for detailed diagnostics)
 */
async function sendFullSnapshot(snapshot: StateSnapshot, webhookUrl: string): Promise<void> {
  try {
    const formData = new FormData();
    
    // Create JSON file
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `diagnostic-${snapshot.timestamp}.json`;
    
    formData.append('files[0]', blob, filename);
    formData.append('payload_json', JSON.stringify({
      content: '📎 Full diagnostic snapshot attached',
    }));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      console.error('[Discord Webhook] Failed to send file attachment:', response.status);
    }
  } catch (error) {
    console.error('[Discord Webhook] Error sending file attachment:', error);
  }
}

/**
 * Get Discord webhook URL from environment
 * Returns null if not configured
 */
export function getDiscordWebhookUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check environment variable
  const envUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;
  if (envUrl && envUrl.startsWith('https://discord.com/api/webhooks/')) {
    return envUrl;
  }
  
  // Check localStorage override (for testing)
  const localUrl = localStorage.getItem('discord-webhook-url');
  if (localUrl && localUrl.startsWith('https://discord.com/api/webhooks/')) {
    return localUrl;
  }
  
  return null;
}

/**
 * Check if Discord webhook integration is configured
 */
export function isDiscordWebhookConfigured(): boolean {
  return getDiscordWebhookUrl() !== null;
}

/**
 * Test Discord webhook connection
 */
export async function testDiscordWebhook(webhookUrl?: string): Promise<boolean> {
  const url = webhookUrl || getDiscordWebhookUrl();
  if (!url) return false;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '✅ Discord webhook test successful! Integration is working.',
        username: 'Support Bot Test',
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('[Discord Webhook] Test failed:', error);
    return false;
  }
}

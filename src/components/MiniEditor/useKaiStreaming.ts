"use client";

/**
 * useKaiStreaming — Client-side hook for @kai bot invocation outside the
 * collaborative chat (e.g. private assistant, squad help).
 *
 * In the collaborative chat, @kai is handled SERVER-SIDE by the Yjs
 * botObserver (see amplify/functions/yjsSync/botObserver.ts).
 * The server streams the response directly into the Yjs doc — no client relay.
 *
 * This hook is for non-collaborative contexts where a direct client→API stream
 * is appropriate (e.g. the instructor's ChatSidebar, private squad help).
 *
 * @module MiniEditor/useKaiStreaming
 */

import { useCallback, useRef, useState } from "react";
import type { KaiStreamState, KaiChatContext } from "./types";

export interface UseKaiStreamingOptions {
  /** Context for Kai's system prompt */
  chatContext: KaiChatContext;
  /** Called when streaming completes with the final content */
  onStreamComplete?: (content: string, messageId: string) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

export interface UseKaiStreamingReturn {
  /** Current streaming state */
  state: KaiStreamState;
  /** Trigger a Kai response for a given prompt */
  invokeKai: (prompt: string) => Promise<void>;
  /** Cancel an in-progress stream */
  cancelStream: () => void;
  /** Whether Kai is currently streaming */
  isStreaming: boolean;
}

/**
 * Streams a response from the /api/chat route using fetch + ReadableStream.
 * Does not use the useChat hook — this is a standalone streaming client.
 */
export function useKaiStreaming({
  chatContext,
  onStreamComplete,
  onError,
}: UseKaiStreamingOptions): UseKaiStreamingReturn {
  const [state, setState] = useState<KaiStreamState>({
    isStreaming: false,
    content: "",
    blocks: null,
    error: null,
    messageId: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const invokeKai = useCallback(
    async (prompt: string) => {
      // Abort any prior stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const messageId = `kai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setState({
        isStreaming: true,
        content: "",
        blocks: null,
        error: null,
        messageId,
      });

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: [
              ...(chatContext.recentMessages || []).map((m) => ({
                role: m.role,
                content: m.content,
              })),
              { role: "user", content: prompt },
            ],
            context: {
              sectionId: chatContext.sectionId,
              unitId: chatContext.unitId,
              mode: "kai-streaming",
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE data lines
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              // Handle AI SDK data format
              if (parsed.type === "text-delta" && parsed.textDelta) {
                accumulated += parsed.textDelta;
                setState((prev) => ({ ...prev, content: accumulated }));
              } else if (parsed.type === "0") {
                // Legacy format: "0":"token"
                accumulated += parsed;
                setState((prev) => ({ ...prev, content: accumulated }));
              }
            } catch {
              // Some chunks may not be JSON (e.g. event lines)
            }
          }
        }

        setState((prev) => ({
          ...prev,
          isStreaming: false,
          content: accumulated,
        }));
        onStreamComplete?.(accumulated, messageId);
      } catch (err: any) {
        if (err.name === "AbortError") return; // Intentional cancel

        const errorMsg = err?.message || "Kai encountered an error";
        setState((prev) => ({ ...prev, isStreaming: false, error: errorMsg }));
        onError?.(errorMsg);
      }
    },
    [chatContext, onStreamComplete, onError],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  return {
    state,
    invokeKai,
    cancelStream,
    isStreaming: state.isStreaming,
  };
}

export default useKaiStreaming;

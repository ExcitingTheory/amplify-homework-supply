/**
 * CollaborativeChat barrel export
 * @module CollaborativeChat
 */

export { default as ChatPanel } from "./ChatPanel";
export { default as TopicList } from "./TopicList";
export { default as ThreadView } from "./ThreadView";
export { default as MessageInput } from "./MessageInput";
export { handleKaiResponse, processKaiMention } from "./KaiBot";
export type { KaiBotConfig } from "./KaiBot";
export * from "./types";

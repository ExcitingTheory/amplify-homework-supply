// Lightweight event bus letting any component open the collaborative ChatPanel
// FAB with a specific section/scope/topic without lifting shared state.
const EVENT_NAME = "hs:open-chat";

export function openDiscussion({ sectionID, scope, topicName } = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, { detail: { sectionID, scope, topicName } }),
  );
}

export function onOpenDiscussion(handler) {
  if (typeof window === "undefined") return () => {};
  const listener = (e) => handler(e.detail || {});
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

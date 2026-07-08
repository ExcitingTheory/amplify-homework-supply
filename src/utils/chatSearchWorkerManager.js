import { searchChatIndex } from "./chatSearchIndex";

let reqId = 0;

export function createChatSearchWorkerManager(indexRef) {
  const hasWorker = typeof window !== "undefined" && typeof Worker !== "undefined";
  let worker = null;
  const pending = new Map();

  function initWorker() {
    if (!hasWorker || worker) return;
    worker = new Worker(new URL("../workers/chatSearchWorker.js", import.meta.url));
    worker.onmessage = (event) => {
      const { id, ok, payload, error } = event.data || {};
      const resolver = pending.get(id);
      if (!resolver) return;
      pending.delete(id);
      if (ok) resolver.resolve(payload);
      else resolver.reject(new Error(error || "Chat search worker error"));
    };
    worker.onerror = (err) => {
      // Reject all in-flight requests and allow sync fallback
      for (const [, resolver] of pending) {
        resolver.reject(err);
      }
      pending.clear();
      try {
        worker?.terminate();
      } catch {
        // Ignore terminate failures
      }
      worker = null;
    };
  }

  function callWorker(action, payload) {
    initWorker();
    if (!worker) {
      return Promise.reject(new Error("Worker unavailable"));
    }

    const id = ++reqId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, action, payload });
    });
  }

  async function build(messages) {
    if (!Array.isArray(messages)) return;

    try {
      await callWorker("BUILD", { messages });
    } catch {
      // Silent fallback: sync search remains available.
    }
  }

  async function search(query, options = {}) {
    try {
      const response = await callWorker("SEARCH", { query, options });
      return response?.results || [];
    } catch {
      return searchChatIndex(indexRef.current, query, options);
    }
  }

  function dispose() {
    if (!worker) return;
    try {
      worker.terminate();
    } catch {
      // Ignore terminate failures
    }
    worker = null;
    pending.clear();
  }

  return {
    build,
    search,
    dispose,
  };
}

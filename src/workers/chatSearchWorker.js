 

function normalizeText(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

function tokenize(text) {
  return normalizeText(text)
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function messageText(message) {
  if (!message) return "";

  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part?.type === "text" && typeof part?.text === "string")
      .map((part) => part.text)
      .join(" ")
      .trim();
  }

  if (typeof message.content === "string") return message.content;

  return "";
}

function buildIndex(messages = []) {
  const postings = new Map();
  const docFreq = new Map();
  const docs = new Map();
  let totalDocLen = 0;

  for (const msg of messages) {
    const text = messageText(msg);
    if (!text) continue;

    const id = msg.id || `chat-msg-${Math.random().toString(36).slice(2)}`;
    const tokens = tokenize(text);
    if (tokens.length === 0) continue;

    totalDocLen += tokens.length;
    const tf = new Map();
    for (const token of tokens) tf.set(token, (tf.get(token) || 0) + 1);

    const uniqueTokens = new Set(tokens);
    for (const token of uniqueTokens) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
      if (!postings.has(token)) postings.set(token, []);
      postings.get(token).push({ id, tf: tf.get(token) || 0 });
    }

    docs.set(id, {
      id,
      text,
      role: msg.role || "unknown",
      author:
        msg.author ||
        msg.username ||
        msg.userName ||
        msg.name ||
        msg.user ||
        null,
      createdAt: msg.createdAt || msg.updatedAt || null,
      length: tokens.length,
      message: msg,
    });
  }

  return {
    docs,
    postings,
    docFreq,
    avgDocLen: docs.size > 0 ? totalDocLen / docs.size : 0,
  };
}

function searchIndex(index, query, options = {}) {
  const { limit = 20, role, author } = options;
  const queryTokens = tokenize(query);
  if (!index || queryTokens.length === 0) return [];

  const candidateIds = new Set();
  for (const token of queryTokens) {
    const list = index.postings.get(token) || [];
    for (const posting of list) candidateIds.add(posting.id);
  }

  if (candidateIds.size === 0) return [];

  const k1 = 1.2;
  const b = 0.75;
  const N = Math.max(1, index.docs.size);
  const avgdl = Math.max(1, index.avgDocLen || 0);

  const q = normalizeText(query);
  const now = Date.now();

  const results = [];
  for (const id of candidateIds) {
    const doc = index.docs.get(id);
    if (!doc) continue;
    if (role && doc.role !== role) continue;
    if (
      author &&
      !normalizeText(String(doc.author || "")).includes(normalizeText(author))
    ) {
      continue;
    }

    let score = 0;
    const textTokens = tokenize(doc.text);
    const tfMap = new Map();
    for (const token of textTokens) tfMap.set(token, (tfMap.get(token) || 0) + 1);

    for (const token of queryTokens) {
      const tf = tfMap.get(token) || 0;
      if (tf === 0) continue;
      const df = index.docFreq.get(token) || 0;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const denom = tf + k1 * (1 - b + (b * doc.length) / avgdl);
      score += idf * ((tf * (k1 + 1)) / denom);
    }

    const normalizedDocText = normalizeText(doc.text);
    if (q && normalizedDocText.includes(q)) score += 0.2;

    if (doc.createdAt) {
      const ageMs = Math.max(0, now - new Date(doc.createdAt).getTime());
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 0.15 - ageDays * 0.0025);
      score += recencyBoost;
    }

    if (score <= 0) continue;

    const text = doc.text;
    const firstToken = queryTokens[0];
    const idx = normalizeText(text).indexOf(firstToken);
    const snippet =
      idx >= 0
        ? text.slice(Math.max(0, idx - 40), Math.min(text.length, idx + 120)).trim()
        : text.slice(0, 140).trim();

    results.push({
      id: doc.id,
      role: doc.role,
      author: doc.author,
      score,
      snippet,
      createdAt: doc.createdAt,
      message: doc.message,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

let currentIndex = buildIndex([]);

self.onmessage = (event) => {
  const { id, action, payload } = event.data || {};

  try {
    if (action === "BUILD") {
      currentIndex = buildIndex(payload?.messages || []);
      self.postMessage({ id, ok: true, action, payload: { indexed: currentIndex.docs.size } });
      return;
    }

    if (action === "SEARCH") {
      const results = searchIndex(currentIndex, payload?.query || "", payload?.options || {});
      self.postMessage({ id, ok: true, action, payload: { results } });
      return;
    }

    self.postMessage({ id, ok: false, action, error: `Unknown action: ${action}` });
  } catch (error) {
    self.postMessage({ id, ok: false, action, error: error?.message || String(error) });
  }
};

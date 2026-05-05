/**
 * Converts Lexical editor JSON into a sparse text representation
 * suitable for sending to the chat Lambda without exceeding
 * API Gateway payload limits.
 *
 * - Preserves all text, headings, lists, quotes, links, and tables
 * - Replaces images with [image: altText] references
 * - Replaces audio/video/playlists with file names and descriptions
 * - Replaces YouTube embeds with [youtube: videoID]
 * - Describes interactive exercises with their full content inline
 * - Strips base64 data, S3 URLs, and embedded editor states
 *
 * @param {string} dataJson - The JSON string from unit.data
 * @param {Object} [lookups] - Optional lookup maps for resolving IDs to content
 * @param {Object} [lookups.words] - Word map keyed by ID: { [id]: { phrase, definition, pronunciation } }
 * @param {Object} [lookups.questions] - Question map keyed by ID: { [id]: { prompt, answer, hint, choices } }
 * @param {Object} [lookups.files] - File map keyed by ID: { [id]: { name, description, mimeType } }
 * @param {Object} [lookups.gradeData] - Parsed grade.data keyed by block node key
 * @returns {string} Plain-ish text representation
 */
export default function serializeLexicalToSparseText(dataJson, lookups = {}) {
  if (!dataJson) return '';

  let parsed;
  try {
    parsed = typeof dataJson === 'string' ? JSON.parse(dataJson) : dataJson;
  } catch {
    return '';
  }

  const root = parsed?.root;
  if (!root || !root.children) return '';

  const ctx = {
    words: lookups.words || {},
    questions: lookups.questions || {},
    files: lookups.files || {},
    gradeData: lookups.gradeData || {},
    blockIndex: 0,
  };

  return serializeChildren(root.children, ctx).trim();
}

function serializeChildren(children, ctx) {
  if (!Array.isArray(children)) return '';
  return children.map(child => serializeNode(child, ctx)).filter(Boolean).join('\n');
}

function lookupWord(id, ctx) {
  const w = ctx.words[id];
  if (!w) return id;
  let s = w.phrase || id;
  if (w.pronunciation) s += ` (${w.pronunciation})`;
  if (w.definition) s += ` — ${w.definition}`;
  return s;
}

function lookupQuestion(id, ctx) {
  const q = ctx.questions[id];
  if (!q) return id;
  let s = `Q: ${q.prompt}`;
  if (q.choices && Array.isArray(q.choices)) {
    q.choices.forEach(c => {
      s += `\n  ${c.correct ? '✓' : '○'} ${c.choice}`;
    });
  }
  if (q.answer) s += `\n  Answer: ${q.answer}`;
  if (q.hint) s += `\n  Hint: ${q.hint}`;
  return s;
}

function lookupFile(id, ctx) {
  const f = ctx.files[id];
  if (!f) return id;
  let s = f.name || id;
  if (f.description) s += ` — ${f.description}`;
  if (f.mimeType) s += ` (${f.mimeType})`;
  return s;
}

function formatGradeStatus(nodeKey, ctx) {
  const g = ctx.gradeData[nodeKey];
  if (!g) return '';
  const parts = [];
  if (g.complete) parts.push('✓ completed');
  else parts.push('… in progress');
  if (g.accuracy != null) parts.push(`accuracy: ${g.accuracy}%`);
  if (g.userAnswer) parts.push(`student answered: "${g.userAnswer}"`);
  return parts.length ? `  [Student progress: ${parts.join(', ')}]` : '';
}

function serializeNode(node, ctx) {
  if (!node) return '';

  switch (node.type) {
    // ── Text ──
    case 'text':
      return node.text || '';

    case 'linebreak':
      return '\n';

    // ── Block containers ──
    case 'root':
      return serializeChildren(node.children, ctx);

    case 'paragraph':
      return serializeChildren(node.children, ctx);

    case 'heading': {
      const level = node.tag ? node.tag.replace('h', '') : '1';
      const prefix = '#'.repeat(Number(level));
      return `${prefix} ${serializeChildren(node.children, ctx)}`;
    }

    case 'quote':
      return `> ${serializeChildren(node.children, ctx)}`;

    case 'list':
      return serializeList(node, ctx);

    case 'listitem':
      return serializeChildren(node.children, ctx);

    // ── Links ──
    case 'link':
    case 'autolink':
      return `[${serializeChildren(node.children, ctx)}](${node.url || ''})`;

    // ── Code ──
    case 'code':
      return `\`\`\`\n${serializeChildren(node.children, ctx)}\n\`\`\``;
    case 'code-highlight':
      return node.text || '';

    // ── Horizontal rule ──
    case 'horizontalrule':
      return '---';

    // ── Tables ──
    case 'table':
      return serializeTable(node, ctx);
    case 'tablerow':
      return serializeChildren(node.children, ctx);
    case 'tablecell':
      return serializeChildren(node.children, ctx);

    // ── Layout ──
    case 'layout-container':
      return serializeChildren(node.children, ctx);
    case 'layout-item':
      return serializeChildren(node.children, ctx);

    // ── Media — include descriptions and file metadata ──
    case 'image': {
      const parts = ['[Image'];
      if (node.altText) parts.push(`alt="${node.altText}"`);
      if (node.path) parts.push(`file=${node.path}`);
      return parts.join(', ') + ']';
    }

    case 'pdf-viewer':
      return `[PDF: ${node.filename || node.path || 'document'}]`;

    case 'youtube':
      return `[YouTube video: ${node.videoID || 'unknown'}]`;

    case 'playlist': {
      const fileDescs = (node.fileIDs || []).map(id => lookupFile(id, ctx));
      return `[Playlist — ${fileDescs.length} files:\n${fileDescs.map(f => `  - ${f}`).join('\n')}\n]`;
    }

    // ── Vocabulary block — show full word content ──
    case 'word-block': {
      const desc = lookupWord(node.wordID, ctx);
      return `[Vocabulary: ${desc}]`;
    }

    // ── Interactive exercises — described with full content ──
    case 'answer': {
      ctx.blockIndex++;
      const blockKey = node.__key || `answer-${ctx.blockIndex}`;
      const mode = node.requestDefinition === 'translation'
        ? 'translate the phrase'
        : (node.requestDefinition || 'provide answer');
      const inputMethods = Array.isArray(node.allowedInput) ? node.allowedInput.join(', ') : 'text';
      const wordDescs = (node.wordIDs || []).map(id => lookupWord(id, ctx));
      let s = `[Answer Exercise (${mode}, input: ${inputMethods}):\n`;
      wordDescs.forEach((desc, i) => { s += `  ${i + 1}. ${desc}\n`; });
      const grade = formatGradeStatus(blockKey, ctx);
      if (grade) s += grade + '\n';
      s += ']';
      return s;
    }

    case 'meaning-association': {
      ctx.blockIndex++;
      const blockKey = node.__key || `ma-${ctx.blockIndex}`;
      const modes = Array.isArray(node.enabledModes) ? node.enabledModes.join(', ') : 'learn, easy, hard';
      const wordDescs = (node.wordIDs || []).map(id => lookupWord(id, ctx));
      let s = `[Matching Exercise (modes: ${modes}) — match terms to definitions:\n`;
      wordDescs.forEach((desc, i) => { s += `  ${i + 1}. ${desc}\n`; });
      const grade = formatGradeStatus(blockKey, ctx);
      if (grade) s += grade + '\n';
      s += ']';
      return s;
    }

    case 'custom-answer': {
      ctx.blockIndex++;
      const blockKey = node.__key || `ca-${ctx.blockIndex}`;
      const ids = node.ids || node.data?.wordIDs || node.data?.questionIDs || [];
      const items = Array.isArray(ids)
        ? ids.map(id => {
            // Try word first, then question
            const w = ctx.words[id];
            if (w) return `Word: ${lookupWord(id, ctx)}`;
            const q = ctx.questions[id];
            if (q) return lookupQuestion(id, ctx);
            return id;
          })
        : [String(ids)];
      let s = '[Custom Answer Exercise:\n';
      items.forEach((desc, i) => { s += `  ${i + 1}. ${desc}\n`; });
      const grade = formatGradeStatus(blockKey, ctx);
      if (grade) s += grade + '\n';
      s += ']';
      return s;
    }

    case 'quiz': {
      ctx.blockIndex++;
      const blockKey = node.__key || `quiz-${ctx.blockIndex}`;
      const questionIds = Array.isArray(node.data) ? node.data : [];
      let s = `[Quiz — ${questionIds.length} question(s):\n`;
      questionIds.forEach((id, i) => {
        const desc = typeof id === 'string' ? lookupQuestion(id, ctx) : `Question ${i + 1}`;
        s += `  ${i + 1}. ${desc}\n`;
      });
      const grade = formatGradeStatus(blockKey, ctx);
      if (grade) s += grade + '\n';
      s += ']';
      return s;
    }

    // ── Special nodes ──
    case 'file-metadata': {
      const f = node.file;
      let s = `[File: ${f?.name || 'file'}`;
      if (f?.description) s += ` — ${f.description}`;
      if (f?.mimeType) s += ` (${f.mimeType})`;
      s += ']';
      return s;
    }

    case 'excalidraw':
      return '[Drawing/diagram]';

    case 'armor-editor':
      return '[Armor editor block]';

    case 'hashtag':
      return node.text || '';

    // ── Ephemeral (skip) ──
    case 'ai-content-suggestion':
    case 'autocomplete':
      return '';

    default:
      // Unknown node — try to extract children or text
      if (node.children) return serializeChildren(node.children, ctx);
      if (node.text) return node.text;
      return '';
  }
}

function serializeList(node, ctx) {
  if (!node.children) return '';
  const ordered = node.listType === 'number';
  return node.children
    .map((item, i) => {
      const prefix = ordered ? `${i + 1}.` : '-';
      const text = serializeNode(item, ctx);
      return `${prefix} ${text}`;
    })
    .join('\n');
}

function serializeTable(node, ctx) {
  if (!node.children) return '';
  const rows = node.children.map(row => {
    if (!row.children) return '';
    const cells = row.children.map(cell => serializeChildren(cell.children, ctx));
    return `| ${cells.join(' | ')} |`;
  });
  // Insert header separator after first row
  if (rows.length > 0) {
    const firstRow = node.children[0];
    const colCount = firstRow?.children?.length || 1;
    const separator = `| ${Array(colCount).fill('---').join(' | ')} |`;
    rows.splice(1, 0, separator);
  }
  return rows.join('\n');
}

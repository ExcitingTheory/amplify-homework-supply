/**
 * Derive heading hierarchy metadata from a serialized Lexical editor state.
 * The last heading in document order is treated as the current insertion context.
 */
export default function getHeadingContext(dataJson) {
  if (!dataJson) {
    return {
      headingPath: [],
      suggestedNextHeading: "h1",
    };
  }

  let parsed;
  try {
    parsed = typeof dataJson === "string" ? JSON.parse(dataJson) : dataJson;
  } catch {
    return {
      headingPath: [],
      suggestedNextHeading: "h1",
    };
  }

  const headings = [];
  collectHeadings(parsed?.root?.children, headings);

  if (headings.length === 0) {
    return {
      headingPath: [],
      suggestedNextHeading: "h1",
    };
  }

  const path = [];
  for (const heading of headings) {
    path.splice(heading.level - 1);
    path.push(heading);
  }

  const currentLevel = path[path.length - 1].level;
  return {
    headingPath: path,
    suggestedNextHeading: `h${Math.min(currentLevel + 1, 6)}`,
  };
}

function collectHeadings(nodes, headings) {
  if (!Array.isArray(nodes)) return;

  for (const node of nodes) {
    if (node?.type === "heading") {
      const level = Number.parseInt(String(node.tag || "h1").slice(1), 10);
      if (level >= 1 && level <= 6) {
        headings.push({
          level,
          tag: `h${level}`,
          text: getText(node.children),
        });
      }
    }

    collectHeadings(node?.children, headings);
  }
}

function getText(nodes) {
  if (!Array.isArray(nodes)) return "";
  return nodes
    .map((node) => {
      if (node?.type === "text") return node.text || "";
      return getText(node?.children);
    })
    .join("")
    .trim();
}

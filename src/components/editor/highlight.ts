export const highlightText = (text: string) => {
  // Escape &, <, >
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Step 1: Find all defined rules from the original text
  const lines = text.split('\n');
  const definedRules: string[] = [];

  // biome-ignore lint/complexity/noForEach: it nees to loop
  lines.forEach(line => {
    // Two patterns to match:
    // 1. With labels: "bob. A **Person** gets a full driving license"
    // 2. Without labels: "A **Person** passes the practical driving test"
    const matchWithLabel = line.match(/^[\w.]+\.\s+A\s+\*\*\w+\*\*\s+(.+)$/);
    const matchWithoutLabel = line.match(/^A\s+\*\*\w+\*\*\s+(.+)$/);

    const match = matchWithLabel || matchWithoutLabel;
    if (match) {
      // Extract just the action part (e.g., "passes the practical driving test")
      // without the **Person** part
      definedRules.push(match[1].trim());
    }
  });

  // Step 2: Create a placeholder system to protect HTML tags
  const placeholders: string[] = [];
  let placeholderIndex = 0;

  // Step 3: Highlight references FIRST (before other highlighting messes with the text)
  // biome-ignore lint/complexity/noForEach: it nees to loop
  definedRules.forEach(rule => {
    // For each defined rule, find references to it
    const escapedRule = rule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Look for the rule text anywhere
    const referencePattern = new RegExp(`(${escapedRule})`, 'gi');

    html = html.replace(referencePattern, (match, p1, offset) => {
      // Check if this match is part of a definition line
      const lineStart = html.lastIndexOf('\n', offset) + 1;
      const lineEnd = html.indexOf('\n', offset);
      const currentLine = html.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

      // Don't highlight if it's in a definition line (starts with "A" or "label. A")
      if (currentLine.match(/^(?:[\w.]+\.\s+)?A\s+/)) {
        return match;
      }

      const placeholder = `\x00PLACEHOLDER${placeholderIndex}\x00`;
      placeholders[placeholderIndex] = `<span class="text-cyan-500">${match}</span>`;
      placeholderIndex++;
      return placeholder;
    });
  });

  // Step 4: Apply all other highlighting rules

  // Highlight numbers
  html = html.replace(
    /\b(\d+)\b/g,
    (match, p1) => {
      const placeholder = `\x00PLACEHOLDER${placeholderIndex}\x00`;
      placeholders[placeholderIndex] = `<span class="text-orange-500">${p1}</span>`;
      placeholderIndex++;
      return placeholder;
    }
  );

  // Highlight comparison phrases in purple
  const comparisonPhrases = [
    "is greater than or equal to",
    "is less than or equal to",
    "is equal to",
    "is not equal to",
    "is the same as",
    "is not the same as",
    "is later than",
    "is earlier than",
    "is greater than",
    "is less than",
    "is in",
    "is not in",
    "contains",
  ];

  const escapedPhrases = comparisonPhrases.map((phrase) =>
    phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const phrasePattern = new RegExp(
    `\\b(${escapedPhrases.join("|")})\\b`,
    "g",
  );

  html = html.replace(
    phrasePattern,
    (match) => {
      const placeholder = `\x00PLACEHOLDER${placeholderIndex}\x00`;
      placeholders[placeholderIndex] = `<span class="text-purple-500">${match}</span>`;
      placeholderIndex++;
      return placeholder;
    }
  );

  // Highlight labels (ending with .) at the start of a line followed by space and "A"
  html = html.replace(
    /^([\w.]+\.)\s+(?=A\s)/gm,
    (match, p1) => {
      const placeholder = `\x00PLACEHOLDER${placeholderIndex}\x00`;
      placeholders[placeholderIndex] = `<span class="text-yellow-500">${p1}</span>`;
      placeholderIndex++;
      return `${placeholder} `;
    }
  );

  // Highlight lines starting with # (comments) - grey
  html = html.replace(
    /(^#.*$)/gm,
    (match) => {
      const placeholder = `\x00PLACEHOLDER${placeholderIndex}\x00`;
      placeholders[placeholderIndex] = `<span class="text-gray-400">${match}</span>`;
      placeholderIndex++;
      return placeholder;
    }
  );

  // Highlight double asterisks - blue (keep ** markers), non-greedy
  html = html.replace(
    /(\*\*.+?\*\*)/g,
    (match) => {
      const placeholder = `\x00PLACEHOLDER${placeholderIndex}\x00`;
      placeholders[placeholderIndex] = `<span class="text-blue-500">${match}</span>`;
      placeholderIndex++;
      return placeholder;
    }
  );

  // Highlight double underscores - green (keep __ markers), non-greedy
  html = html.replace(
    /(__.+?__)/g,
    (match) => {
      const placeholder = `\x00PLACEHOLDER${placeholderIndex}\x00`;
      placeholders[placeholderIndex] = `<span class="text-green-500">${match}</span>`;
      placeholderIndex++;
      return placeholder;
    }
  );

  // Step 5: Replace all placeholders with their actual HTML
  for (let i = 0; i < placeholders.length; i++) {
    html = html.replace(`\x00PLACEHOLDER${i}\x00`, placeholders[i]);
  }

  //console.info("highlighted", html);

  return html;
};
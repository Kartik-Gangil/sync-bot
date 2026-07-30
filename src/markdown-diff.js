function normalizeHeading(text) {
    return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function extractMarkdownSections(markdown, level = 2) {
    if (typeof markdown !== "string") throw new TypeError("Markdown content must be a string");
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const heading = new RegExp(`^(#{${level}})\\s+(.+?)\\s*#*\\s*$`);
    const sections = [];
    let current = null;

    for (const line of lines) {
        const match = line.match(heading);
        if (match) {
            if (current) sections.push(current);
            current = { title: match[2].trim(), content: `${line}\n` };
        } else if (current) {
            current.content += `${line}\n`;
        }
    }
    if (current) sections.push(current);
    return sections;
}

export function getMarkdownChanges(previousMarkdown, currentMarkdown) {
    const previous = extractMarkdownSections(previousMarkdown);
    const current = extractMarkdownSections(currentMarkdown);
    const previousByTitle = new Map(previous.map((section) => [normalizeHeading(section.title), section]));
    const currentByTitle = new Map(current.map((section) => [normalizeHeading(section.title), section]));
    const changes = [];

    for (const [key, section] of currentByTitle) {
        const before = previousByTitle.get(key);
        if (!before) changes.push({ type: "added", title: section.title, after: section.content.trim() });
        else if (before.content.trim() !== section.content.trim()) changes.push({ type: "modified", title: section.title, before: before.content.trim(), after: section.content.trim() });
    }
    for (const [key, section] of previousByTitle) {
        if (!currentByTitle.has(key)) changes.push({ type: "removed", title: section.title, before: section.content.trim() });
    }
    return changes;
}

export function formatMarkdownChanges(changes) {
    if (!changes.length) return "NO_DOCUMENTATION_CHANGES";
    return changes.map((change) => [
        `<change type="${change.type}" section="${change.title}">`,
        change.before ? `<before>\n${change.before}\n</before>` : "",
        change.after ? `<after>\n${change.after}\n</after>` : "",
        "</change>"
    ].filter(Boolean).join("\n")).join("\n\n");
}
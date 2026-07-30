import test from "node:test";
import assert from "node:assert/strict";
import { resolveTargetFilePath } from "../src/file-sync.js";
import { decodeGitHubFileContent } from "../src/github.js";
import { normalizeGeneratedTarget } from "../src/agent.js";
import { getTargetFile } from "../src/sync.js";
import { getMarkdownChanges, formatMarkdownChanges } from "../src/markdown-diff.js";

test("maps configured source files to target files", () => {
    assert.equal(resolveTargetFilePath("README.md", { mappings: [{ source: "Readme.md", target: "page.jsx" }] }), "page.jsx");
});

test("falls back to the original path when no mapping exists", () => {
    assert.equal(resolveTargetFilePath("docs/guide.md", { mappings: [] }), "docs/guide.md");
});

test("decodes complete GitHub file content rather than a commit patch", () => {
    const source = "# Title\n\nA full README, including unchanged content.";
    assert.equal(decodeGitHubFileContent(Buffer.from(source).toString("base64")), source);
});

test("accepts README mapping regardless of filename casing", () => {
    assert.equal(getTargetFile("README.md", { mappings: [{ source: "Readme.md", target: "app/page.jsx" }] }), "app/page.jsx");
});

test("normalizes an LLM code fence before writing JSX", () => {
    assert.equal(normalizeGeneratedTarget("```tsx\nexport default function Page() {}\n```"), "export default function Page() {}");
});

test("rejects an empty LLM response", () => {
    assert.throws(() => normalizeGeneratedTarget("   "), /empty target file/);
});

test("detects only an added Meta provider section", () => {
    const before = "# Providers\n\n## Google\nGoogle setup\n\n## GitHub\nGitHub setup\n";
    const after = `${before}\n## Meta\nMeta setup\n`;
    assert.deepEqual(getMarkdownChanges(before, after), [{ type: "added", title: "Meta", after: "## Meta\nMeta setup" }]);
});

test("includes only the changed Google section when its code changes", () => {
    const before = "## Google\n```js\nlogin(old)\n```\n\n## GitHub\nKeep this\n";
    const after = "## Google\n```js\nlogin(new)\n```\n\n## GitHub\nKeep this\n";
    const changes = getMarkdownChanges(before, after);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].type, "modified");
    assert.equal(changes[0].title, "Google");
    assert.match(formatMarkdownChanges(changes), /login\(new\)/);
    assert.doesNotMatch(formatMarkdownChanges(changes), /GitHub/);
});

test("does not produce a change set when README sections are unchanged", () => {
    const source = "## Google\nSame content\n";
    assert.equal(formatMarkdownChanges(getMarkdownChanges(source, source)), "NO_DOCUMENTATION_CHANGES");
});
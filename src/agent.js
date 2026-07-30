import Groq from "groq-sdk";
import { config } from "dotenv";

config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function main(markdownChanges, targetContent) {
    if (typeof markdownChanges !== "string" || typeof targetContent !== "string") throw new TypeError("Changes and target content must be strings");
    const chatCompletion = await getGroqChatCompletion(markdownChanges, targetContent);
    return normalizeGeneratedTarget(chatCompletion.choices[0]?.message?.content);
}

export function normalizeGeneratedTarget(content) {
    if (typeof content !== "string" || !content.trim()) throw new Error("LLM returned an empty target file");
    return content.trim().replace(/^```(?:jsx|tsx|javascript|typescript)?\s*\n?/i, "").replace(/\n?```\s*$/, "");
}

export async function getGroqChatCompletion(markdownChanges, targetContent) {
    return groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You update a JSX documentation page from an incremental Markdown change set. Apply ONLY the supplied changes. Do not alter, reformat, regenerate, reorder, or remove any JSX section that is not explicitly represented by a change. For an added section, add only its corresponding JSX block using the target's existing conventions. For a modified section, locate its matching JSX block and make the smallest possible content change. For a removed section, remove only its matching block when the match is unambiguous. Preserve imports, components, styles, IDs, navigation, links, application logic, and unrelated content. Return only complete valid JSX/TSX source: no explanation, Markdown fences, JSON, or diff.`
            },
            {
                role: "user",
                content: `MARKDOWN CHANGES (the only allowed scope):\n${markdownChanges}\n\nTARGET JSX:\n${targetContent}`
            }
        ],
        model: "openai/gpt-oss-20b"
    });
}
import Groq from "groq-sdk";
import { config } from 'dotenv';
config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function main(sourceContent, targetContent) {
    console.log("start llm call ...")
    const chatCompletion = await getGroqChatCompletion(sourceContent, targetContent);
    // Print the completion returned by the LLM.
    return (chatCompletion.choices[0]?.message?.content || "");
}

export async function getGroqChatCompletion(sourceContent, targetContent) {
    return groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are a source-to-target synchronization engine.

You will receive two pieces of content:

1. SOURCE_CONTENT
   - Contains the authoritative information.
   - Extract relevant information from it.

2. TARGET_CONTENT
   - Contains the existing implementation.
   - Its structure, syntax, components, and architecture must be preserved.

Your task is to update TARGET_CONTENT using the relevant information from SOURCE_CONTENT.

SOURCE_CONTENT determines WHAT information should be synchronized.

TARGET_CONTENT determines HOW that information must be represented.

Never replace TARGET_CONTENT with SOURCE_CONTENT.

Never copy the source syntax directly into the target.

Preserve the target's existing:
- imports
- components
- JSX structure
- functions
- styling
- IDs
- navigation
- links
- code components
- application logic
- unrelated content

When source content corresponds to an existing section in the target:
- Find the corresponding target section.
- Update only the relevant content.
- Preserve the target's existing JSX/component structure.

When source content contains Markdown:
- Convert it into the representation already used by TARGET_CONTENT.
- Markdown headings should become the target's heading structure.
- Markdown lists should become the target's list structure.
- Markdown code blocks should use the target's existing code component.
- Markdown links should use the target's existing link structure.

If the target contains custom implementation-specific content that is not present in the source, preserve it.

If new source content has no corresponding target section:
- Add it using the target's existing structural conventions.
- Do not invent information.

If source content was removed:
- Remove the corresponding synchronized target content only when the relationship is clear.
- Do not remove unrelated target code.

Before returning the result, verify:
- TARGET_CONTENT remains valid code.
- No raw Markdown has accidentally been inserted into JSX.
- Existing target functionality is preserved.
- Unrelated sections are unchanged.
- No information has been invented.

OUTPUT RULE:

Return ONLY the complete updated TARGET_CONTENT.

Do not return:
- explanations
- analysis
- Markdown code fences
- diff output
- JSON
- comments about the changes

The output must be directly usable as the target file.`,
            },
            {
                role: "user",
                content: `
SOURCE CONTENT:
${sourceContent}

TARGET CONTENT:
${targetContent}

SOURCE → TARGET MAPPING:
README.md → page.jsx
`,
            },
        ],
        model: "openai/gpt-oss-20b",
    });
}

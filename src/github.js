import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();
export const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function getCommitDetails(commitSha) {
    const response = await octokit.repos.getCommit({
        owner: process.env.SOURCE_OWNER,
        repo: process.env.SOURCE_REPO,
        ref: commitSha
    });
    return { files: response.data.files ?? [], parentSha: response.data.parents?.[0]?.sha ?? null };
}

export async function getCommitChanges(commitSha) {
    return (await getCommitDetails(commitSha)).files;
}

export async function getSourceFileContent(filePath, commitSha) {
    const response = await octokit.repos.getContent({
        owner: process.env.SOURCE_OWNER,
        repo: process.env.SOURCE_REPO,
        path: filePath,
        ref: commitSha
    });
    if (Array.isArray(response.data) || response.data.type !== "file") throw new Error(`Expected ${filePath} to be a file`);
    if (response.data.encoding !== "base64") throw new Error(`Unsupported encoding for ${filePath}: ${response.data.encoding}`);
    return decodeGitHubFileContent(response.data.content);
}

export function decodeGitHubFileContent(content) {
    if (typeof content !== "string") throw new TypeError("GitHub file content must be a base64 string");
    return Buffer.from(content.replace(/\s/g, ""), "base64").toString("utf8");
}

export async function createPullRequest(branchName, commitSha) {
    const response = await octokit.pulls.create({
        owner: process.env.TARGET_OWNER,
        repo: process.env.TARGET_REPO,
        title: `Sync changes from source commit ${commitSha.slice(0, 7)}`,
        head: branchName,
        base: "main",
        body: `This Pull Request was automatically created by the GitHub Sync Bot.\n\nSource Commit:\n${commitSha}\n\nChanges were synchronized from the source repository.`
    });
    return response.data.html_url;
}
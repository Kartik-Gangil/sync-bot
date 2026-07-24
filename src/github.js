import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

export async function getCommitChanges(commitSha) {
    const response = await octokit.repos.getCommit({
        owner: process.env.SOURCE_OWNER,
        repo: process.env.SOURCE_REPO,
        ref: commitSha
    });

    return response.data.files;
}

export async function getSourceFileContent(filePath , commitSha) {
    const response = await octokit.repos.getContent({
        owner: process.env.SOURCE_OWNER,
        repo: process.env.SOURCE_REPO,
        path: filePath,
        ref: commitSha
    });

    const content = Buffer
        .from(response.data.content, "base64")
        .toString("utf-8");

    return content;
}


export async function createPullRequest(
    branchName,
    commitSha
) {
    const response =
        await octokit.pulls.create({
            owner: process.env.TARGET_OWNER,
            repo: process.env.TARGET_REPO,

            title:
                `Sync changes from source commit ${commitSha.slice(0, 7)}`,

            head: branchName,

            base: "main",

            body: `
This Pull Request was automatically created by the GitHub Sync Bot.

Source Commit:
${commitSha}

Changes were synchronized from the source repository.
            `
        });

    return response.data.html_url;
}
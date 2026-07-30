import { getCommitDetails, getSourceFileContent, createPullRequest } from "./github.js";
import simpleGit from "simple-git";
import { loadSyncConfig, updateTargetFile } from "./file-sync.js";
import { getMarkdownChanges, formatMarkdownChanges } from "./markdown-diff.js";
import path from "path";
import fs from "fs/promises";
import { cloneTargetRepository } from "./git.js";
import dotenv from "dotenv";
import { main } from "./agent.js";

dotenv.config();

export async function syncRepository(commitSha) {
    if (!commitSha || typeof commitSha !== "string") throw new TypeError("A commit SHA is required");

    const config = loadSyncConfig();
    const { files: changedFiles, parentSha } = await getCommitDetails(commitSha);
    const targetPath = await cloneTargetRepository();
    const git = simpleGit(targetPath);
    const branchName = `sync/source-${commitSha.slice(0, 7)}`;
    await git.checkoutLocalBranch(branchName);

    for (const file of changedFiles) await processFile(file, targetPath, commitSha, parentSha, config);

    const status = await git.status();
    if (!status.modified.length && !status.created.length && !status.deleted.length) return null;

    await git.add(".");
    await git.commit(`Sync changes from source commit ${commitSha.slice(0, 7)}`);
    await git.push("origin", branchName);
    return createPullRequest(branchName, commitSha);
}

async function processFile(file, targetPath, commitSha, parentSha, config) {
    if (file.status !== "modified" && file.status !== "added") return;

    const targetFile = getTargetFile(file.filename, config);
    if (!targetFile) return;

    const currentSource = await getSourceFileContent(file.filename, commitSha);
    const previousSource = file.status === "added" || !parentSha ? "" : await getSourceFileContent(file.filename, parentSha);
    const changes = getMarkdownChanges(previousSource, currentSource);
    if (!changes.length) return;

    const targetFilePath = path.join(targetPath, targetFile);
    let targetContent = "";
    try {
        targetContent = await fs.readFile(targetFilePath, "utf8");
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }

    const mergedContent = await syncMarkdownToJSX(formatMarkdownChanges(changes), targetContent);
    await updateTargetFile(targetPath, file.filename, mergedContent, config);
}

export async function syncMarkdownToJSX(markdownChanges, targetContent) {
    if (markdownChanges === "NO_DOCUMENTATION_CHANGES") return targetContent;
    const targetData = await main(markdownChanges, targetContent);
    if (typeof targetData !== "string" || !targetData.trim()) throw new Error("Refusing to write an empty LLM response");
    return targetData;
}

export function getTargetFile(sourceFile, config) {
    return config.mappings.find((item) => item.source?.toLowerCase() === sourceFile.toLowerCase())?.target ?? null;
}
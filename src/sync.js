import {
    getCommitChanges,
    octokit,
    getSourceFileContent,
    createPullRequest
} from "./github.js";
import simpleGit from "simple-git";
import {
    deleteTargetFile,
    loadSyncConfig,
    updateTargetFile
} from "./file-sync.js";
import path from "path"
import fs from "fs/promises"
import { cloneTargetRepository } from './git.js';
import dotenv from "dotenv";
import { main } from "./agent.js";

dotenv.config();

const config = loadSyncConfig();

export async function syncRepository(commitSha) {
    console.log(
        "Starting synchronization..."
    );

    // Get changed files
    const changedFiles =
        await getCommitChanges(commitSha);

    // Clone target repo
    const targetPath =
        await cloneTargetRepository();

    // Target repository ke liye Git instance
    const git =
        simpleGit(targetPath);

    // New branch ka naam
    const branchName =
        `sync/source-${commitSha.slice(0, 7)}`;

    // New branch create karo
    await git.checkoutLocalBranch(
        branchName
    );

    console.log(
        `Created branch: ${branchName}`
    );

    // Process every changed file
    for (const file of changedFiles) {
        await processFile(
            file,
            targetPath,
            commitSha,
            config
        );
    }

    console.log(
        "All files processed"
    );

    // 6. Check Git status
    const status =
        await git.status();


    console.log(
        "Git status:",
        status
    );
    // 7. Check if there are actually changes
    if (
        status.modified.length === 0 &&
        status.created.length === 0 &&
        status.deleted.length === 0
    ) {

        console.log(
            "No changes found"
        );

        return;

    }


    // 8. Stage all changes
    await git.add(".");


    console.log(
        "Changes staged"
    );


    // 9. Commit changes
    await git.commit(
        `Sync changes from source commit ${commitSha.slice(0, 7)}`
    );


    console.log(
        "Changes committed"
    );

    // const remotes = await git.getRemotes(
    //     true
    // );

    // console.log(
    //     remotes.map(remote => ({
    //         name: remote.name,
    //         fetch: remote.refs.fetch,
    //         push: remote.refs.push
    //     }))
    // );

    // 10. Push branch to target repository
    await git.push(
        "origin",
        branchName
    );



    console.log(
        "Branch pushed successfully"
    );


    // 11. Create Pull Request
    const prUrl =
        await createPullRequest(
            branchName,
            commitSha
        );


    console.log(
        "Pull Request created:",
        prUrl
    );


}

async function processFile(
    file,
    targetPath,
    commitSha,
    config
) {
    // 1. Deleted file
    if (file.status === "removed") {
        await deleteTargetFile(
            targetPath,
            file.filename,
            config
        );

        return;
    }

    // 2. Only process added or modified files
    if (
        file.status !== "modified" &&
        file.status !== "added"
    ) {
        return;
    }

    console.log(
        `Processing: ${file.filename}`
    );

    // 3. Get latest source file content
    const sourceContent =
        await getSourceFileContent(
            file.filename,
            commitSha
        );

    const targetFile = getTargetFile(
        file.filename,
        config
    );


    if (!targetFile) {
        console.log(
            `No target mapping found for ${file.filename}`
        );
        return;
    }
    // ye code block target file path construct kr rha hai
    const targetFilePath = path.join(
        targetPath,
        targetFile
    );
    // ye code block target file ka content gather kr rha hai
    const targetContent = await fs.readFile(
        targetFilePath,
        "utf-8"
    );

    // now i have source contant and target content

    const mergedContent = await syncMarkdownToJSX(
        sourceContent,
        targetContent
    );

    // await fs.writeFile(
    //     targetFilePath,
    //     updatedContent,
    //     "utf-8"
    // );

    // 4. Update target repository
    await updateTargetFile(
        targetPath,
        file.filename,
        mergedContent,
        config
    );
}

export async function syncMarkdownToJSX(sourceContent, targetContent) {
    try {
        const targetData = await main(sourceContent, targetContent);
        return targetData;
    } catch (error) {
        return console.log(error)
    }
}

export function getTargetFile(sourceFile, config) {
    const mapping = config.mappings.find(
        (item) => item.source === sourceFile
    );

    if (!mapping) {
        return null;
    }

    return mapping.target;
}
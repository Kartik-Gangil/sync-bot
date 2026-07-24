import simpleGit from "simple-git";
import fs from "fs/promises";
import path from "path";

import dotenv from "dotenv";
dotenv.config();

export async function cloneTargetRepository() {
    const targetPath = path.resolve("./temp-target");

    // Delete old clone if it exists
    await fs.rm(targetPath, {
        recursive: true,
        force: true
    });

    const repoUrl =
        `https://${process.env.GITHUB_TOKEN}` +
        `@github.com/${process.env.TARGET_OWNER}` +
        `/${process.env.TARGET_REPO}.git`;

    await simpleGit().clone(
        repoUrl,
        targetPath
    );

    return targetPath;
}
import simpleGit from "simple-git";
import fs from "fs/promises";
import os from "os";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export async function cloneTargetRepository() {
    const targetPath = await fs.mkdtemp(path.join(os.tmpdir(), "github-sync-target-"));
    const repoUrl = `https://${process.env.GITHUB_TOKEN}@github.com/${process.env.TARGET_OWNER}/${process.env.TARGET_REPO}.git`;
    await simpleGit().clone(repoUrl, targetPath);
    return targetPath;
}
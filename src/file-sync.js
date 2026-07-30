import fs from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function loadSyncConfig() {
    const configPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "sync.config.json");
    if (!existsSync(configPath)) return { mappings: [] };
    return JSON.parse(readFileSync(configPath, "utf8"));
}

export function resolveTargetFilePath(sourceFilePath, config = { mappings: [] }) {
    const normalizedSourcePath = sourceFilePath.replace(/^\.\/+/, "");
    const mapping = config.mappings?.find((entry) => entry.source?.replace(/^\.\/+/, "").toLowerCase() === normalizedSourcePath.toLowerCase());
    return mapping?.target ?? sourceFilePath;
}

function targetPathWithinRepository(repositoryPath, relativePath) {
    const root = path.resolve(repositoryPath);
    const target = path.resolve(root, relativePath);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error(`Target path escapes repository: ${relativePath}`);
    return target;
}

export async function updateTargetFile(targetRepositoryPath, filePath, newContent, config = { mappings: [] }) {
    if (typeof newContent !== "string") throw new TypeError("Target content must be a string");
    const relativePath = resolveTargetFilePath(filePath, config);
    const targetFilePath = targetPathWithinRepository(targetRepositoryPath, relativePath);
    await fs.mkdir(path.dirname(targetFilePath), { recursive: true });
    await fs.writeFile(targetFilePath, newContent, "utf8");
    console.log(`Updated: ${filePath} -> ${relativePath}`);
}

export async function deleteTargetFile(targetRepositoryPath, filePath, config = { mappings: [] }) {
    const relativePath = resolveTargetFilePath(filePath, config);
    const targetFilePath = targetPathWithinRepository(targetRepositoryPath, relativePath);
    await fs.rm(targetFilePath, { force: true });
    console.log(`Deleted: ${filePath} -> ${relativePath}`);
}
import fs from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function loadSyncConfig() {
    const configPath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "sync.config.json"
    );

    if (!existsSync(configPath)) {
        return { mappings: [] };
    }

    return JSON.parse(readFileSync(configPath, "utf8"));
}

export function resolveTargetFilePath(sourceFilePath, config = { mappings: [] }) {
    const normalizedSourcePath = sourceFilePath.replace(/^\.\/+/, "");
    const mapping = config.mappings?.find((entry) => {
        const normalizedEntrySource = entry.source?.replace(/^\.\/+/, "");
        return (
            normalizedEntrySource === normalizedSourcePath ||
            normalizedEntrySource?.toLowerCase() === normalizedSourcePath.toLowerCase()
        );
    });

    return mapping?.target ?? sourceFilePath;
}

export async function updateTargetFile(
    targetRepositoryPath,
    filePath,
    newContent,
    config = { mappings: [] }
) {
    const targetFilePath = path.join(
        targetRepositoryPath,
        resolveTargetFilePath(filePath, config)
    );

    await fs.mkdir(path.dirname(targetFilePath), { recursive: true });
    await fs.writeFile(
        targetFilePath,
        newContent,
        "utf-8"
    );

    console.log(
        `Updated: ${filePath} -> ${resolveTargetFilePath(filePath, config)}`
    );
}

export async function deleteTargetFile(
    targetRepositoryPath,
    filePath,
    config = { mappings: [] }
) {
    const targetFilePath = path.join(
        targetRepositoryPath,
        resolveTargetFilePath(filePath, config)
    );

    await fs.rm(targetFilePath, { force: true });

    console.log(
        `Deleted: ${filePath} -> ${resolveTargetFilePath(filePath, config)}`
    );
}
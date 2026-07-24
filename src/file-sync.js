import fs from "fs/promises";
import path from "path";

export async function updateTargetFile(
    targetRepositoryPath,
    filePath,
    newContent
) {
    const targetFilePath = path.join(
        targetRepositoryPath,
        filePath
    );

    await fs.writeFile(
        targetFilePath,
        newContent,
        "utf-8"
    );

    console.log(
        `Updated: ${filePath}`
    );
}
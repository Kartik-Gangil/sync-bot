import express from "express";
import dotenv from "dotenv";
import { syncRepository } from "./sync.js";
// import { mappings } from "../sync.config.json" ;

dotenv.config();

const app = express();

app.use(express.json());

// this is trigger by github webhook when a push is made to the source repository
app.post("/webhooks/github", async (req, res) => {
    try {
        const event = req.headers["x-github-event"];

        console.log("GitHub Event:", event);

        if (event === "push") {
            const branch = req.body.ref;
            const commitSha = req.body.after;

            // Only sync main branch
            if (branch === "refs/heads/main") {
                await syncRepository(commitSha);
            }
        }

        res.status(200).json({
            success: true
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});



// function mapFile(sourcePath) {
//     const mapping = mappings.find((mapping) =>
//         sourcePath.startsWith(mapping.source)
//     );

//     if (!mapping) {
//         return null;
//     }

//     return sourcePath.replace(
//         mapping.source,
//         mapping.target
//     );
// }



app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
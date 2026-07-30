import { unified } from "unified";
import remarkParse from "remark-parse";

const md = `
## GitHub Authentication

#### Import Package

##### ES Modules

\`\`\`javascript
import { GithubLogin } from "@kartikgangil/watchman_js";
\`\`\`

#### Handle Callback

\`\`\`javascript
app.get("/callback")
\`\`\`
`;

const tree = unified()
    .use(remarkParse)
    .parse(md);

console.log(JSON.stringify(tree, null, 2));
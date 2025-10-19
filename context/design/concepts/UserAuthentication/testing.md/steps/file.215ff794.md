---
timestamp: 'Sun Oct 19 2025 16:38:40 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251019_163840.82fcec89.md]]'
content_id: 215ff794bf1fb35d5fbf7074fb37f6ac871ccc0c6d41d9019a2b733003651b32
---

# file: deno.json

```json
{
    "nodeModulesDir": "auto",
    "imports": {
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api",
        "test:historical": "deno run --allow-net --allow-read --allow-env src/concepts/HistoricalContextAgent/AIHistoricalContextAgent.test.ts",
        "historical": "deno run --allow-net --allow-read --allow-env src/historical-cli.ts"
    }
}
```

---
timestamp: 'Sun Oct 19 2025 17:31:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251019_173118.23bb90e8.md]]'
content_id: 6880d45116b68c873f87c5a00e24c2e501031d8e8f049598f35913831e5ee407
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
        "test:historical": "deno test --allow-net --allow-read --allow-sys --allow-env src/concepts/HistoricalContextAgent/AIHistoricalContextAgent.test.ts",
        "test:user-auth": "deno test --allow-net --allow-read --allow-sys --allow-env src/concepts/UserAuthentication/UserAuthentication.test.ts",
        "test:location-chat": "deno test --allow-net --allow-read --allow-sys --allow-env src/concepts/LocationChatLedger/LocationChatLedger.test.ts",
        "historical": "deno run --allow-net --allow-read --allow-env src/historical-cli.ts"
    }
}
```

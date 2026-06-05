{
  "$comment": "Rendered per-user by the supervisor at spawn time. The placeholders are replaced with real values from the user's record.",

  "userId": "__USER_ID__",
  "defaultModel": "__DEFAULT_MODEL__",
  "openrouter": {
    "apiKey": "__OPENROUTER_KEY__",
    "baseUrl": "https://openrouter.ai/api/v1"
  },
  "telegram": {
    "botToken": "__TELEGRAM_TOKEN__"
  },

  "skills": "__ENABLED_SKILLS__",

  "mcpServers": {
    "searxng": { "type": "sse", "url": "__SEARXNG_URL__" },
    "firecrawl": { "type": "sse", "url": "__FIRECRAWL_URL__" },
    "filesystem": { "type": "http", "url": "http://127.0.0.1:7001" },
    "fetch": { "type": "http", "url": "http://127.0.0.1:7003" }
  },

  "limits": {
    "rssMb": 256,
    "contextTokens": 16384,
    "requestTimeoutSec": 60
  }
}

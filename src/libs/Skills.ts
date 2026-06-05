// Catalog of preinstalled skills (20) and MCP servers (6).
// These are the items shipped with the agent-runtime image. Users can toggle each
// in the control panel; custom MCPs can be added by URL.

export type SkillDef = {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'code' | 'data' | 'productivity' | 'media' | 'devops' | 'comms';
  defaultEnabled: boolean;
};

export type McpDef = {
  id: string;
  name: string;
  description: string;
  transport: 'sse' | 'http';
  // Default endpoint; for some this comes from env (e.g. SEARXNG_URL).
  defaultUrl: string | { envKey: string };
  defaultEnabled: boolean;
};

export const SKILLS: SkillDef[] = [
  { id: 'web-search', name: 'Web Search', description: 'Search the public web via SearXNG.', category: 'web', defaultEnabled: true },
  { id: 'web-scrape', name: 'Web Scrape', description: 'Fetch a URL and convert it to clean markdown via Firecrawl.', category: 'web', defaultEnabled: true },
  { id: 'http-fetch', name: 'HTTP Fetch', description: 'Make HTTP requests with custom headers and body.', category: 'web', defaultEnabled: true },
  { id: 'code-exec-js', name: 'JavaScript Sandbox', description: 'Run isolated Node.js snippets and return the result.', category: 'code', defaultEnabled: true },
  { id: 'code-exec-py', name: 'Python Sandbox', description: 'Run isolated Python snippets and return the result.', category: 'code', defaultEnabled: true },
  { id: 'git-ops', name: 'Git Operations', description: 'Stage, commit, branch, push, and open PRs.', category: 'devops', defaultEnabled: false },
  { id: 'file-ops', name: 'File Operations', description: 'Read, write, and edit files in the agent workspace.', category: 'devops', defaultEnabled: true },
  { id: 'json-transform', name: 'JSON Transform', description: 'jq-style transforms over JSON data.', category: 'data', defaultEnabled: true },
  { id: 'csv-ops', name: 'CSV Ops', description: 'Parse, filter, and summarise CSV files.', category: 'data', defaultEnabled: false },
  { id: 'sql-query', name: 'SQL Query', description: 'Run read-only SQL queries against a configured database.', category: 'data', defaultEnabled: false },
  { id: 'regex-tool', name: 'Regex', description: 'Match, extract, and replace via regular expressions.', category: 'data', defaultEnabled: true },
  { id: 'markdown-render', name: 'Markdown Render', description: 'Render markdown to HTML or PDF.', category: 'data', defaultEnabled: true },
  { id: 'image-ocr', name: 'Image OCR', description: 'Extract text from an image.', category: 'media', defaultEnabled: false },
  { id: 'pdf-read', name: 'PDF Read', description: 'Extract text from a PDF document.', category: 'media', defaultEnabled: false },
  { id: 'email-draft', name: 'Email Draft', description: 'Compose emails for the user to review before sending.', category: 'comms', defaultEnabled: true },
  { id: 'translate', name: 'Translate', description: 'Translate text between languages.', category: 'productivity', defaultEnabled: true },
  { id: 'summarize', name: 'Summarize', description: 'Condense long documents or URLs to a short summary.', category: 'productivity', defaultEnabled: true },
  { id: 'todo-list', name: 'Todo List', description: 'Persistent checklist stored with the agent.', category: 'productivity', defaultEnabled: true },
  { id: 'cron-job', name: 'Cron Jobs', description: 'Schedule recurring tasks the agent should run.', category: 'productivity', defaultEnabled: false },
  { id: 'memory-notes', name: 'Memory Notes', description: 'Long-term notes the agent can recall across sessions.', category: 'productivity', defaultEnabled: true },
];

export const MCPS: McpDef[] = [
  {
    id: 'searxng',
    name: 'SearXNG',
    description: 'Privacy-respecting meta-search engine.',
    transport: 'sse',
    defaultUrl: { envKey: 'SEARXNG_URL' },
    defaultEnabled: true,
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: 'Convert any URL to clean, LLM-friendly markdown.',
    transport: 'sse',
    defaultUrl: { envKey: 'FIRECRAWL_URL' },
    defaultEnabled: true,
  },
  {
    id: 'telegram-personal',
    name: 'Telegram (Bot)',
    description: 'The user’s connected Telegram bot.',
    transport: 'sse',
    defaultUrl: '/internal/telegram',
    defaultEnabled: true,
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Read and write files inside the agent workspace.',
    transport: 'http',
    defaultUrl: 'http://127.0.0.1:7001',
    defaultEnabled: true,
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Local git operations against the agent workspace.',
    transport: 'http',
    defaultUrl: 'http://127.0.0.1:7002',
    defaultEnabled: false,
  },
  {
    id: 'fetch',
    name: 'Fetch',
    description: 'General-purpose HTTP fetcher with auth support.',
    transport: 'http',
    defaultUrl: 'http://127.0.0.1:7003',
    defaultEnabled: true,
  },
];

export const DEFAULT_ENABLED_SKILLS = SKILLS.filter((s) => s.defaultEnabled).map((s) => s.id);
export const DEFAULT_ENABLED_MCPS = MCPS.filter((m) => m.defaultEnabled).map((m) => m.id);

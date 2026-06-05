// Minimal logger that prefixes a thematic tag — useful when scanning logs.
const TAG_RE = /^[A-Z][A-Z0-9_]+$/;

function fmt(tag: string, level: 'info' | 'warn' | 'error' | 'debug', msg: string, extra?: unknown) {
  const safeTag = TAG_RE.test(tag) ? tag : 'LOG';
  const ts = new Date().toISOString();
  const tail = extra !== undefined ? ` ${JSON.stringify(extra)}` : '';
  return `[${safeTag}] ${ts} ${level.toUpperCase()} ${msg}${tail}`;
}

export const logger = {
  info: (tag: string, msg: string, extra?: unknown) =>
    // eslint-disable-next-line no-console
    console.log(fmt(tag, 'info', msg, extra)),
  warn: (tag: string, msg: string, extra?: unknown) =>
    // eslint-disable-next-line no-console
    console.warn(fmt(tag, 'warn', msg, extra)),
  error: (tag: string, msg: string, extra?: unknown) =>
    // eslint-disable-next-line no-console
    console.error(fmt(tag, 'error', msg, extra)),
  debug: (tag: string, msg: string, extra?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(fmt(tag, 'debug', msg, extra));
    }
  },
};

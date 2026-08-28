// lib/scrapers/http-client.ts
// Shared HTTP client with retry logic, user-agent rotation, and rate limiting.

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface FetchOptions {
  /** Extra headers to merge in */
  headers?: Record<string, string>;
  /** Timeout in ms (default 15000) */
  timeoutMs?: number;
  /** Number of retries on network error (default 2) */
  retries?: number;
  /** Delay between retries in ms (default 1500) */
  retryDelayMs?: number;
}

/**
 * Fetch a URL with browser-like headers, automatic retries, and timeout.
 * Returns the Response on success, throws on final failure.
 */
export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    headers = {},
    timeoutMs = 15000,
    retries = 2,
    retryDelayMs = 1500,
  } = options;

  const baseHeaders: Record<string, string> = {
    'User-Agent': randomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
    ...headers,
  };

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: baseHeaders,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        console.warn(`[http-client] Attempt ${attempt + 1} failed for ${url}: ${lastError.message}. Retrying in ${retryDelayMs}ms...`);
        await sleep(retryDelayMs * (attempt + 1)); // exponential back-off
      }
    }
  }

  throw lastError;
}

/**
 * Fetch HTML text from a URL.
 */
export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const response = await fetchWithRetry(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
  }
  return response.text();
}

/**
 * Fetch JSON from a URL.
 */
export async function fetchJson<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
  }
  return response.json() as Promise<T>;
}

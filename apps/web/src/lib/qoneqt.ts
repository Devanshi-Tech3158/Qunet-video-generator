/**
 * Sharing to the Qoneqt feed.
 *
 * The Qoneqt API contract is **not final**, so nothing here calls it. Instead the
 * app talks to a `ShareAdapter`, and the only implementation is a mock that
 * behaves like a real one - it validates, it can fail, it returns a post id and
 * a URL - so the UI is built and tested against the real shape of the problem
 * rather than a stub that always succeeds.
 *
 * Swapping in the real adapter is a one-line change in `getShareAdapter()` plus a
 * new file; nothing in the UI moves.
 */

export interface QoneqtSharePayload {
  jobId: string;
  title: string;
  caption: string;
  hashtags: string[];
  /** Storage URL of the MP4, when the job has finished rendering one. */
  mp4Url?: string;
  /** The approved script, posted as the caption body when there is no caption. */
  script?: string;
}

export type QoneqtShareResult =
  | { ok: true; postId: string; url: string; adapter: string }
  | { ok: false; error: string; adapter: string };

export interface ShareAdapter {
  /** Adapter name, shown in the UI so a mock is never mistaken for the real thing. */
  readonly name: string;
  /** True when this adapter posts to the real Qoneqt API. */
  readonly live: boolean;
  share(payload: QoneqtSharePayload): Promise<QoneqtShareResult>;
}

/** A share needs something to share. */
export function validateSharePayload(payload: QoneqtSharePayload): string | null {
  if (payload.title.trim().length === 0) return 'Add a title before sharing.';
  if (payload.caption.trim().length === 0 && payload.hashtags.length === 0) {
    return 'Add a caption or at least one hashtag before sharing.';
  }
  return null;
}

/**
 * The mock adapter.
 *
 * `failNext` exists so the error path can be tested without a network: the UI has
 * to handle a rejected share gracefully, and a mock that always succeeds proves
 * nothing about that.
 */
export function createMockQoneqtAdapter(options: { latencyMs?: number; failNext?: boolean } = {}) {
  let failNext = options.failNext === true;

  return {
    name: 'qoneqt-mock',
    live: false,

    async share(payload: QoneqtSharePayload): Promise<QoneqtShareResult> {
      const problem = validateSharePayload(payload);
      if (problem !== null) {
        return { ok: false, error: problem, adapter: 'qoneqt-mock' };
      }

      if (failNext === true) {
        failNext = false;
        return {
          ok: false,
          error: 'The Qoneqt feed rejected the post. Nothing was published.',
          adapter: 'qoneqt-mock',
        };
      }

      if (options.latencyMs !== undefined && options.latencyMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, options.latencyMs));
      }

      const postId = `qoneqt_${payload.jobId}`;
      return {
        ok: true,
        postId,
        // A plausible deep link. Not reachable - the feed does not exist yet.
        url: `https://qoneqt.example/feed/${postId}`,
        adapter: 'qoneqt-mock',
      };
    },
  } satisfies ShareAdapter;
}

/**
 * Real HTTP adapter for the Qoneqt REST API.
 */
export function createHttpQoneqtAdapter(
  endpointUrl: string,
  options: { apiKey?: string; latencyMs?: number } = {},
): ShareAdapter {
  return {
    name: 'qoneqt-rest-api',
    live: true,

    async share(payload: QoneqtSharePayload): Promise<QoneqtShareResult> {
      const problem = validateSharePayload(payload);
      if (problem !== null) {
        return { ok: false, error: problem, adapter: 'qoneqt-rest-api' };
      }

      if (options.latencyMs !== undefined && options.latencyMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, options.latencyMs));
      }

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };
        if (options.apiKey !== undefined && options.apiKey.trim().length > 0) {
          headers.Authorization = `Bearer ${options.apiKey.trim()}`;
        }

        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          return {
            ok: false,
            error: `Qoneqt API responded with HTTP ${response.status}: ${body || response.statusText}`,
            adapter: 'qoneqt-rest-api',
          };
        }

        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        const postId =
          typeof data.postId === 'string'
            ? data.postId
            : typeof data.id === 'string'
              ? data.id
              : `qoneqt_${payload.jobId}`;
        const url =
          typeof data.url === 'string'
            ? data.url
            : typeof data.postUrl === 'string'
              ? data.postUrl
              : `https://qoneqt.com/post/${postId}`;

        return {
          ok: true,
          postId,
          url,
          adapter: 'qoneqt-rest-api',
        };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error
              ? `Failed to publish to Qoneqt: ${err.message}`
              : 'Network error publishing to Qoneqt',
          adapter: 'qoneqt-rest-api',
        };
      }
    },
  } satisfies ShareAdapter;
}

/** The adapter the app uses. Uses live HTTP API when configured, otherwise falls back to the test/preview mock. */
export function getShareAdapter(): ShareAdapter {
  try {
    const customEndpoint =
      (typeof window !== 'undefined' && window.localStorage?.getItem('qoneqt.api-url')) ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_QONEQT_API_URL);
    if (typeof customEndpoint === 'string' && customEndpoint.trim().length > 0) {
      const apiKey =
        typeof window !== 'undefined'
          ? window.localStorage?.getItem('qoneqt.api-key') ?? undefined
          : undefined;
      return createHttpQoneqtAdapter(customEndpoint.trim(), { apiKey: apiKey ?? undefined });
    }
  } catch {
    // Ignore storage errors and fall back to mock
  }
  return createMockQoneqtAdapter();
}

/** What the UI says about the current adapter, so it is never ambiguous. */
export function shareAdapterNotice(adapter: ShareAdapter): string {
  return adapter.live === true
    ? 'Posts straight to your Qoneqt feed.'
    : `Preview mode: ${adapter.name} is standing in for the Qoneqt API, which is not final yet. Nothing is published.`;
}

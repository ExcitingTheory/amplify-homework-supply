/**
 * Mock next/server for Storybook
 * Provides stub exports for server-only Next.js APIs that are imported
 * by @aws-amplify/adapter-nextjs at runtime.
 */

export class NextResponse extends Response {
  static json(body, init) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  }
  static redirect(url, status = 307) {
    return new Response(null, { status, headers: { location: String(url) } });
  }
  static next(init) {
    return new Response(null, init);
  }
}

export class NextRequest extends Request {
  constructor(input, init) {
    super(input, init);
    this.nextUrl = new URL(typeof input === 'string' ? input : input.url);
  }
}

export function userAgent() {
  return { isBot: false, browser: {}, device: {}, engine: {}, os: {}, cpu: {} };
}

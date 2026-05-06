import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - Next.js internals (_next)
  // - Vercel internals (_vercel)
  // - Static files (those with a file extension)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};

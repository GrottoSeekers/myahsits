// "Add to Home Screen" support. Every page's <head> gets these tags from
// the middleware (src/middleware.ts), so no page has to remember them:
// the web app manifest, the brown paw home-screen icons, iOS standalone
// meta tags and the service worker registration (public/sw.js).

const TAGS = [
  '<link rel="manifest" href="/manifest.json" />',
  '<meta name="theme-color" content="#faf6ee" />',
  '<meta name="application-name" content="MYAH" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-title" content="MYAH" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="format-detection" content="telephone=no" />',
  '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />',
  '<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />',
  '<link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167.png" />',
  '<link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152.png" />',
  '<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />',
  '<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />',
  "<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(){})})}</script>",
].join('');

// Older per-page icon links that the tags above replace.
const OLD = /<link rel="apple-touch-icon" href="\/images\/app-tile\.png"\s*\/?>/g;

/** Adds the PWA tags to an HTML page (once). */
export function withPwaHead(html: string): string {
  if (html.includes('rel="manifest"') || !html.includes('</head>')) return html;
  return html.replace(OLD, '').replace('</head>', TAGS + '</head>');
}

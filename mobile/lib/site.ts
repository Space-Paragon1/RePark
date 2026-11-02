import * as WebBrowser from 'expo-web-browser';

/** The RePark website, for the Terms, Privacy and Contact pages. */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://re-park.vercel.app').replace(/\/$/, '');

/** Opens a website page in the in-app browser, e.g. openSitePage('/privacy'). */
export function openSitePage(path: string) {
  WebBrowser.openBrowserAsync(`${SITE_URL}${path}`).catch(() => {});
}

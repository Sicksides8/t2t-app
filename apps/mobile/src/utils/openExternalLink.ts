import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../theme';

const URL_PROTOCOL_RE = /^https?:\/\//i;

export async function openExternalLink(url: string): Promise<void> {
  const trimmed = (url || '').trim();
  if (!trimmed || !URL_PROTOCOL_RE.test(trimmed)) return;

  try {
    await WebBrowser.openBrowserAsync(trimmed, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: Colors.bgDeep,
      controlsColor: Colors.accentPrimary,
      dismissButtonStyle: 'close',
      enableBarCollapsing: true,
    });
  } catch {
    try {
      await Linking.openURL(trimmed);
    } catch {
      // last resort: silently ignore – called from UI handlers
    }
  }
}

export function getLinkHostLabel(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

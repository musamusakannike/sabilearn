import { isTauri } from './env';
import { openExternalUrl } from './opener';

export interface OAuthLoopbackResult {
  code: string;
  state: string;
  redirectUri: string;
}

/**
 * Starts a temporary 127.0.0.1 loopback HTTP server in Rust to capture the
 * Google OAuth PKCE authorization code after opening the system browser.
 */
export async function runGoogleLoopbackOAuth(params: {
  clientId: string;
  codeChallenge: string;
  state: string;
}): Promise<OAuthLoopbackResult> {
  if (!isTauri()) {
    throw new Error('Desktop loopback OAuth requires the Tauri runtime.');
  }

  const { invoke } = await import('@tauri-apps/api/core');
  const port = await invoke<number>('oauth_start_loopback');
  const redirectUri = `http://127.0.0.1:${port}/callback`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', params.clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('code_challenge', params.codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', params.state);
  authUrl.searchParams.set('prompt', 'select_account');

  await openExternalUrl(authUrl.toString());

  const result = await invoke<{ code: string; state: string }>('oauth_wait_callback');
  return {
    code: result.code,
    state: result.state,
    redirectUri,
  };
}

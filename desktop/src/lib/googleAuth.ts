import { isTauri, platformFetch, runGoogleLoopbackOAuth } from '@/platform';

export function isGoogleDesktopAuthEnabled(): boolean {
  const clientId = import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_ID as string | undefined;
  const fbKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  return Boolean(clientId?.trim() && fbKey?.trim());
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generatePkce(): Promise<{ verifier: string; challenge: string; state: string }> {
  const rand = new Uint8Array(32);
  crypto.getRandomValues(rand);
  const verifier = base64UrlEncode(rand);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64UrlEncode(new Uint8Array(digest));

  const stateBytes = new Uint8Array(16);
  crypto.getRandomValues(stateBytes);
  const state = base64UrlEncode(stateBytes);

  return { verifier, challenge, state };
}

/**
 * Obtains a Firebase ID token via Google OAuth:
 * - Tauri desktop: system-browser PKCE + 127.0.0.1 loopback server -> Google token exchange -> Firebase `signInWithCredential`
 * - Browser dev fallback: Firebase Web SDK `signInWithPopup`
 */
export async function obtainFirebaseIdTokenViaGoogle(): Promise<string> {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

  if (!apiKey || !projectId) {
    throw new Error('Firebase Web config is not set in environment variables.');
  }

  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup } = await import(
    'firebase/auth'
  );

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({ apiKey, authDomain, projectId, appId });
  const auth = getAuth(app);

  if (!isTauri()) {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return cred.user.getIdToken();
  }

  const clientId = (import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_ID as string | undefined)?.trim();
  const clientSecret = (
    import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_SECRET as string | undefined
  )?.trim();

  if (!clientId) {
    throw new Error('VITE_GOOGLE_DESKTOP_CLIENT_ID is not configured.');
  }

  const { verifier, challenge, state } = await generatePkce();
  const { code, state: returnedState, redirectUri } = await runGoogleLoopbackOAuth({
    clientId,
    codeChallenge: challenge,
    state,
  });

  if (returnedState !== state) {
    throw new Error('OAuth state mismatch. Please try signing in again.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });
  if (clientSecret) {
    params.set('client_secret', clientSecret);
  }

  const tokenRes = await platformFetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    timeoutMs: 15_000,
  });
  const tokenJson = (await tokenRes.json()) as { id_token?: string; error_description?: string };
  if (!tokenRes.ok || !tokenJson.id_token) {
    throw new Error(tokenJson.error_description || 'Google token exchange failed.');
  }

  const credential = GoogleAuthProvider.credential(tokenJson.id_token);
  const userCred = await signInWithCredential(auth, credential);
  return userCred.user.getIdToken();
}

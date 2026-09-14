export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const isGoogleAuthConfigured = Boolean(CLIENT_ID);

// 顧客データ・見積りデータを保存するGoogleスプレッドシート／ドライブへのアクセス権限
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

declare global {
  interface Window {
    google?: any;
  }
}

let tokenClient: any = null;
let cachedAccessToken: string | null = null;
let gisLoadPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Servicesの読み込みに失敗しました'));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

async function fetchUserInfo(accessToken: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('ユーザー情報の取得に失敗しました');
  const data = await res.json();
  return { name: data.name || data.email, email: data.email, picture: data.picture };
}

export async function googleSignIn(): Promise<{ user: GoogleUser; accessToken: string }> {
  if (!CLIENT_ID) {
    throw new Error('Google Client IDが未設定です。.envにVITE_GOOGLE_CLIENT_IDを設定してください（README参照）。');
  }
  await loadGisScript();

  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || 'Google認証に失敗しました'));
          return;
        }
        cachedAccessToken = response.access_token;
        try {
          const user = await fetchUserInfo(response.access_token);
          resolve({ user, accessToken: response.access_token });
        } catch (err) {
          reject(err);
        }
      },
      error_callback: (err: any) => {
        reject(new Error(err?.message || 'Google認証がキャンセルまたは失敗しました'));
      },
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export function getAccessToken(): string | null {
  return cachedAccessToken;
}

export function logout(): void {
  if (cachedAccessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(cachedAccessToken, () => {});
  }
  cachedAccessToken = null;
}

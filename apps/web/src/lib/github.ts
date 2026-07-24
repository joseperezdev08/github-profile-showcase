import 'server-only';
import type { GitHubUser } from '@/types/github-user';

const DEFAULT_API_URL = 'http://localhost:3001';
const DEFAULT_USERNAME = 'joseperezdev08';

export async function getProfile(): Promise<GitHubUser> {
  const apiUrl = (process.env.API_URL ?? DEFAULT_API_URL)
    .trim()
    .replace(/\/$/, '');
  const username = (process.env.GITHUB_USERNAME ?? DEFAULT_USERNAME).trim();
  const response = await fetch(
    `${apiUrl}/user/${encodeURIComponent(username)}`,
    {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(7_000),
    },
  );

  if (!response.ok) {
    throw new Error(`No se pudo cargar el perfil (${response.status}).`);
  }

  return (await response.json()) as GitHubUser;
}

import type { GitHubUser } from '@/types/github-user';

const DEFAULT_API_URL = 'http://localhost:3001';
const DEFAULT_USERNAME = 'joseperezdev08';

export async function getProfile(): Promise<GitHubUser> {
  const apiUrl = (process.env.API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');
  const username = process.env.GITHUB_USERNAME ?? DEFAULT_USERNAME;
  const response = await fetch(`${apiUrl}/user/${username}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el perfil (${response.status}).`);
  }

  return (await response.json()) as GitHubUser;
}

import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GitHubUserResponse } from './dto/github-user-response.dto';
import type { GitHubApiUser } from './types/github-api-user';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const REQUEST_TIMEOUT_MS = 5_000;
const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

@Injectable()
export class GitHubService {
  constructor(private readonly config: ConfigService) {}

  async getUser(username: string): Promise<GitHubUserResponse> {
    this.validateUsername(username);

    const response = await this.requestUser(username);

    if (response.status === 404) {
      throw new NotFoundException(`El usuario "${username}" no existe.`);
    }

    if (response.status === 403 || response.status === 429) {
      throw new HttpException(
        'GitHub alcanzó su límite de peticiones. Intenta nuevamente más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'GitHub no pudo responder correctamente a la solicitud.',
      );
    }

    try {
      const user = (await response.json()) as GitHubApiUser;
      return this.mapUser(user);
    } catch {
      throw new BadGatewayException(
        'GitHub devolvió una respuesta que no se pudo interpretar.',
      );
    }
  }

  private validateUsername(username: string): void {
    if (!USERNAME_PATTERN.test(username) || username.includes('--')) {
      throw new BadRequestException('El username de GitHub no es válido.');
    }
  }

  private async requestUser(username: string): Promise<Response> {
    const token = this.config.get<string>('GITHUB_TOKEN');
    const headers: HeadersInit = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'github-profile-showcase',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      return await fetch(
        `${GITHUB_API_URL}/users/${encodeURIComponent(username)}`,
        {
          headers,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
    } catch {
      throw new BadGatewayException(
        'No fue posible establecer conexión con GitHub.',
      );
    }
  }

  private mapUser(user: GitHubApiUser): GitHubUserResponse {
    return {
      username: user.login,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      email: user.email,
      location: user.location,
      company: user.company,
      website: user.blog.trim() || null,
      twitterUsername: user.twitter_username,
      publicRepositories: user.public_repos,
      followers: user.followers,
      following: user.following,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}

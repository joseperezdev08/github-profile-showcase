import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PROFILE_QUERY, REPOSITORIES_QUERY } from './github.queries';
import type { GitHubApiUser } from './types/github-api-user';
import type {
  GitHubGraphQlProfileData,
  GitHubGraphQlRepositoriesData,
  GitHubGraphQlRepository,
  GitHubGraphQlRepositoryConnection,
  GitHubGraphQlResponse,
} from './types/github-graphql';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = `${GITHUB_API_URL}/graphql`;
const GITHUB_API_VERSION = '2022-11-28';
const REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class GitHubClient {
  constructor(private readonly config: ConfigService) {}

  async getPublicUser(username: string): Promise<GitHubApiUser> {
    const response = await this.request(
      `${GITHUB_API_URL}/users/${encodeURIComponent(username)}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.getToken()}`,
          'User-Agent': 'github-profile-showcase',
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
        },
      },
    );

    if (response.status === 404) {
      throw new NotFoundException(`El usuario "${username}" no existe.`);
    }

    this.ensureSuccessful(response);

    return this.parseJson<GitHubApiUser>(response);
  }

  getProfile(username: string): Promise<GitHubGraphQlProfileData> {
    return this.executeGraphQl<GitHubGraphQlProfileData>(PROFILE_QUERY, {
      login: username,
      searchQuery: `is:pr author:${username} is:public sort:updated-desc`,
    });
  }

  async getAllPublicRepositories(
    username: string,
    firstPage: GitHubGraphQlRepositoryConnection,
  ): Promise<GitHubGraphQlRepository[]> {
    const repositories = this.filterPublicRepositories(firstPage.nodes);
    let pageInfo = firstPage.pageInfo;

    while (pageInfo.hasNextPage && pageInfo.endCursor) {
      const data = await this.executeGraphQl<GitHubGraphQlRepositoriesData>(
        REPOSITORIES_QUERY,
        { login: username, cursor: pageInfo.endCursor },
      );

      if (!data.user) {
        throw new NotFoundException(`El usuario "${username}" no existe.`);
      }

      repositories.push(
        ...this.filterPublicRepositories(data.user.repositories.nodes),
      );
      pageInfo = data.user.repositories.pageInfo;
    }

    return repositories;
  }

  private async executeGraphQl<T>(
    query: string,
    variables: Record<string, string>,
  ): Promise<T> {
    const response = await this.request(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json',
        'User-Agent': 'github-profile-showcase',
      },
      body: JSON.stringify({ query, variables }),
    });

    this.ensureSuccessful(response);
    const payload = await this.parseJson<GitHubGraphQlResponse<T>>(response);

    if (payload.errors?.length) {
      const rateLimited = payload.errors.some(
        (error) =>
          error.type === 'RATE_LIMITED' || /rate limit/i.test(error.message),
      );

      if (rateLimited) {
        this.throwRateLimit();
      }

      throw new BadGatewayException(
        'GitHub no pudo completar la consulta solicitada.',
      );
    }

    if (!payload.data) {
      throw new BadGatewayException('GitHub devolvió una respuesta sin datos.');
    }

    return payload.data;
  }

  private async request(
    url: string,
    options: Omit<RequestInit, 'signal'>,
  ): Promise<Response> {
    try {
      return await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new BadGatewayException(
        'No fue posible establecer conexión con GitHub.',
      );
    }
  }

  private ensureSuccessful(response: Response): void {
    if (response.status === 403 || response.status === 429) {
      this.throwRateLimit();
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'GitHub no pudo responder correctamente a la solicitud.',
      );
    }
  }

  private async parseJson<T>(response: Response): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch {
      throw new BadGatewayException(
        'GitHub devolvió una respuesta que no se pudo interpretar.',
      );
    }
  }

  private filterPublicRepositories(
    repositories: Array<GitHubGraphQlRepository | null>,
  ): GitHubGraphQlRepository[] {
    return repositories.filter(
      (repository): repository is GitHubGraphQlRepository =>
        repository !== null && !repository.isPrivate,
    );
  }

  private getToken(): string {
    const token = this.config.get<string>('GITHUB_TOKEN');

    if (!token) {
      throw new ServiceUnavailableException(
        'La integración con GitHub requiere configurar GITHUB_TOKEN.',
      );
    }

    return token;
  }

  private throwRateLimit(): never {
    throw new HttpException(
      'GitHub alcanzó su límite de peticiones. Intenta nuevamente más tarde.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

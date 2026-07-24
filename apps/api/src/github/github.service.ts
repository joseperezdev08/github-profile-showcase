import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  GitHubContributionDay,
  GitHubLanguageMetric,
  GitHubPullRequestSummary,
  GitHubUserResponse,
} from './dto/github-user-response.dto';
import type { GitHubApiUser } from './types/github-api-user';
import type {
  GitHubGraphQlContributions,
  GitHubGraphQlProfileData,
  GitHubGraphQlPullRequest,
  GitHubGraphQlRepositoriesData,
  GitHubGraphQlRepository,
  GitHubGraphQlResponse,
  GitHubGraphQlUser,
} from './types/github-graphql';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = `${GITHUB_API_URL}/graphql`;
const GITHUB_API_VERSION = '2022-11-28';
const REQUEST_TIMEOUT_MS = 5_000;
const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const REPOSITORIES_PER_PAGE = 100;

const PROFILE_QUERY = `
  query GitHubProfile($login: String!, $searchQuery: String!) {
    user(login: $login) {
      repositories(
        first: ${REPOSITORIES_PER_PAGE}
        ownerAffiliations: OWNER
        privacy: PUBLIC
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          isPrivate
          isFork
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
        }
      }
      contributionsCollection {
        startedAt
        endedAt
        restrictedContributionsCount
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
    search(query: $searchQuery, type: ISSUE, first: 5) {
      issueCount
      nodes {
        ... on PullRequest {
          title
          url
          state
          isDraft
          createdAt
          mergedAt
          repository {
            nameWithOwner
            isPrivate
          }
        }
      }
    }
  }
`;

const REPOSITORIES_QUERY = `
  query PublicRepositories($login: String!, $cursor: String!) {
    user(login: $login) {
      repositories(
        first: ${REPOSITORIES_PER_PAGE}
        after: $cursor
        ownerAffiliations: OWNER
        privacy: PUBLIC
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          isPrivate
          isFork
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
        }
      }
    }
  }
`;

@Injectable()
export class GitHubService {
  constructor(private readonly config: ConfigService) {}

  async getUser(username: string): Promise<GitHubUserResponse> {
    this.validateUsername(username);
    const token = this.getToken();
    const searchQuery = `is:pr author:${username} is:public sort:updated-desc`;
    const [publicUser, profile] = await Promise.all([
      this.getPublicUser(username, token),
      this.executeGraphQl<GitHubGraphQlProfileData>(
        PROFILE_QUERY,
        { login: username, searchQuery },
        token,
      ),
    ]);

    if (!profile.user) {
      throw new NotFoundException(`El usuario "${username}" no existe.`);
    }

    const repositories = await this.getAllPublicRepositories(
      username,
      profile.user.repositories.nodes,
      profile.user.repositories.pageInfo,
      token,
    );

    return this.mapUser(publicUser, profile.user, repositories, profile.search);
  }

  private validateUsername(username: string): void {
    if (!USERNAME_PATTERN.test(username) || username.includes('--')) {
      throw new BadRequestException('El username de GitHub no es válido.');
    }
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

  private async executeGraphQl<T>(
    query: string,
    variables: Record<string, string>,
    token: string,
  ): Promise<T> {
    const headers: HeadersInit = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'github-profile-showcase',
    };

    let response: Response;
    try {
      response = await fetch(GITHUB_GRAPHQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new BadGatewayException(
        'No fue posible establecer conexión con GitHub.',
      );
    }

    if (response.status === 403 || response.status === 429) {
      this.throwRateLimit();
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'GitHub no pudo responder correctamente a la solicitud.',
      );
    }

    let payload: GitHubGraphQlResponse<T>;
    try {
      payload = (await response.json()) as GitHubGraphQlResponse<T>;
    } catch {
      throw new BadGatewayException(
        'GitHub devolvió una respuesta que no se pudo interpretar.',
      );
    }

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

  private async getPublicUser(
    username: string,
    token: string,
  ): Promise<GitHubApiUser> {
    let response: Response;
    try {
      response = await fetch(
        `${GITHUB_API_URL}/users/${encodeURIComponent(username)}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'github-profile-showcase',
            'X-GitHub-Api-Version': GITHUB_API_VERSION,
          },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
    } catch {
      throw new BadGatewayException(
        'No fue posible establecer conexión con GitHub.',
      );
    }

    if (response.status === 404) {
      throw new NotFoundException(`El usuario "${username}" no existe.`);
    }

    if (response.status === 403 || response.status === 429) {
      this.throwRateLimit();
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'GitHub no pudo responder correctamente a la solicitud.',
      );
    }

    try {
      return (await response.json()) as GitHubApiUser;
    } catch {
      throw new BadGatewayException(
        'GitHub devolvió una respuesta que no se pudo interpretar.',
      );
    }
  }

  private async getAllPublicRepositories(
    username: string,
    firstPage: Array<GitHubGraphQlRepository | null>,
    initialPageInfo: { hasNextPage: boolean; endCursor: string | null },
    token: string,
  ): Promise<GitHubGraphQlRepository[]> {
    const repositories = this.filterPublicRepositories(firstPage);
    let pageInfo = initialPageInfo;

    while (pageInfo.hasNextPage && pageInfo.endCursor) {
      const data = await this.executeGraphQl<GitHubGraphQlRepositoriesData>(
        REPOSITORIES_QUERY,
        { login: username, cursor: pageInfo.endCursor },
        token,
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

  private filterPublicRepositories(
    repositories: Array<GitHubGraphQlRepository | null>,
  ): GitHubGraphQlRepository[] {
    return repositories.filter(
      (repository): repository is GitHubGraphQlRepository =>
        repository !== null && !repository.isPrivate,
    );
  }

  private mapUser(
    publicUser: GitHubApiUser,
    user: GitHubGraphQlUser,
    repositories: GitHubGraphQlRepository[],
    pullRequestSearch: GitHubGraphQlProfileData['search'],
  ): GitHubUserResponse {
    const originalRepositories = repositories.filter(
      (repository) => !repository.isFork,
    );

    return {
      username: publicUser.login,
      name: publicUser.name,
      bio: publicUser.bio,
      avatarUrl: publicUser.avatar_url,
      profileUrl: publicUser.html_url,
      email: publicUser.email,
      location: publicUser.location,
      company: publicUser.company,
      website: publicUser.blog?.trim() || null,
      twitterUsername: publicUser.twitter_username,
      publicRepositories: publicUser.public_repos,
      publicGists: publicUser.public_gists,
      followers: publicUser.followers,
      following: publicUser.following,
      createdAt: publicUser.created_at,
      updatedAt: publicUser.updated_at,
      repositoryMetrics: {
        starsReceived: originalRepositories.reduce(
          (total, repository) => total + repository.stargazerCount,
          0,
        ),
        forksReceived: originalRepositories.reduce(
          (total, repository) => total + repository.forkCount,
          0,
        ),
        topLanguages: this.getTopLanguages(originalRepositories),
      },
      contributions: this.mapContributions(user.contributionsCollection),
      publicPullRequests: {
        total: pullRequestSearch.issueCount,
        recent: pullRequestSearch.nodes
          .filter(
            (pullRequest): pullRequest is GitHubGraphQlPullRequest =>
              pullRequest !== null && !pullRequest.repository.isPrivate,
          )
          .slice(0, 5)
          .map((pullRequest) => this.mapPullRequest(pullRequest)),
      },
    };
  }

  private getTopLanguages(
    repositories: GitHubGraphQlRepository[],
  ): GitHubLanguageMetric[] {
    const languages = new Map<
      string,
      { color: string | null; repositoryCount: number }
    >();

    for (const repository of repositories) {
      if (!repository.primaryLanguage) {
        continue;
      }

      const current = languages.get(repository.primaryLanguage.name);
      languages.set(repository.primaryLanguage.name, {
        color: current?.color ?? repository.primaryLanguage.color,
        repositoryCount: (current?.repositoryCount ?? 0) + 1,
      });
    }

    return [...languages.entries()]
      .map(([name, metric]) => ({ name, ...metric }))
      .sort(
        (left, right) =>
          right.repositoryCount - left.repositoryCount ||
          left.name.localeCompare(right.name),
      )
      .slice(0, 5);
  }

  private mapContributions(
    contributions: GitHubGraphQlContributions,
  ): GitHubUserResponse['contributions'] {
    const calendar = contributions.contributionCalendar.weeks.flatMap((week) =>
      week.contributionDays.map<GitHubContributionDay>((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: this.mapContributionLevel(day.contributionLevel),
      })),
    );

    return {
      from: contributions.startedAt,
      to: contributions.endedAt,
      total: contributions.contributionCalendar.totalContributions,
      restricted: contributions.restrictedContributionsCount,
      commits: contributions.totalCommitContributions,
      issues: contributions.totalIssueContributions,
      pullRequests: contributions.totalPullRequestContributions,
      reviews: contributions.totalPullRequestReviewContributions,
      repositoriesContributedTo:
        contributions.totalRepositoriesWithContributedCommits,
      calendar,
    };
  }

  private mapContributionLevel(
    level:
      | 'NONE'
      | 'FIRST_QUARTILE'
      | 'SECOND_QUARTILE'
      | 'THIRD_QUARTILE'
      | 'FOURTH_QUARTILE',
  ): 0 | 1 | 2 | 3 | 4 {
    const levels = {
      NONE: 0,
      FIRST_QUARTILE: 1,
      SECOND_QUARTILE: 2,
      THIRD_QUARTILE: 3,
      FOURTH_QUARTILE: 4,
    } as const;

    return levels[level];
  }

  private mapPullRequest(
    pullRequest: GitHubGraphQlPullRequest,
  ): GitHubPullRequestSummary {
    return {
      title: pullRequest.title,
      url: pullRequest.url,
      repository: pullRequest.repository.nameWithOwner,
      state: pullRequest.state,
      isDraft: pullRequest.isDraft,
      createdAt: pullRequest.createdAt,
      mergedAt: pullRequest.mergedAt,
    };
  }

  private throwRateLimit(): never {
    throw new HttpException(
      'GitHub alcanzó su límite de peticiones. Intenta nuevamente más tarde.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

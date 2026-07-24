import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { GitHubService } from './github.service';
import type { GitHubApiUser } from './types/github-api-user';
import type {
  GitHubGraphQlProfileData,
  GitHubGraphQlRepository,
} from './types/github-graphql';

const publicRepository: GitHubGraphQlRepository = {
  isPrivate: false,
  isFork: false,
  stargazerCount: 7,
  forkCount: 2,
  primaryLanguage: {
    name: 'TypeScript',
    color: '#3178c6',
  },
};

const publicUser: GitHubApiUser = {
  login: 'joseperezdev08',
  name: 'Jose Alejandro Perez Chavez',
  bio: null,
  avatar_url: 'https://avatars.githubusercontent.com/u/96992351?v=4',
  html_url: 'https://github.com/joseperezdev08',
  email: null,
  location: 'Mexico',
  company: null,
  blog: null,
  twitter_username: 'jackinjaxx01',
  public_repos: 24,
  public_gists: 2,
  followers: 4,
  following: 4,
  created_at: '2022-01-02T17:20:26Z',
  updated_at: '2026-07-24T17:43:47Z',
};

const profileData: GitHubGraphQlProfileData = {
  user: {
    repositories: {
      totalCount: 24,
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
      nodes: [
        publicRepository,
        {
          ...publicRepository,
          stargazerCount: 3,
          forkCount: 1,
        },
        {
          isPrivate: false,
          isFork: false,
          stargazerCount: 2,
          forkCount: 0,
          primaryLanguage: {
            name: 'Go',
            color: '#00ADD8',
          },
        },
        {
          ...publicRepository,
          isFork: true,
          stargazerCount: 100,
          forkCount: 100,
        },
        {
          ...publicRepository,
          isPrivate: true,
          stargazerCount: 500,
          forkCount: 500,
        },
      ],
    },
    contributionsCollection: {
      startedAt: '2025-07-24T00:00:00Z',
      endedAt: '2026-07-24T23:59:59Z',
      restrictedContributionsCount: 40,
      totalCommitContributions: 18,
      totalIssueContributions: 2,
      totalPullRequestContributions: 3,
      totalPullRequestReviewContributions: 5,
      totalRepositoriesWithContributedCommits: 6,
      contributionCalendar: {
        totalContributions: 68,
        weeks: [
          {
            contributionDays: [
              {
                date: '2026-07-22',
                contributionCount: 0,
                contributionLevel: 'NONE',
              },
              {
                date: '2026-07-23',
                contributionCount: 2,
                contributionLevel: 'SECOND_QUARTILE',
              },
              {
                date: '2026-07-24',
                contributionCount: 8,
                contributionLevel: 'FOURTH_QUARTILE',
              },
            ],
          },
        ],
      },
    },
  },
  search: {
    issueCount: 2,
    nodes: [
      {
        title: 'Mejora pública',
        url: 'https://github.com/example/project/pull/12',
        state: 'MERGED',
        isDraft: false,
        createdAt: '2026-06-01T10:00:00Z',
        mergedAt: '2026-06-02T10:00:00Z',
        repository: {
          nameWithOwner: 'example/project',
          isPrivate: false,
        },
      },
      {
        title: 'No debe salir',
        url: 'https://github.com/private/project/pull/1',
        state: 'OPEN',
        isDraft: false,
        createdAt: '2026-07-01T10:00:00Z',
        mergedAt: null,
        repository: {
          nameWithOwner: 'private/project',
          isPrivate: true,
        },
      },
    ],
  },
};

function graphQlResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status });
}

function publicUserResponse(status = 200): Response {
  return new Response(JSON.stringify(publicUser), { status });
}

describe('GitHubService', () => {
  let service: GitHubService;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let configGetMock: jest.Mock;

  beforeEach(async () => {
    configGetMock = jest.fn((key: string) =>
      key === 'GITHUB_TOKEN' ? 'test-token' : undefined,
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        GitHubService,
        {
          provide: ConfigService,
          useValue: {
            get: configGetMock,
          },
        },
      ],
    }).compile();

    service = moduleRef.get(GitHubService);
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mapea perfil, actividad, lenguajes y PR públicos', async () => {
    fetchMock
      .mockResolvedValueOnce(publicUserResponse())
      .mockResolvedValueOnce(graphQlResponse({ data: profileData }));

    const result = await service.getUser('joseperezdev08');

    expect(result).toEqual({
      username: 'joseperezdev08',
      name: 'Jose Alejandro Perez Chavez',
      bio: null,
      avatarUrl: 'https://avatars.githubusercontent.com/u/96992351?v=4',
      profileUrl: 'https://github.com/joseperezdev08',
      email: null,
      location: 'Mexico',
      company: null,
      website: null,
      twitterUsername: 'jackinjaxx01',
      publicRepositories: 24,
      publicGists: 2,
      followers: 4,
      following: 4,
      createdAt: '2022-01-02T17:20:26Z',
      updatedAt: '2026-07-24T17:43:47Z',
      repositoryMetrics: {
        starsReceived: 12,
        forksReceived: 3,
        topLanguages: [
          {
            name: 'TypeScript',
            color: '#3178c6',
            repositoryCount: 2,
          },
          {
            name: 'Go',
            color: '#00ADD8',
            repositoryCount: 1,
          },
        ],
      },
      contributions: {
        from: '2025-07-24T00:00:00Z',
        to: '2026-07-24T23:59:59Z',
        total: 68,
        restricted: 40,
        commits: 18,
        issues: 2,
        pullRequests: 3,
        reviews: 5,
        repositoriesContributedTo: 6,
        calendar: [
          { date: '2026-07-22', count: 0, level: 0 },
          { date: '2026-07-23', count: 2, level: 2 },
          { date: '2026-07-24', count: 8, level: 4 },
        ],
      },
      publicPullRequests: {
        total: 2,
        recent: [
          {
            title: 'Mejora pública',
            url: 'https://github.com/example/project/pull/12',
            repository: 'example/project',
            state: 'MERGED',
            isDraft: false,
            createdAt: '2026-06-01T10:00:00Z',
            mergedAt: '2026-06-02T10:00:00Z',
          },
        ],
      },
    });

    const request = fetchMock.mock.calls[1];
    const options = request[1];
    const requestBody = options?.body;
    if (typeof requestBody !== 'string') {
      throw new Error('La consulta GraphQL no contiene un body válido.');
    }
    const body = JSON.parse(requestBody) as {
      query: string;
      variables: { searchQuery: string };
    };

    expect(options?.headers).toMatchObject({
      Authorization: 'Bearer test-token',
    });
    expect(body.query).toContain('privacy: PUBLIC');
    expect(body.variables.searchQuery).toContain('is:public');
  });

  it('pagina todos los repositorios públicos antes de calcular métricas', async () => {
    const firstPage = structuredClone(profileData);
    if (!firstPage.user) {
      throw new Error('Fixture inválido');
    }
    firstPage.user.repositories.pageInfo = {
      hasNextPage: true,
      endCursor: 'cursor-1',
    };
    firstPage.user.repositories.nodes = [publicRepository];

    fetchMock
      .mockResolvedValueOnce(publicUserResponse())
      .mockResolvedValueOnce(graphQlResponse({ data: firstPage }))
      .mockResolvedValueOnce(
        graphQlResponse({
          data: {
            user: {
              repositories: {
                totalCount: 24,
                pageInfo: {
                  hasNextPage: false,
                  endCursor: null,
                },
                nodes: [
                  {
                    isPrivate: false,
                    isFork: false,
                    stargazerCount: 5,
                    forkCount: 4,
                    primaryLanguage: {
                      name: 'Rust',
                      color: '#dea584',
                    },
                  },
                ],
              },
            },
          },
        }),
      );

    const result = await service.getUser('joseperezdev08');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.repositoryMetrics).toMatchObject({
      starsReceived: 12,
      forksReceived: 6,
    });
    expect(result.repositoryMetrics.topLanguages).toEqual([
      {
        name: 'Rust',
        color: '#dea584',
        repositoryCount: 1,
      },
      {
        name: 'TypeScript',
        color: '#3178c6',
        repositoryCount: 1,
      },
    ]);
  });

  it('rechaza usernames inválidos sin consultar GitHub', async () => {
    await expect(service.getUser('invalid--username')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('responde 503 cuando falta GITHUB_TOKEN', async () => {
    configGetMock.mockReturnValue(undefined);

    await expect(service.getUser('octocat')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('traduce un usuario inexistente a 404', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        graphQlResponse({
          data: {
            user: null,
            search: {
              issueCount: 0,
              nodes: [],
            },
          },
        }),
      );

    await expect(service.getUser('does-not-exist')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it.each([403, 429])(
    'traduce el límite HTTP de GitHub (%s) a 429',
    async (status) => {
      fetchMock.mockResolvedValue(graphQlResponse({}, status));

      await expect(service.getUser('octocat')).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    },
  );

  it('traduce un error GraphQL de rate limit a 429', async () => {
    fetchMock.mockResolvedValueOnce(publicUserResponse()).mockResolvedValueOnce(
      graphQlResponse({
        errors: [
          {
            type: 'RATE_LIMITED',
            message: 'API rate limit exceeded',
          },
        ],
      }),
    );

    await expect(service.getUser('octocat')).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it('traduce errores GraphQL inesperados a 502', async () => {
    fetchMock.mockResolvedValueOnce(publicUserResponse()).mockResolvedValueOnce(
      graphQlResponse({
        errors: [
          {
            type: 'INTERNAL',
            message: 'Unexpected error',
          },
        ],
      }),
    );

    await expect(service.getUser('octocat')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('traduce errores HTTP inesperados a 502', async () => {
    fetchMock.mockResolvedValue(graphQlResponse({}, 500));

    await expect(service.getUser('octocat')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('traduce errores de red a 502', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));

    await expect(service.getUser('octocat')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});

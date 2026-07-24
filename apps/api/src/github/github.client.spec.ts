import {
  BadGatewayException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { GitHubClient } from './github.client';
import type { GitHubApiUser } from './types/github-api-user';
import type {
  GitHubGraphQlProfileData,
  GitHubGraphQlRepositoryConnection,
} from './types/github-graphql';

const publicUser: GitHubApiUser = {
  login: 'octocat',
  name: 'The Octocat',
  bio: null,
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  html_url: 'https://github.com/octocat',
  email: null,
  location: null,
  company: null,
  blog: null,
  twitter_username: null,
  public_repos: 8,
  public_gists: 8,
  followers: 100,
  following: 0,
  created_at: '2011-01-25T18:44:36Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const emptyProfile: GitHubGraphQlProfileData = {
  user: null,
  search: {
    issueCount: 0,
    nodes: [],
  },
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status });
}

describe('GitHubClient', () => {
  let client: GitHubClient;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let configGetMock: jest.Mock;

  beforeEach(async () => {
    configGetMock = jest.fn((key: string) =>
      key === 'GITHUB_TOKEN' ? 'test-token' : undefined,
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        GitHubClient,
        {
          provide: ConfigService,
          useValue: {
            get: configGetMock,
          },
        },
      ],
    }).compile();

    client = moduleRef.get(GitHubClient);
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('autentica REST y GraphQL y limita la consulta a datos públicos', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(publicUser))
      .mockResolvedValueOnce(jsonResponse({ data: emptyProfile }));

    await Promise.all([
      client.getPublicUser('octocat'),
      client.getProfile('octocat'),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer test-token',
    });

    const graphQlBody = fetchMock.mock.calls[1][1]?.body;
    if (typeof graphQlBody !== 'string') {
      throw new Error('La consulta GraphQL no contiene un body válido.');
    }
    const body = JSON.parse(graphQlBody) as {
      query: string;
      variables: { searchQuery: string };
    };

    expect(body.query).toContain('privacy: PUBLIC');
    expect(body.variables.searchQuery).toContain('is:public');
  });

  it('pagina repositorios y descarta nodos privados o nulos', async () => {
    const firstPage: GitHubGraphQlRepositoryConnection = {
      totalCount: 3,
      pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
      nodes: [
        {
          isPrivate: false,
          isFork: false,
          stargazerCount: 1,
          forkCount: 0,
          primaryLanguage: null,
        },
        null,
      ],
    };
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          user: {
            repositories: {
              totalCount: 3,
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                {
                  isPrivate: true,
                  isFork: false,
                  stargazerCount: 100,
                  forkCount: 100,
                  primaryLanguage: null,
                },
                {
                  isPrivate: false,
                  isFork: false,
                  stargazerCount: 2,
                  forkCount: 1,
                  primaryLanguage: null,
                },
              ],
            },
          },
        },
      }),
    );

    const result = await client.getAllPublicRepositories('octocat', firstPage);

    expect(result).toHaveLength(2);
    expect(result.map(({ stargazerCount }) => stargazerCount)).toEqual([1, 2]);
  });

  it('responde 503 cuando falta GITHUB_TOKEN', async () => {
    configGetMock.mockReturnValue(undefined);

    await expect(client.getProfile('octocat')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('traduce un usuario REST inexistente a 404', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));

    await expect(client.getPublicUser('does-not-exist')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it.each([403, 429])(
    'traduce el límite HTTP de GitHub (%s) a 429',
    async (status) => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, status));

      await expect(client.getProfile('octocat')).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    },
  );

  it('detecta un rate limit dentro de una respuesta GraphQL 200', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        errors: [
          {
            type: 'RATE_LIMITED',
            message: 'API rate limit exceeded',
          },
        ],
      }),
    );

    await expect(client.getProfile('octocat')).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it('traduce errores GraphQL inesperados a 502', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        errors: [{ type: 'INTERNAL', message: 'Unexpected error' }],
      }),
    );

    await expect(client.getProfile('octocat')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('traduce errores HTTP inesperados a 502', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));

    await expect(client.getProfile('octocat')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('traduce respuestas JSON inválidas a 502', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not-json', { status: 200 }));

    await expect(client.getProfile('octocat')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('traduce errores de red a 502', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network error'));

    await expect(client.getProfile('octocat')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});

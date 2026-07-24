import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { GitHubService } from './github.service';
import type { GitHubApiUser } from './types/github-api-user';

const githubUser: GitHubApiUser = {
  login: 'joseperezdev08',
  name: 'Jose Alejandro Perez Chavez',
  bio: null,
  avatar_url: 'https://avatars.githubusercontent.com/u/96992351?v=4',
  html_url: 'https://github.com/joseperezdev08',
  email: null,
  location: 'Mexico',
  company: null,
  blog: '',
  twitter_username: 'jackinjaxx01',
  public_repos: 22,
  followers: 4,
  following: 4,
  created_at: '2022-01-02T17:20:26Z',
  updated_at: '2026-07-14T01:09:19Z',
};

describe('GitHubService', () => {
  let service: GitHubService;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GitHubService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
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

  it('mapea la respuesta pública de GitHub al contrato de la aplicación', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(githubUser), { status: 200 }),
    );

    await expect(service.getUser('joseperezdev08')).resolves.toEqual({
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
      publicRepositories: 22,
      followers: 4,
      following: 4,
      createdAt: '2022-01-02T17:20:26Z',
      updatedAt: '2026-07-14T01:09:19Z',
    });
  });

  it('rechaza usernames con un formato inválido sin consultar GitHub', async () => {
    await expect(service.getUser('invalid--username')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('traduce un usuario inexistente a 404', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(service.getUser('does-not-exist')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it.each([403, 429])(
    'traduce el límite de GitHub (%s) a 429',
    async (status) => {
      fetchMock.mockResolvedValue(new Response(null, { status }));

      await expect(service.getUser('octocat')).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    },
  );

  it('traduce errores inesperados del proveedor a 502', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

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

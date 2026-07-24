import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { GitHubUserResponse } from '../src/github/dto/github-user-response.dto';
import { GitHubService } from '../src/github/github.service';

describe('User endpoint (e2e)', () => {
  let app: INestApplication;

  const profile: GitHubUserResponse = {
    username: 'joseperezdev08',
    name: 'Jose Alejandro Perez Chavez',
    bio: 'Full-stack Developer',
    avatarUrl: 'https://avatars.githubusercontent.com/u/96992351?v=4',
    profileUrl: 'https://github.com/joseperezdev08',
    email: 'joseperez23.dev@gmail.com',
    location: 'Mexico',
    company: null,
    website: null,
    twitterUsername: 'jackinjaxx01',
    publicRepositories: 22,
    publicGists: 1,
    followers: 4,
    following: 4,
    createdAt: '2022-01-02T17:20:26Z',
    updatedAt: '2026-07-14T01:09:19Z',
    repositoryMetrics: {
      starsReceived: 9,
      forksReceived: 0,
      topLanguages: [
        {
          name: 'TypeScript',
          color: '#3178c6',
          repositoryCount: 8,
        },
      ],
    },
    contributions: {
      from: '2025-07-24T00:00:00Z',
      to: '2026-07-24T23:59:59Z',
      total: 874,
      restricted: 864,
      commits: 7,
      issues: 0,
      pullRequests: 0,
      reviews: 0,
      repositoriesContributedTo: 2,
      calendar: [
        {
          date: '2026-07-24',
          count: 4,
          level: 2,
        },
      ],
    },
    publicPullRequests: {
      total: 1,
      recent: [
        {
          title: 'Modelos prueba',
          url: 'https://github.com/example/project/pull/1',
          repository: 'example/project',
          state: 'MERGED',
          isDraft: false,
          createdAt: '2023-04-17T17:04:27Z',
          mergedAt: '2023-04-17T17:04:38Z',
        },
      ],
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GitHubService)
      .useValue({
        getUser: jest.fn().mockResolvedValue(profile),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /user/:username devuelve el perfil usando el servicio inyectado', () => {
    const server = app.getHttpServer() as Server;

    return request(server)
      .get('/user/joseperezdev08')
      .expect(200)
      .expect(profile);
  });
});

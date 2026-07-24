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
    followers: 4,
    following: 4,
    createdAt: '2022-01-02T17:20:26Z',
    updatedAt: '2026-07-14T01:09:19Z',
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

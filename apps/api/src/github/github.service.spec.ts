import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GitHubClient } from './github.client';
import { GitHubService } from './github.service';
import type { GitHubApiUser } from './types/github-api-user';
import type {
  GitHubGraphQlProfileData,
  GitHubGraphQlRepository,
} from './types/github-graphql';

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
  public_gists: 1,
  followers: 4,
  following: 4,
  created_at: '2022-01-02T17:20:26Z',
  updated_at: '2026-07-24T17:43:47Z',
};

const repository: GitHubGraphQlRepository = {
  isPrivate: false,
  isFork: false,
  stargazerCount: 9,
  forkCount: 1,
  primaryLanguage: {
    name: 'TypeScript',
    color: '#3178c6',
  },
};

const profile: GitHubGraphQlProfileData = {
  user: {
    repositories: {
      totalCount: 1,
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [repository],
    },
    contributionsCollection: {
      startedAt: '2025-07-24T00:00:00Z',
      endedAt: '2026-07-24T23:59:59Z',
      restrictedContributionsCount: 0,
      totalCommitContributions: 1,
      totalIssueContributions: 0,
      totalPullRequestContributions: 0,
      totalPullRequestReviewContributions: 0,
      totalRepositoriesWithContributedCommits: 1,
      contributionCalendar: {
        totalContributions: 1,
        weeks: [],
      },
    },
  },
  search: {
    issueCount: 0,
    nodes: [],
  },
};

describe('GitHubService', () => {
  let service: GitHubService;
  let client: {
    getPublicUser: jest.Mock;
    getProfile: jest.Mock;
    getAllPublicRepositories: jest.Mock;
  };

  beforeEach(async () => {
    client = {
      getPublicUser: jest.fn().mockResolvedValue(publicUser),
      getProfile: jest.fn().mockResolvedValue(profile),
      getAllPublicRepositories: jest.fn().mockResolvedValue([repository]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GitHubService,
        {
          provide: GitHubClient,
          useValue: client,
        },
      ],
    }).compile();

    service = moduleRef.get(GitHubService);
  });

  it('orquesta las consultas y devuelve el contrato consolidado', async () => {
    const result = await service.getUser('joseperezdev08');

    expect(client.getPublicUser).toHaveBeenCalledWith('joseperezdev08');
    expect(client.getProfile).toHaveBeenCalledWith('joseperezdev08');
    expect(client.getAllPublicRepositories).toHaveBeenCalledWith(
      'joseperezdev08',
      profile.user?.repositories,
    );
    expect(result).toMatchObject({
      username: 'joseperezdev08',
      repositoryMetrics: {
        starsReceived: 9,
        forksReceived: 1,
      },
    });
  });

  it('rechaza usernames inválidos antes de consultar GitHub', async () => {
    await expect(service.getUser('invalid--username')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(client.getPublicUser).not.toHaveBeenCalled();
    expect(client.getProfile).not.toHaveBeenCalled();
  });

  it('responde 404 cuando GraphQL no encuentra al usuario', async () => {
    client.getProfile.mockResolvedValue({
      user: null,
      search: { issueCount: 0, nodes: [] },
    });

    await expect(service.getUser('does-not-exist')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(client.getAllPublicRepositories).not.toHaveBeenCalled();
  });
});

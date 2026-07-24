import { mapGitHubUser } from './github-user.mapper';
import type { GitHubApiUser } from './types/github-api-user';
import type {
  GitHubGraphQlProfileData,
  GitHubGraphQlRepository,
  GitHubGraphQlUser,
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
  public_gists: 2,
  followers: 4,
  following: 4,
  created_at: '2022-01-02T17:20:26Z',
  updated_at: '2026-07-24T17:43:47Z',
};

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

const user: GitHubGraphQlUser = {
  repositories: {
    totalCount: 24,
    pageInfo: { hasNextPage: false, endCursor: null },
    nodes: [],
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
};

const publicPullRequest = {
  title: 'Mejora pública',
  url: 'https://github.com/example/project/pull/12',
  state: 'MERGED' as const,
  isDraft: false,
  createdAt: '2026-06-01T10:00:00Z',
  mergedAt: '2026-06-02T10:00:00Z',
  repository: {
    nameWithOwner: 'example/project',
    isPrivate: false,
  },
};

describe('mapGitHubUser', () => {
  it('normaliza el perfil, calendario y métricas de repositorios originales', () => {
    const repositories: GitHubGraphQlRepository[] = [
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
    ];

    const result = mapGitHubUser(publicUser, user, repositories, {
      issueCount: 1,
      nodes: [publicPullRequest],
    });

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
        total: 1,
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
  });

  it('descarta PR privados defensivamente y limita los recientes a cinco', () => {
    const publicPullRequests = Array.from({ length: 6 }, (_, index) => ({
      ...publicPullRequest,
      title: `PR ${index + 1}`,
      url: `https://github.com/example/project/pull/${index + 1}`,
    }));
    const search: GitHubGraphQlProfileData['search'] = {
      issueCount: 6,
      nodes: [
        {
          ...publicPullRequest,
          title: 'No debe salir',
          repository: {
            nameWithOwner: 'private/project',
            isPrivate: true,
          },
        },
        ...publicPullRequests,
      ],
    };

    const result = mapGitHubUser(publicUser, user, [], search);

    expect(result.publicPullRequests.total).toBe(6);
    expect(result.publicPullRequests.recent).toHaveLength(5);
    expect(result.publicPullRequests.recent.map(({ title }) => title)).toEqual([
      'PR 1',
      'PR 2',
      'PR 3',
      'PR 4',
      'PR 5',
    ]);
  });
});

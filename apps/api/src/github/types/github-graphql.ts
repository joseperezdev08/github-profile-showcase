export interface GitHubGraphQlError {
  message: string;
  type?: string;
}

export interface GitHubGraphQlResponse<T> {
  data?: T;
  errors?: GitHubGraphQlError[];
}

export interface GitHubGraphQlProfileData {
  user: GitHubGraphQlUser | null;
  search: GitHubGraphQlPullRequestSearch;
}

export interface GitHubGraphQlRepositoriesData {
  user: {
    repositories: GitHubGraphQlRepositoryConnection;
  } | null;
}

export interface GitHubGraphQlUser {
  repositories: GitHubGraphQlRepositoryConnection;
  contributionsCollection: GitHubGraphQlContributions;
}

export interface GitHubGraphQlRepositoryConnection {
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
  nodes: Array<GitHubGraphQlRepository | null>;
}

export interface GitHubGraphQlRepository {
  isPrivate: boolean;
  isFork: boolean;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: {
    name: string;
    color: string | null;
  } | null;
}

export interface GitHubGraphQlContributions {
  startedAt: string;
  endedAt: string;
  restrictedContributionsCount: number;
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoriesWithContributedCommits: number;
  contributionCalendar: {
    totalContributions: number;
    weeks: Array<{
      contributionDays: Array<{
        date: string;
        contributionCount: number;
        contributionLevel:
          | 'NONE'
          | 'FIRST_QUARTILE'
          | 'SECOND_QUARTILE'
          | 'THIRD_QUARTILE'
          | 'FOURTH_QUARTILE';
      }>;
    }>;
  };
}

export interface GitHubGraphQlPullRequestSearch {
  issueCount: number;
  nodes: Array<GitHubGraphQlPullRequest | null>;
}

export interface GitHubGraphQlPullRequest {
  title: string;
  url: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  isDraft: boolean;
  createdAt: string;
  mergedAt: string | null;
  repository: {
    nameWithOwner: string;
    isPrivate: boolean;
  };
}

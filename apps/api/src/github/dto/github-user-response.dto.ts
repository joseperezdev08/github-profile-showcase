export interface GitHubUserResponse {
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  profileUrl: string;
  email: string | null;
  location: string | null;
  company: string | null;
  website: string | null;
  twitterUsername: string | null;
  publicRepositories: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
  repositoryMetrics: GitHubRepositoryMetrics;
  contributions: GitHubContributions;
  publicPullRequests: GitHubPublicPullRequests;
}

export interface GitHubRepositoryMetrics {
  starsReceived: number;
  forksReceived: number;
  topLanguages: GitHubLanguageMetric[];
}

export interface GitHubLanguageMetric {
  name: string;
  color: string | null;
  repositoryCount: number;
}

export interface GitHubContributions {
  from: string;
  to: string;
  total: number;
  restricted: number;
  commits: number;
  issues: number;
  pullRequests: number;
  reviews: number;
  repositoriesContributedTo: number;
  calendar: GitHubContributionDay[];
}

export interface GitHubContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubPublicPullRequests {
  total: number;
  recent: GitHubPullRequestSummary[];
}

export interface GitHubPullRequestSummary {
  title: string;
  url: string;
  repository: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  isDraft: boolean;
  createdAt: string;
  mergedAt: string | null;
}

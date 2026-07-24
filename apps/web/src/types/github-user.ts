export interface GitHubUser {
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
  repositoryMetrics: {
    starsReceived: number;
    forksReceived: number;
    topLanguages: Array<{
      name: string;
      color: string | null;
      repositoryCount: number;
    }>;
  };
  contributions: {
    from: string;
    to: string;
    total: number;
    restricted: number;
    commits: number;
    issues: number;
    pullRequests: number;
    reviews: number;
    repositoriesContributedTo: number;
    calendar: Array<{
      date: string;
      count: number;
      level: 0 | 1 | 2 | 3 | 4;
    }>;
  };
  publicPullRequests: {
    total: number;
    recent: Array<{
      title: string;
      url: string;
      repository: string;
      state: 'OPEN' | 'CLOSED' | 'MERGED';
      isDraft: boolean;
      createdAt: string;
      mergedAt: string | null;
    }>;
  };
}

import type {
  GitHubContributionDay,
  GitHubLanguageMetric,
  GitHubPullRequestSummary,
  GitHubUserResponse,
} from './dto/github-user-response.dto';
import type { GitHubApiUser } from './types/github-api-user';
import type {
  GitHubGraphQlContributions,
  GitHubGraphQlProfileData,
  GitHubGraphQlPullRequest,
  GitHubGraphQlRepository,
  GitHubGraphQlUser,
} from './types/github-graphql';

export function mapGitHubUser(
  publicUser: GitHubApiUser,
  user: GitHubGraphQlUser,
  repositories: GitHubGraphQlRepository[],
  pullRequestSearch: GitHubGraphQlProfileData['search'],
): GitHubUserResponse {
  const originalRepositories = repositories.filter(
    (repository) => !repository.isFork && !repository.isPrivate,
  );

  return {
    username: publicUser.login,
    name: publicUser.name,
    bio: publicUser.bio,
    avatarUrl: publicUser.avatar_url,
    profileUrl: publicUser.html_url,
    email: publicUser.email,
    location: publicUser.location,
    company: publicUser.company,
    website: publicUser.blog?.trim() || null,
    twitterUsername: publicUser.twitter_username,
    publicRepositories: publicUser.public_repos,
    publicGists: publicUser.public_gists,
    followers: publicUser.followers,
    following: publicUser.following,
    createdAt: publicUser.created_at,
    updatedAt: publicUser.updated_at,
    repositoryMetrics: {
      starsReceived: originalRepositories.reduce(
        (total, repository) => total + repository.stargazerCount,
        0,
      ),
      forksReceived: originalRepositories.reduce(
        (total, repository) => total + repository.forkCount,
        0,
      ),
      topLanguages: getTopLanguages(originalRepositories),
    },
    contributions: mapContributions(user.contributionsCollection),
    publicPullRequests: {
      total: pullRequestSearch.issueCount,
      recent: pullRequestSearch.nodes
        .filter(
          (pullRequest): pullRequest is GitHubGraphQlPullRequest =>
            pullRequest !== null && !pullRequest.repository.isPrivate,
        )
        .slice(0, 5)
        .map(mapPullRequest),
    },
  };
}

function getTopLanguages(
  repositories: GitHubGraphQlRepository[],
): GitHubLanguageMetric[] {
  const languages = new Map<
    string,
    { color: string | null; repositoryCount: number }
  >();

  for (const repository of repositories) {
    if (!repository.primaryLanguage) {
      continue;
    }

    const current = languages.get(repository.primaryLanguage.name);
    languages.set(repository.primaryLanguage.name, {
      color: current?.color ?? repository.primaryLanguage.color,
      repositoryCount: (current?.repositoryCount ?? 0) + 1,
    });
  }

  return [...languages.entries()]
    .map(([name, metric]) => ({ name, ...metric }))
    .sort(
      (left, right) =>
        right.repositoryCount - left.repositoryCount ||
        left.name.localeCompare(right.name),
    )
    .slice(0, 5);
}

function mapContributions(
  contributions: GitHubGraphQlContributions,
): GitHubUserResponse['contributions'] {
  const calendar = contributions.contributionCalendar.weeks.flatMap((week) =>
    week.contributionDays.map<GitHubContributionDay>((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: mapContributionLevel(day.contributionLevel),
    })),
  );

  return {
    from: contributions.startedAt,
    to: contributions.endedAt,
    total: contributions.contributionCalendar.totalContributions,
    restricted: contributions.restrictedContributionsCount,
    commits: contributions.totalCommitContributions,
    issues: contributions.totalIssueContributions,
    pullRequests: contributions.totalPullRequestContributions,
    reviews: contributions.totalPullRequestReviewContributions,
    repositoriesContributedTo:
      contributions.totalRepositoriesWithContributedCommits,
    calendar,
  };
}

function mapContributionLevel(
  level:
    | 'NONE'
    | 'FIRST_QUARTILE'
    | 'SECOND_QUARTILE'
    | 'THIRD_QUARTILE'
    | 'FOURTH_QUARTILE',
): 0 | 1 | 2 | 3 | 4 {
  const levels = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  } as const;

  return levels[level];
}

function mapPullRequest(
  pullRequest: GitHubGraphQlPullRequest,
): GitHubPullRequestSummary {
  return {
    title: pullRequest.title,
    url: pullRequest.url,
    repository: pullRequest.repository.nameWithOwner,
    state: pullRequest.state,
    isDraft: pullRequest.isDraft,
    createdAt: pullRequest.createdAt,
    mergedAt: pullRequest.mergedAt,
  };
}

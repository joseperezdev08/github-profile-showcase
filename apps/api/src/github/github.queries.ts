const REPOSITORIES_PER_PAGE = 100;

export const PROFILE_QUERY = `
  query GitHubProfile($login: String!, $searchQuery: String!) {
    user(login: $login) {
      repositories(
        first: ${REPOSITORIES_PER_PAGE}
        ownerAffiliations: OWNER
        privacy: PUBLIC
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          isPrivate
          isFork
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
        }
      }
      contributionsCollection {
        startedAt
        endedAt
        restrictedContributionsCount
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
    search(query: $searchQuery, type: ISSUE, first: 5) {
      issueCount
      nodes {
        ... on PullRequest {
          title
          url
          state
          isDraft
          createdAt
          mergedAt
          repository {
            nameWithOwner
            isPrivate
          }
        }
      }
    }
  }
`;

export const REPOSITORIES_QUERY = `
  query PublicRepositories($login: String!, $cursor: String!) {
    user(login: $login) {
      repositories(
        first: ${REPOSITORIES_PER_PAGE}
        after: $cursor
        ownerAffiliations: OWNER
        privacy: PUBLIC
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          isPrivate
          isFork
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
        }
      }
    }
  }
`;

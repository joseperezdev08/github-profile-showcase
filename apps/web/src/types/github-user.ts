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
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
}

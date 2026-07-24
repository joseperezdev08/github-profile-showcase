import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { GitHubUserResponse } from './dto/github-user-response.dto';
import { GitHubClient } from './github.client';
import { mapGitHubUser } from './github-user.mapper';

const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

@Injectable()
export class GitHubService {
  constructor(private readonly gitHubClient: GitHubClient) {}

  async getUser(username: string): Promise<GitHubUserResponse> {
    this.validateUsername(username);

    const [publicUser, profile] = await Promise.all([
      this.gitHubClient.getPublicUser(username),
      this.gitHubClient.getProfile(username),
    ]);

    if (!profile.user) {
      throw new NotFoundException(`El usuario "${username}" no existe.`);
    }

    const repositories = await this.gitHubClient.getAllPublicRepositories(
      username,
      profile.user.repositories,
    );

    return mapGitHubUser(
      publicUser,
      profile.user,
      repositories,
      profile.search,
    );
  }

  private validateUsername(username: string): void {
    if (!USERNAME_PATTERN.test(username) || username.includes('--')) {
      throw new BadRequestException('El username de GitHub no es válido.');
    }
  }
}

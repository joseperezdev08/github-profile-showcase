import { Controller, Get, Param } from '@nestjs/common';
import type { GitHubUserResponse } from '../github/dto/github-user-response.dto';
import { GitHubService } from '../github/github.service';

@Controller('user')
export class UserController {
  constructor(private readonly gitHubService: GitHubService) {}

  @Get(':username')
  getUser(@Param('username') username: string): Promise<GitHubUserResponse> {
    return this.gitHubService.getUser(username);
  }
}

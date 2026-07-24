import { Module } from '@nestjs/common';
import { GitHubModule } from '../github/github.module';
import { UserController } from './user.controller';

@Module({
  imports: [GitHubModule],
  controllers: [UserController],
})
export class UserModule {}

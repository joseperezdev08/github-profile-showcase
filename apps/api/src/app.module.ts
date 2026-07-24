import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GitHubModule } from './github/github.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    GitHubModule,
    UserModule,
  ],
})
export class AppModule {}

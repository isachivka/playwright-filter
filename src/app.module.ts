import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpServerModule } from './mcp/mcp.module';

@Module({
  imports: [ConfigModule.forRoot(), McpServerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

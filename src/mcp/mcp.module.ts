import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { ConfigModule } from '../config';

@Module({
  imports: [
    ConfigModule,
    McpModule.forRoot({
      name: 'notebook-mcp-server',
      version: '1.0.0',
    }),
  ],
  providers: [],
  exports: [McpModule],
})
export class McpServerModule {}

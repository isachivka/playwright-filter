import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { ConfigModule } from '../config';
import { BrowserTool } from './browser.tool';

@Module({
  imports: [
    ConfigModule,
    McpModule.forRoot({
      name: 'notebook-mcp-server',
      version: '1.0.0',
    }),
  ],
  providers: [BrowserTool],
  exports: [McpModule],
})
export class McpServerModule {}

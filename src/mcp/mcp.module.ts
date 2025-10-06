import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { ConfigModule } from '../config';
import { BrowserTool } from './browser.tool';
import { CSSConfigService } from '../config/css-config.service';
import { JSConfigService } from '../config/js-config.service';

@Module({
  imports: [
    ConfigModule,
    McpModule.forRoot({
      name: 'notebook-mcp-server',
      version: '1.0.0',
    }),
  ],
  providers: [BrowserTool, CSSConfigService, JSConfigService],
  exports: [McpModule],
})
export class McpServerModule {}

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { CSSConfigService } from '../config/css-config.service';

@Injectable()
export class BrowserTool implements OnModuleDestroy {
  private readonly playwrightMcpUrl: string;
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private lastUrl: string | null = null;

  constructor(private readonly cssConfigService: CSSConfigService) {
    this.playwrightMcpUrl = process.env.PLAYWRIGHT_MCP_URL || 'http://192.168.1.10:8931';
  }

  private async getClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    try {
      console.log('Creating MCP client for:', this.playwrightMcpUrl);

      // Create Streamable HTTP transport
      this.transport = new StreamableHTTPClientTransport(
        new URL(this.playwrightMcpUrl)
      );

      // Create client
      this.client = new Client({
        name: 'notebook-mcp-server',
        version: '1.0.0',
      });

      // Connect to the server
      await this.client.connect(this.transport);
      console.log('MCP client connected successfully');

      return this.client;
    } catch (error) {
      console.error('Failed to create MCP client:', error.message);
      throw error;
    }
  }

  private detectSiteFromUrl(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return 'default';
    }
  }

  private async filterWrapper<T>(promise: Promise<T>, body: any): Promise<T> {
    const result = await promise;
    
    // Extract URL from body
    const url = body?.url;
    if (!url) return result;
    
    // Store URL for potential reuse
    this.lastUrl = url;
    
    // Apply CSS cleaning
    const site = this.detectSiteFromUrl(url);
    const evaluateCode = this.cssConfigService.generateJavaScript(site);
    
    if (evaluateCode !== '() => { return null; }') {
      const client = await this.getClient();
      await client.request({
        method: 'tools/call',
        params: {
          name: 'browser_evaluate',
          arguments: { function: evaluateCode }
        }
      }, CallToolResultSchema);
    }
    
    return result;
  }

  @Tool({
    name: 'browser_navigate',
    description: 'Navigate to a URL and apply CSS cleaning',
    parameters: z.object({
      url: z.string().url('The URL to navigate to'),
    }),
  })
  async navigate(body: { url?: string }) {
    const client = await this.getClient();
    const result = await this.filterWrapper(
      client.request({
        method: 'tools/call',
        params: {
          name: 'browser_navigate',
          arguments: body
        }
      }, CallToolResultSchema),
      body
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }],
    };
  }


  async onModuleDestroy() {
    if (this.transport) {
      try {
        await this.transport.close();
        console.log('MCP transport closed');
      } catch (error) {
        console.error('Error closing MCP transport:', error.message);
      }
    }
  }
}

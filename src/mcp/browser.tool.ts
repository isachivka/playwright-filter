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
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Use hostname as configuration key
      return hostname;
    } catch {
      return 'default';
    }
  }

  @Tool({
    name: 'browser_navigate',
    description: 'Navigate to a URL',
    parameters: z.object({
      url: z.string().url('The URL to navigate to'),
    }),
  })
  async navigate({ url }) {
    try {
      const client = await this.getClient();
      const site = this.detectSiteFromUrl(url);

      console.log(`Navigating to: ${url} (detected site: ${site})`);

      // Step 1: Navigate to the URL
      await client.request({
        method: 'tools/call',
        params: {
          name: 'browser_navigate',
          arguments: {
            url: url
          }
        }
      }, CallToolResultSchema);

      console.log('Navigation completed, applying CSS cleaning...');

      // Step 2: Get CSS rules from configuration
      const evaluateCode = this.cssConfigService.generateJavaScript(site);

      if (evaluateCode === '() => { return null; }') {
        console.log('No CSS rules configured for this site, skipping cleaning...');
      } else {
        await client.request({
          method: 'tools/call',
          params: {
            name: 'browser_evaluate',
            arguments: {
              function: evaluateCode
            }
          }
        }, CallToolResultSchema);

        console.log('CSS cleaning applied');
      }

      console.log('Taking snapshot...');

      // Step 3: Get the cleaned page snapshot
      const snapshotResult = await client.request({
        method: 'tools/call',
        params: {
          name: 'browser_snapshot',
          arguments: {}
        }
      }, CallToolResultSchema);

      console.log('Snapshot taken successfully');

      // Return the cleaned snapshot
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(snapshotResult, null, 2)
        }],
      };
    } catch (error) {
      // Handle errors gracefully
      const errorMessage = error.message || 'Unknown error occurred';

      return {
        content: [{
          type: 'text',
          text: `Error in navigate and snapshot: ${errorMessage}`
        }],
      };
    }
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

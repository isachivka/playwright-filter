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

  private async filterWrapper<T>(promise: Promise<T>, url?: string, skipCss = false): Promise<T> {
    try {
      // Wait for the main action
      const result = await promise;
      
      // Apply CSS cleaning if URL is provided and not skipped
      if (url && !skipCss) {
        const site = this.detectSiteFromUrl(url);
        console.log(`Applying CSS cleaning for site: ${site}`);
        
        const evaluateCode = this.cssConfigService.generateJavaScript(site);
        
        if (evaluateCode !== '() => { return null; }') {
          const client = await this.getClient();
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
        } else {
          console.log('No CSS rules configured for this site, skipping cleaning...');
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error in filterWrapper:', error.message);
      throw error;
    }
  }

  @Tool({
    name: 'browser_navigate',
    description: 'Navigate to a URL and apply CSS cleaning',
    parameters: z.object({
      url: z.string().url('The URL to navigate to'),
    }),
  })
  async navigate(body: { url?: string }) {
    try {
      const client = await this.getClient();
      const url = body.url;
      
      if (!url) {
        return {
          content: [{
            type: 'text',
            text: 'Error: URL is required for navigation'
          }],
        };
      }

      console.log(`Navigating to: ${url}`);
      
      // Store the last URL for potential reuse
      this.lastUrl = url;

      // Use filterWrapper to handle the request and CSS cleaning
      const result = await this.filterWrapper(
        client.request({
          method: 'tools/call',
          params: {
            name: 'browser_navigate',
            arguments: { url }
          }
        }, CallToolResultSchema),
        url
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }],
      };
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      return {
        content: [{
          type: 'text',
          text: `Error in navigate: ${errorMessage}`
        }],
      };
    }
  }

  @Tool({
    name: 'browser_apply_css',
    description: 'Apply CSS cleaning to the current page (uses last navigated URL if no URL provided)',
    parameters: z.object({
      url: z.string().url('The URL to apply CSS cleaning to').optional(),
    }),
  })
  async applyCss(body: { url?: string }) {
    try {
      const client = await this.getClient();
      const url = body.url || this.lastUrl;
      
      if (!url) {
        return {
          content: [{
            type: 'text',
            text: 'Error: No URL provided and no previous navigation found. Please navigate to a URL first using browser_navigate.'
          }],
        };
      }

      console.log(`Applying CSS cleaning to: ${url}`);

      // Apply CSS cleaning and take snapshot
      const site = this.detectSiteFromUrl(url);
      const evaluateCode = this.cssConfigService.generateJavaScript(site);
      
      if (evaluateCode === '() => { return null; }') {
        return {
          content: [{
            type: 'text',
            text: 'No CSS rules configured for this site. No cleaning applied.'
          }],
        };
      }

      // Use filterWrapper to handle CSS cleaning and get snapshot
      const result = await this.filterWrapper(
        client.request({
          method: 'tools/call',
          params: {
            name: 'browser_evaluate',
            arguments: {
              function: evaluateCode
            }
          }
        }, CallToolResultSchema),
        url,
        true // Skip CSS cleaning since we're already doing it
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }],
      };
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      return {
        content: [{
          type: 'text',
          text: `Error in apply CSS: ${errorMessage}`
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

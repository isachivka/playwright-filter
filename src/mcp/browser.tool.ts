import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

@Injectable()
export class BrowserTool implements OnModuleDestroy {
  private readonly playwrightMcpUrl: string;
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;

  constructor() {
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

  @Tool({
    name: 'browser_navigate',
    description: 'Navigate to a URL in the browser using Playwright MCP server',
    parameters: z.object({
      url: z.string().url('Must be a valid URL'),
    }),
  })
  async navigate({ url }, context: Context) {
    try {
      const client = await this.getClient();

      // Call the browser_navigate tool on the Playwright MCP server
      const result = await client.request({
        method: 'tools/call',
        params: {
          name: 'browser_navigate',
          arguments: {
            url: url
          }
        }
      }, CallToolResultSchema);

      // Return the response from Playwright MCP server
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify(result, null, 2) 
        }],
      };
    } catch (error) {
      // Handle errors gracefully
      const errorMessage = error.message || 'Unknown error occurred';
      
      return {
        content: [{ 
          type: 'text', 
          text: `Error calling Playwright MCP server: ${errorMessage}` 
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
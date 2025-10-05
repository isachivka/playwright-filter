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

  @Tool({
    name: 'browser_evaluate',
    description: 'Evaluate JavaScript code in the browser using Playwright MCP server',
    parameters: z.object({
      function: z.string().describe('JavaScript function to evaluate'),
    }),
  })
  async evaluate({ function: functionCode }, context: Context) {
    try {
      const client = await this.getClient();

      // Call the browser_evaluate tool on the Playwright MCP server
      const result = await client.request({
        method: 'tools/call',
        params: {
          name: 'browser_evaluate',
          arguments: {
            function: functionCode
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

  @Tool({
    name: 'browser_navigate_and_clean',
    description: 'Navigate to a URL and automatically clean the page using Rutracker CSS rules',
    parameters: z.object({
      url: z.string().url('Must be a valid URL'),
    }),
  })
  async navigateAndClean({ url }, context: Context) {
    try {
      const client = await this.getClient();

      console.log(`Navigating to: ${url}`);

      // Step 1: Navigate to the URL
      const navigateResult = await client.request({
        method: 'tools/call',
        params: {
          name: 'browser_navigate',
          arguments: {
            url: url
          }
        }
      }, CallToolResultSchema);

      console.log('Navigation completed, applying CSS cleaning...');

      // Step 2: Apply Rutracker CSS cleaning rules
      const rutrackerCss = `
#sidebar1,
#main-nav,
#logo,
#idx-sidebar2,
#latest_news,
#forums_top_links,
#board_stats,
#page_footer,
#t-top-user-buttons,
#categories-wrap { display: none !important; }

#topic_main > * { display: none !important; }
#topic_main > *:nth-child(2) { display: block !important; }
`;

      const evaluateCode = `() => {
  const css = \`${rutrackerCss}\`;

  let tag = document.querySelector('style[data-hide-injected]');
  if (!tag) {
    tag = document.createElement('style');
    tag.setAttribute('data-hide-injected', '1');
    document.documentElement.appendChild(tag);
  }
  tag.textContent = css;
  return null;
}`;

      const evaluateResult = await client.request({
        method: 'tools/call',
        params: {
          name: 'browser_evaluate',
          arguments: {
            function: evaluateCode
          }
        }
      }, CallToolResultSchema);

      console.log('CSS cleaning applied successfully');

      // Return only the evaluate result (cleaned page)
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify(evaluateResult, null, 2) 
        }],
      };
    } catch (error) {
      // Handle errors gracefully
      const errorMessage = error.message || 'Unknown error occurred';
      
      return {
        content: [{ 
          type: 'text', 
          text: `Error in navigate and clean: ${errorMessage}` 
        }],
      };
    }
  }

  @Tool({
    name: 'browser_navigate_and_snapshot',
    description: 'Navigate to a URL, clean it with Rutracker CSS rules, and return the cleaned HTML snapshot',
    parameters: z.object({
      url: z.string().url('Must be a valid URL'),
    }),
  })
  async navigateAndSnapshot({ url }, context: Context) {
    try {
      const client = await this.getClient();

      console.log(`Navigating to: ${url}`);

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

      // Step 2: Apply Rutracker CSS cleaning rules
      const rutrackerCss = `
#sidebar1,
#main-nav,
#logo,
#idx-sidebar2,
#latest_news,
#forums_top_links,
#board_stats,
#page_footer,
#t-top-user-buttons,
#categories-wrap { display: none !important; }

#topic_main > * { display: none !important; }
#topic_main > *:nth-child(2) { display: block !important; }
`;

      const evaluateCode = `() => {
  const css = \`${rutrackerCss}\`;

  let tag = document.querySelector('style[data-hide-injected]');
  if (!tag) {
    tag = document.createElement('style');
    tag.setAttribute('data-hide-injected', '1');
    document.documentElement.appendChild(tag);
  }
  tag.textContent = css;
  return null;
}`;

      await client.request({
        method: 'tools/call',
        params: {
          name: 'browser_evaluate',
          arguments: {
            function: evaluateCode
          }
        }
      }, CallToolResultSchema);

      console.log('CSS cleaning applied, taking snapshot...');

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
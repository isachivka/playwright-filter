import { Injectable } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import axios from 'axios';

@Injectable()
export class BrowserTool {
  private readonly playwrightMcpUrl: string;

  constructor() {
    this.playwrightMcpUrl = process.env.PLAYWRIGHT_MCP_URL || 'http://192.168.1.10:8931/mcp';
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
      // Forward the request to the Playwright MCP server
      const response = await axios.post(this.playwrightMcpUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'browser_navigate',
          arguments: {
            url: url
          }
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      });

      // Return the response from Playwright MCP server
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify(response.data, null, 2) 
        }],
      };
    } catch (error) {
      // Handle errors gracefully
      const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error occurred';
      
      return {
        content: [{ 
          type: 'text', 
          text: `Error calling Playwright MCP server: ${errorMessage}` 
        }],
      };
    }
  }
}
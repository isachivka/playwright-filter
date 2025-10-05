import { Injectable } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import axios from 'axios';

@Injectable()
export class BrowserTool {
  private readonly playwrightMcpUrl: string;
  private isInitialized: boolean = false;

  constructor() {
    this.playwrightMcpUrl = process.env.PLAYWRIGHT_MCP_URL || 'http://192.168.1.10:8931';
  }

  private async initializeMcpServer(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing MCP server at:', this.playwrightMcpUrl);
      
      // Try different protocol versions
      const protocolVersions = ['2024-11-05', '2024-10-07', '2024-09-12'];
      let initResponse;
      
      for (const version of protocolVersions) {
        try {
          console.log(`Trying protocol version: ${version}`);
          initResponse = await axios.post(this.playwrightMcpUrl, {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: version,
              capabilities: {
                tools: {}
              },
              clientInfo: {
                name: 'notebook-mcp-server',
                version: '1.0.0'
              }
            }
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/event-stream',
            },
            timeout: 10000,
          });
          console.log(`Success with protocol version: ${version}`);
          break;
        } catch (error) {
          console.log(`Failed with protocol version ${version}:`, error.response?.data || error.message);
          if (version === protocolVersions[protocolVersions.length - 1]) {
            throw error;
          }
        }
      }

      console.log('Initialize response:', initResponse.data);

      // Send initialized notification
      const notifyResponse = await axios.post(this.playwrightMcpUrl, {
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        timeout: 5000,
      });

      console.log('Initialized notification response:', notifyResponse.data);

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MCP server:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
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
      // Try to initialize MCP server if not already done
      try {
        await this.initializeMcpServer();
      } catch (initError) {
        console.log('Initialization failed, trying direct call:', initError.message);
        // Continue without initialization - some servers might not require it
      }

      // Forward the request to the Playwright MCP server using streamable HTTP
      const response = await axios.post(this.playwrightMcpUrl, {
        jsonrpc: '2.0',
        id: 2,
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
          'Accept': 'application/json, text/event-stream',
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
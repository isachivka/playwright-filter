import type { Request } from 'express';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Context, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { CSSConfigService } from '../config/css-config.service';
import { JSConfigService } from '../config/js-config.service';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CLIENT_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
const MCP_SERVER_BASE_HOST = '192.168.1.10';
const MCP_SERVER_PORTS = [8931, 8932, 8933, 8934, 8935]; // Available server ports

interface SessionClient {
  client: Client;
  transport: StreamableHTTPClientTransport;
  timeoutId: NodeJS.Timeout | null;
  serverUrl: string;
}

@Injectable()
export class BrowserTool implements OnModuleDestroy {
  private readonly clients: Map<string, SessionClient> = new Map();
  private lastUrl: string | null = null;
  private nextServerIndex: number = 0; // Round-robin index for server selection

  constructor(
    private readonly cssConfigService: CSSConfigService,
    private readonly jsConfigService: JSConfigService,
  ) {}

  /**
   * Selects the next server port using round-robin
   */
  private selectNextServerPort(): number {
    const port = MCP_SERVER_PORTS[this.nextServerIndex];
    // Move to next server, wrap around if needed
    this.nextServerIndex = (this.nextServerIndex + 1) % MCP_SERVER_PORTS.length;
    return port;
  }

  /**
   * Gets the server URL for a new session (round-robin)
   */
  private getNextServerUrl(): string {
    const port = this.selectNextServerPort();
    return `http://${MCP_SERVER_BASE_HOST}:${port}`;
  }

  private async closeClient(sessionId: string): Promise<void> {
    const sessionClient = this.clients.get(sessionId);
    if (!sessionClient) {
      return;
    }

    const serverUrl = sessionClient.serverUrl;

    try {
      // Clear timeout if it exists
      if (sessionClient.timeoutId) {
        clearTimeout(sessionClient.timeoutId);
      }

      // Close transport
      if (sessionClient.transport) {
        await sessionClient.transport.close();
        console.log(`MCP transport closed for session: ${sessionId} on ${serverUrl}`);
      }
    } catch (error) {
      console.error(
        `Error closing MCP transport for session ${sessionId} on ${serverUrl}:`,
        error.message,
      );
    } finally {
      // Remove from map
      this.clients.delete(sessionId);
      console.log(`Client removed for session: ${sessionId} (was on ${serverUrl})`);
    }
  }

  private scheduleClientClose(sessionId: string): void {
    const sessionClient = this.clients.get(sessionId);
    if (!sessionClient) {
      return;
    }

    // Clear existing timeout if any
    if (sessionClient.timeoutId) {
      clearTimeout(sessionClient.timeoutId);
    }

    // Schedule new timeout
    sessionClient.timeoutId = setTimeout(async () => {
      console.log(`Closing client for session ${sessionId} after ${CLIENT_TIMEOUT_MS}ms timeout`);
      await this.closeClient(sessionId);
    }, CLIENT_TIMEOUT_MS);
  }

  private async getClient(sessionId = 'session_less'): Promise<Client> {
    // Check if a client already exists for this session
    const existingSessionClient = this.clients.get(sessionId);
    if (existingSessionClient) {
      // Reset timeout on access
      this.scheduleClientClose(sessionId);
      return existingSessionClient.client;
    }

    // Get next available server URL (round-robin)
    const serverUrl = this.getNextServerUrl();
    const port = new URL(serverUrl).port;

    try {
      console.log(
        `Creating MCP client for session: ${sessionId}, server: ${serverUrl} (port: ${port})`,
      );

      // Create Streamable HTTP transport
      const transport = new StreamableHTTPClientTransport(new URL(serverUrl));

      // Create client
      const client = new Client({
        name: 'notebook-mcp-server',
        version: '1.0.0',
      });

      // Connect to the server
      await client.connect(transport);
      console.log(`MCP client connected successfully for session: ${sessionId} on ${serverUrl}`);

      // Store client, transport, and server URL
      const sessionClient: SessionClient = {
        client,
        transport,
        timeoutId: null, // Will be set by scheduleClientClose
        serverUrl,
      };
      this.clients.set(sessionId, sessionClient);

      // Schedule automatic close
      this.scheduleClientClose(sessionId);

      return client;
    } catch (error) {
      console.error(
        `Failed to create MCP client for session ${sessionId} on ${serverUrl}:`,
        error.message,
      );
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

  private async filterWrapper<T>(promise: Promise<T>, body: any, sessionId?: string): Promise<T> {
    const result = await promise;

    // Extract URL from body
    const url = body?.url || this.lastUrl;
    if (!url) {
      console.log('No URL provided, skipping CSS/JS application', JSON.stringify(body));
      return result;
    }

    this.lastUrl = url;

    const site = this.detectSiteFromUrl(url);

    const cssCode = this.cssConfigService.generateJavaScript(site);
    const jsCode = this.jsConfigService.generateJavaScript(site);

    // Combine CSS and JS code
    const combinedCode = `() => {
      try {
        // Apply JS rules
        ${jsCode}

        // Apply CSS rules
        ${cssCode}

        return null;
      } catch (error) {
        console.error('Error in combined rules:', error);
        return null;
      }
    }`;

    if (cssCode || jsCode) {
      const client = await this.getClient(sessionId);
      await client.request(
        {
          method: 'tools/call',
          params: {
            name: 'browser_evaluate',
            arguments: { function: combinedCode },
          },
        },
        CallToolResultSchema,
      );

      // Return combined result (which includes the cleaned snapshot)
      await sleep(500); // Wait a bit to ensure the page is stable

      const combinedResult = await client.request(
        {
          method: 'tools/call',
          params: {
            name: 'browser_snapshot',
          },
        },
        CallToolResultSchema,
      );

      return combinedResult as T;
    }

    return result;
  }

  @Tool({
    name: 'browser_close',
    description: 'Close the page',
    parameters: z.object({}),
  })
  async close(body: Record<string, never>, context: Context, req: Request) {
    const client = await this.getClient(req.query.sessionId as string);
    return {
      content: [
        {
          type: 'text',
          text: await this.filterWrapper(
            client.request(
              {
                method: 'tools/call',
                params: {
                  name: 'browser_close',
                  arguments: body,
                },
              },
              CallToolResultSchema,
            ),
            body,
            req.query.sessionId as string,
          ),
        },
      ],
    };
  }

  @Tool({
    name: 'browser_fill_form',
    description: 'Fill multiple form fields',
    parameters: z.object({
      fields: z
        .array(
          z.object({
            name: z.string().describe('Human-readable field name'),
            type: z
              .enum(['textbox', 'checkbox', 'radio', 'combobox', 'slider'])
              .describe('Type of the field'),
            ref: z.string().describe('Exact target field reference from the page snapshot'),
            value: z
              .string()
              .describe(
                'Value to fill in the field. If the field is a checkbox, the value should be `true` or `false`. If the field is a combobox, the value should be the text of the option.',
              ),
          }),
        )
        .describe('Fields to fill in'),
    }),
  })
  async fillForm(body: { fields: any[] }, context: Context, req: Request) {
    const client = await this.getClient(req.query.sessionId as string);
    return {
      content: [
        {
          type: 'text',
          text: await this.filterWrapper(
            client.request(
              {
                method: 'tools/call',
                params: {
                  name: 'browser_fill_form',
                  arguments: body,
                },
              },
              CallToolResultSchema,
            ),
            body,
            req.query.sessionId as string,
          ),
        },
      ],
    };
  }

  @Tool({
    name: 'browser_click',
    description: 'Perform click on a web page',
    parameters: z.object({
      element: z
        .string()
        .describe(
          'Human-readable element description used to obtain permission to interact with the element',
        ),
      ref: z.string().describe('Exact target element reference from the page snapshot'),
      doubleClick: z
        .boolean()
        .optional()
        .describe('Whether to perform a double click instead of a single click'),
      button: z
        .enum(['left', 'right', 'middle'])
        .optional()
        .describe('Button to click, defaults to left'),
      modifiers: z
        .array(z.enum(['Alt', 'Control', 'ControlOrMeta', 'Meta', 'Shift']))
        .optional()
        .describe('Modifier keys to press'),
    }),
  })
  async click(
    body: {
      element: string;
      ref: string;
      doubleClick?: boolean;
      button?: string;
      modifiers?: string[];
    },
    context: Context,
    req: Request,
  ) {
    const client = await this.getClient(req.query.sessionId as string);
    return {
      content: [
        {
          type: 'text',
          text: await this.filterWrapper(
            client.request(
              {
                method: 'tools/call',
                params: {
                  name: 'browser_click',
                  arguments: body,
                },
              },
              CallToolResultSchema,
            ),
            body,
            req.query.sessionId as string,
          ),
        },
      ],
    };
  }

  @Tool({
    name: 'browser_evaluate',
    description: 'Evaluate JavaScript expression on page or element',
    parameters: z.object({
      function: z
        .string()
        .describe('() => { /* code */ } or (element) => { /* code */ } when element is provided'),
      element: z
        .string()
        .optional()
        .describe(
          'Human-readable element description used to obtain permission to interact with the element',
        ),
      ref: z.string().optional().describe('Exact target element reference from the page snapshot'),
    }),
  })
  async evaluate(
    body: { function: string; element?: string; ref?: string },
    context: Context,
    req: Request,
  ) {
    const client = await this.getClient(req.query.sessionId as string);
    return {
      content: [
        {
          type: 'text',
          text: await this.filterWrapper(
            client.request(
              {
                method: 'tools/call',
                params: {
                  name: 'browser_evaluate',
                  arguments: body,
                },
              },
              CallToolResultSchema,
            ),
            body,
            req.query.sessionId as string,
          ),
        },
      ],
    };
  }

  @Tool({
    name: 'browser_navigate',
    description: 'Navigate to a URL and apply CSS cleaning',
    parameters: z.object({
      url: z.string().url('The URL to navigate to'),
    }),
  })
  async navigate(body: { url?: string }, context: Context, req: Request) {
    const client = await this.getClient(req.query.sessionId as string);
    return {
      content: [
        {
          type: 'text',
          text: await this.filterWrapper(
            client.request(
              {
                method: 'tools/call',
                params: {
                  name: 'browser_navigate',
                  arguments: body,
                },
              },
              CallToolResultSchema,
            ),
            body,
            req.query.sessionId as string,
          ),
        },
      ],
    };
  }

  async onModuleDestroy() {
    // Close all clients
    const sessionIds = Array.from(this.clients.keys());
    await Promise.all(
      sessionIds.map(async sessionId => {
        await this.closeClient(sessionId);
      }),
    );
    console.log('All MCP clients closed');
  }
}

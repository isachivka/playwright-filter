import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { CSSConfigService } from '../config/css-config.service';
import { JSConfigService } from '../config/js-config.service';

@Injectable()
export class BrowserTool implements OnModuleDestroy {
  private readonly playwrightMcpUrl: string;
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private lastUrl: string | null = null;

  constructor(
    private readonly cssConfigService: CSSConfigService,
    private readonly jsConfigService: JSConfigService,
  ) {
    this.playwrightMcpUrl = process.env.PLAYWRIGHT_MCP_URL || 'http://192.168.1.10:8931';
  }

  private async getClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    try {
      console.log('Creating MCP client for:', this.playwrightMcpUrl);

      // Create Streamable HTTP transport
      this.transport = new StreamableHTTPClientTransport(new URL(this.playwrightMcpUrl));

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
        // Apply CSS rules
        ${cssCode}
        
        // Apply JS rules
        ${jsCode}
        
        return null;
      } catch (error) {
        console.error('Error in combined rules:', error);
        return null;
      }
    }`;

    if (cssCode || jsCode) {
      const client = await this.getClient();
      const combinedResult = await client.request(
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
      return combinedResult as T;
    }

    return result;
  }

  @Tool({
    name: 'browser_close',
    description: 'Close the page',
    parameters: z.object({}),
  })
  async close(body: Record<string, never>) {
    const client = await this.getClient();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            await this.filterWrapper(
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
            ),
            null,
            2,
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
  async fillForm(body: { fields: any[] }) {
    const client = await this.getClient();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            await this.filterWrapper(
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
            ),
            null,
            2,
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
  async click(body: {
    element: string;
    ref: string;
    doubleClick?: boolean;
    button?: string;
    modifiers?: string[];
  }) {
    const client = await this.getClient();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            await this.filterWrapper(
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
            ),
            null,
            2,
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
  async evaluate(body: { function: string; element?: string; ref?: string }) {
    const client = await this.getClient();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            await this.filterWrapper(
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
            ),
            null,
            2,
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
  async navigate(body: { url?: string }) {
    const client = await this.getClient();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            await this.filterWrapper(
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
            ),
            null,
            2,
          ),
        },
      ],
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

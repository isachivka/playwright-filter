import { Injectable } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable()
export class BrowserTool {
  constructor() {}

  @Tool({
    name: 'browser_navigate',
    description: 'Navigate to a URL in the browser',
    parameters: z.object({
      url: z.string().url('Must be a valid URL'),
    }),
  })
  async navigate({ url }, context: Context) {
    // For now, return a test response as requested
    return {
      content: [{ type: 'text', text: 'test true' }],
    };
  }
}
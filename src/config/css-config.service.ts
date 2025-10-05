import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface CSSRulesConfig {
  [domain: string]: string;
}

@Injectable()
export class CSSConfigService {
  private config: CSSRulesConfig = {};
  private configPath: string;

  constructor() {
    this.configPath = join(process.cwd(), 'src', 'config', 'css-rules.json');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const configData = readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      console.log('CSS configuration loaded successfully');
    } catch (error) {
      console.error('Failed to load CSS configuration:', error.message);
      // Fallback to default config
      this.config = {
        "default": ".advertisement,\n.ads,\n.sidebar,\n.footer,\n.header { display: none !important; }"
      };
    }
  }

  getCSS(domain: string): string {
    return this.config[domain] || this.config['default'] || '';
  }

  generateJavaScript(domain: string): string {
    const css = this.getCSS(domain);
    if (!css) {
      return '() => { return null; }';
    }

    return `() => {
  const css = \`${css}\`;

  let tag = document.querySelector('style[data-hide-injected]');
  if (!tag) {
    tag = document.createElement('style');
    tag.setAttribute('data-hide-injected', '1');
    document.documentElement.appendChild(tag);
  }
  tag.textContent = css;
  return null;
}`;
  }
}
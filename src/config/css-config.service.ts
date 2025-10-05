import { Injectable } from '@nestjs/common';
import { readFileSync, watchFile, unwatchFile } from 'fs';
import { join } from 'path';

export interface CSSRule {
  selector: string;
  action: 'hide' | 'show';
  exceptions?: string[];
}

export interface CSSConfig {
  name: string;
  description: string;
  enabled: boolean;
  rules: string[];
  specialRules: CSSRule[];
  customCSS: string;
}

export interface CSSRulesConfig {
  [key: string]: CSSConfig;
}

@Injectable()
export class CSSConfigService {
  private config: CSSRulesConfig = {};
  private configPath: string;
  private watchers: Map<string, any> = new Map();

  constructor() {
    this.configPath = join(process.cwd(), 'src', 'config', 'css-rules.json');
    this.loadConfig();
    this.watchConfig();
  }

  private loadConfig(): void {
    try {
      const configData = readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      console.log('CSS configuration loaded successfully');
    } catch (error) {
      console.error('Failed to load CSS configuration:', error.message);
      // Fallback to default config
      this.config = this.getDefaultConfig();
    }
  }

  private watchConfig(): void {
    try {
      const watcher = watchFile(this.configPath, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          console.log('CSS configuration file changed, reloading...');
          this.loadConfig();
        }
      });
      this.watchers.set('css-config', watcher);
    } catch (error) {
      console.error('Failed to watch CSS configuration file:', error.message);
    }
  }

  private getDefaultConfig(): CSSRulesConfig {
    return {
      rutracker: {
        name: "Rutracker CSS Cleaning Rules",
        description: "CSS rules to clean Rutracker pages by hiding unnecessary elements",
        enabled: true,
        rules: [
          "#sidebar1",
          "#main-nav", 
          "#logo",
          "#idx-sidebar2",
          "#latest_news",
          "#forums_top_links",
          "#board_stats",
          "#page_footer",
          "#t-top-user-buttons",
          "#categories-wrap"
        ],
        specialRules: [
          {
            selector: "#topic_main > *",
            action: "hide",
            exceptions: ["#topic_main > *:nth-child(2)"]
          }
        ],
        customCSS: ""
      }
    };
  }

  getConfig(site: string = 'rutracker'): CSSConfig | null {
    return this.config[site] || null;
  }

  getAllConfigs(): CSSRulesConfig {
    return this.config;
  }

  generateCSS(site: string = 'rutracker'): string {
    const config = this.getConfig(site);
    if (!config || !config.enabled) {
      return '';
    }

    let css = '';

    // Add basic hide rules
    if (config.rules.length > 0) {
      const selectors = config.rules.join(',\n');
      css += `${selectors} { display: none !important; }\n\n`;
    }

    // Add special rules
    config.specialRules.forEach(rule => {
      if (rule.action === 'hide') {
        css += `${rule.selector} { display: none !important; }\n`;
        if (rule.exceptions && rule.exceptions.length > 0) {
          rule.exceptions.forEach(exception => {
            css += `${exception} { display: block !important; }\n`;
          });
        }
        css += '\n';
      }
    });

    // Add custom CSS
    if (config.customCSS) {
      css += `/* Custom CSS */\n${config.customCSS}\n`;
    }

    return css;
  }

  generateJavaScript(site: string = 'rutracker'): string {
    const css = this.generateCSS(site);
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

  onModuleDestroy(): void {
    // Clean up watchers
    this.watchers.forEach((watcher, key) => {
      unwatchFile(this.configPath);
    });
    this.watchers.clear();
  }
}
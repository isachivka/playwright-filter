import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class CSSConfigService {
  private cssRulesPath: string;

  constructor() {
    this.cssRulesPath = join(process.cwd(), 'css-rules');
    console.log('CSS rules directory:', this.cssRulesPath);
  }

  private getCSSFilePath(domain: string): string {
    return join(this.cssRulesPath, `${domain}.css`);
  }

  getCSS(domain: string): string {
    try {
      // Try to load domain-specific CSS file
      const domainFile = this.getCSSFilePath(domain);
      if (existsSync(domainFile)) {
        const css = readFileSync(domainFile, 'utf8');
        console.log(`Loaded CSS for domain: ${domain}`);
        return css;
      }

      // Fallback to default CSS file
      const defaultFile = this.getCSSFilePath('default');
      if (existsSync(defaultFile)) {
        const css = readFileSync(defaultFile, 'utf8');
        console.log(`Using default CSS for domain: ${domain}`);
        return css;
      }

      console.log(`No CSS file found for domain: ${domain}`);
      return '';
    } catch (error) {
      console.error(`Failed to load CSS for domain ${domain}:`, error.message);
      return '';
    }
  }

  generateJavaScript(domain: string): string {
    const css = this.getCSS(domain);
    if (!css) {
      return '';
    }

    return `const css = \`${css}\`;

let tag = document.querySelector('style[data-hide-injected]');
if (!tag) {
  tag = document.createElement('style');
  tag.setAttribute('data-hide-injected', '1');
  document.documentElement.appendChild(tag);
}
tag.textContent = css;`;
  }
}

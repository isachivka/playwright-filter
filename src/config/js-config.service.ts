import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class JSConfigService {
  private jsRulesPath: string;

  constructor() {
    this.jsRulesPath = join(process.cwd(), 'js-rules');
    console.log('JS rules directory:', this.jsRulesPath);
  }

  private getJSFilePath(domain: string): string {
    return join(this.jsRulesPath, `${domain}.js`);
  }

  getJS(domain: string): string {
    try {
      // Try to load domain-specific JS file
      const domainFile = this.getJSFilePath(domain);
      if (existsSync(domainFile)) {
        const js = readFileSync(domainFile, 'utf8');
        console.log(`Loaded JS for domain: ${domain}`);
        return js;
      }

      // Fallback to default JS file
      const defaultFile = this.getJSFilePath('default');
      if (existsSync(defaultFile)) {
        const js = readFileSync(defaultFile, 'utf8');
        console.log(`Using default JS for domain: ${domain}`);
        return js;
      }

      console.log(`No JS file found for domain: ${domain}`);
      return '';
    } catch (error) {
      console.error(`Failed to load JS for domain ${domain}:`, error.message);
      return '';
    }
  }

  generateJavaScript(domain: string): string {
    const js = this.getJS(domain);
    if (!js) {
      return '';
    }

    return js;
  }
}

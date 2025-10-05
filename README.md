# Playwright Filter MCP Server

A Model Context Protocol (MCP) server that provides intelligent web browsing capabilities with automatic content filtering and cleaning. This server acts as a proxy between AI clients and web content, applying site-specific CSS rules to remove unwanted elements like advertisements, sidebars, and other clutter.

## 🚀 Featuresк

- **Intelligent Web Navigation**: Navigate to any URL with automatic content filtering
- **Site-Specific CSS Rules**: Custom CSS rules for different websites to clean up content
- **MCP Integration**: Full Model Context Protocol support for AI client integration
- **NestJS Architecture**: Built with NestJS for robust, scalable server architecture
- **Streamable HTTP Transport**: Modern MCP transport for efficient communication
- **Automatic Content Cleaning**: Remove ads, sidebars, and other unwanted elements
- **Configurable CSS Rules**: Easy to add new site-specific filtering rules

## 🏗️ Architecture

This MCP server acts as a bridge between AI clients and web content by:

1. **Receiving navigation requests** from AI clients via MCP
2. **Connecting to a Playwright MCP server** for actual web browsing
3. **Applying site-specific CSS rules** to clean up the content
4. **Returning cleaned snapshots** to the AI client

### Components

- **BrowserTool**: Main MCP tool that handles navigation and content filtering
- **CSSConfigService**: Manages site-specific CSS rules and JavaScript generation
- **MCP Module**: NestJS module that exposes tools via Model Context Protocol

## 📋 Prerequisites

- Node.js 18+ 
- A running Playwright MCP server (for actual web browsing)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/isachivka/playwright-filter.git
   cd playwright-filter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Playwright MCP Server URL
PLAYWRIGHT_MCP_URL=http://192.168.1.10:8931

# Server Configuration
PORT=3000
```

### CSS Rules Configuration

The server uses site-specific CSS rules to clean up web content. Rules are stored in the `css-rules/` directory:

- `css-rules/default.css` - Default rules applied to all sites
- `css-rules/{domain}.css` - Site-specific rules (e.g., `rutracker.org.css`)

#### Adding New Site Rules

1. Create a new CSS file in `css-rules/` with the domain name:
   ```bash
   touch css-rules/example.com.css
   ```

2. Add CSS rules to hide unwanted elements:
   ```css
   .advertisement,
   .ads,
   .sidebar,
   .footer { 
     display: none !important; 
   }
   ```

3. The server will automatically detect and apply these rules when navigating to that domain.

## 🚀 Usage

### Development

```bash
# Start in development mode
npm run start:dev

# Build the project
npm run build

# Start production server
npm run start:prod
```

### MCP Client Integration

The server exposes the following MCP tool:

#### `browser_navigate`

Navigate to a URL and return a cleaned snapshot of the page.

**Parameters:**
- `url` (string, required): The URL to navigate to

**Example:**
```json
{
  "name": "browser_navigate",
  "arguments": {
    "url": "https://rutracker.org/forum/viewtopic.php?t=123456"
  }
}
```

**Response:**
Returns a JSON snapshot of the cleaned page content.

### Testing with MCP Inspector

You can test the server using the MCP Inspector:

```bash
npm run inspector
```

## 🏗️ Project Structure

```
playwright-filter/
├── src/
│   ├── config/                 # Configuration services
│   │   ├── css-config.service.ts
│   │   └── config.module.ts
│   ├── mcp/                    # MCP server implementation
│   │   ├── browser.tool.ts     # Main browser tool
│   │   └── mcp.module.ts       # MCP module configuration
│   ├── app.module.ts           # Main application module
│   └── main.ts                 # Application entry point
├── css-rules/                  # Site-specific CSS rules
│   ├── default.css            # Default cleaning rules
│   └── rutracker.org.css      # RuTracker-specific rules
├── docs/                       # Documentation
├── dist/                       # Compiled JavaScript
└── package.json
```

## 🔧 Development

### Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build the application
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run inspector` - Start MCP Inspector for testing

### Adding New CSS Rules

1. Identify the domain you want to clean
2. Create a CSS file: `css-rules/{domain}.css`
3. Add CSS selectors to hide unwanted elements
4. Test with the MCP Inspector

### Example CSS Rule

```css
/* Hide common unwanted elements */
.advertisement,
.ads,
.sidebar,
.footer,
.header { 
  display: none !important; 
}

/* Site-specific elements */
#sidebar1,
#main-nav,
#logo { 
  display: none !important; 
}
```

## 🐳 Docker Support

The project includes Docker configuration for easy deployment:

```bash
# Build Docker image
docker build -t playwright-filter .

# Run with Docker Compose
docker-compose up
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## 📝 License

This project is licensed under the UNLICENSED license - see the package.json file for details.

## 🔗 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol this server implements
- [NestJS MCP Module](https://www.npmjs.com/package/@rekog/mcp-nest) - The NestJS module used for MCP integration
- [Playwright](https://playwright.dev/) - The underlying browser automation tool

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation in the `docs/` directory
- Review the MCP specification for protocol details

---

**Note**: This server requires a separate Playwright MCP server to function. Make sure you have a compatible Playwright MCP server running and accessible via the configured URL.

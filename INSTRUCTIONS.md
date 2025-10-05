# Playwright Filter MCP Server - Development Instructions

## Project Overview

This project implements a Model Context Protocol (MCP) server that provides intelligent web browsing capabilities with automatic content filtering and cleaning. The server acts as a proxy between AI clients and web content, applying site-specific CSS rules to remove unwanted elements like advertisements, sidebars, and other clutter.

## Architecture

### Core Components

1. **BrowserTool** (`src/mcp/browser.tool.ts`)
   - Main MCP tool that handles navigation and content filtering
   - Connects to a Playwright MCP server for actual web browsing
   - Applies site-specific CSS rules to clean up content
   - Returns cleaned snapshots to AI clients

2. **CSSConfigService** (`src/config/css-config.service.ts`)
   - Manages site-specific CSS rules and JavaScript generation
   - Loads CSS files from `css-rules/` directory
   - Generates JavaScript code to inject CSS into web pages
   - Supports domain-specific and default CSS rules

3. **MCP Module** (`src/mcp/mcp.module.ts`)
   - NestJS module that exposes tools via Model Context Protocol
   - Uses `@rekog/mcp-nest` for MCP integration
   - Configures HTTP+SSE transport for client communication

### Technology Stack

- **NestJS**: Main application framework
- **MCP SDK**: Model Context Protocol implementation
- **@rekog/mcp-nest**: NestJS MCP module for easy integration
- **TypeScript**: Primary programming language
- **Docker**: Containerization support

## Development Standards

### Code Style

- Use TypeScript with strict type checking
- Follow NestJS conventions and patterns
- Use dependency injection for service management
- Implement proper error handling and logging
- Use Zod for parameter validation

### File Organization

```
src/
├── config/                 # Configuration services
│   ├── css-config.service.ts
│   └── config.module.ts
├── mcp/                    # MCP server implementation
│   ├── browser.tool.ts     # Main browser tool
│   └── mcp.module.ts       # MCP module configuration
├── app.module.ts           # Main application module
└── main.ts                 # Application entry point
```

### CSS Rules Management

- Store CSS rules in `css-rules/` directory
- Use domain-specific files: `{domain}.css`
- Provide fallback `default.css` for unknown domains
- CSS rules should hide unwanted elements using `display: none !important`

### Error Handling

- Always wrap external API calls in try-catch blocks
- Return meaningful error messages to clients
- Log errors with appropriate detail level
- Handle MCP client connection failures gracefully

### Environment Configuration

- Use environment variables for configuration
- Default values should be provided for all settings
- Document all required environment variables
- Use `.env` files for local development

## API Design

### MCP Tools

#### `browser_navigate`
- **Purpose**: Navigate to a URL and return cleaned content
- **Parameters**: 
  - `url` (string, required): The URL to navigate to
- **Process**:
  1. Connect to Playwright MCP server
  2. Navigate to the specified URL
  3. Store the URL for potential reuse
  4. Apply site-specific CSS cleaning rules
  5. Take a snapshot of the cleaned page
  6. Return the cleaned content as JSON

#### `browser_apply_css`
- **Purpose**: Apply CSS cleaning to current page without navigation
- **Parameters**: 
  - `url` (string, optional): The URL to apply CSS cleaning to. If not provided, uses the last navigated URL
- **Process**:
  1. Use provided URL or fall back to last navigated URL
  2. Detect site from URL
  3. Apply site-specific CSS cleaning rules
  4. Take a snapshot of the cleaned page
  5. Return the cleaned content as JSON

### MCP Resources

Currently, the server only exposes tools. Resources can be added following the MCP specification and NestJS MCP module patterns.

## Testing

### Test Structure

- Unit tests for individual services
- Integration tests for MCP functionality
- E2E tests for complete workflows
- Use Jest as the testing framework

### Test Coverage

- Test all public methods
- Test error scenarios
- Test CSS rule loading and application
- Test MCP client connection handling

## Deployment

### Docker Support

- Use multi-stage builds for production
- Optimize for size and security
- Use Alpine Linux base image
- Configure proper environment variables

### Environment Variables

- `PLAYWRIGHT_MCP_URL`: URL of the Playwright MCP server
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode

## Performance Considerations

### MCP Client Management

- Reuse MCP client connections when possible
- Implement proper connection cleanup
- Handle connection failures gracefully
- Monitor connection health

### CSS Rule Loading

- Cache CSS rules in memory
- Load rules asynchronously
- Minimize file system operations
- Use efficient CSS selectors

## Security

### Input Validation

- Validate all URL inputs
- Sanitize CSS content
- Prevent injection attacks
- Use Zod schemas for validation

### CORS Configuration

- Configure CORS appropriately for production
- Restrict origins in production
- Use secure headers
- Implement proper authentication if needed

## Monitoring and Logging

### Logging Strategy

- Use structured logging
- Log important operations and errors
- Include context information
- Use appropriate log levels

### Health Checks

- Implement health check endpoints
- Monitor MCP server connectivity
- Track CSS rule loading status
- Monitor memory usage

## Contributing

### Development Workflow

1. Create feature branches from main
2. Follow coding standards
3. Write tests for new functionality
4. Update documentation
5. Submit pull requests

### Code Review

- Review for security issues
- Check error handling
- Verify test coverage
- Ensure documentation updates

## Troubleshooting

### Common Issues

1. **MCP Client Connection Failures**
   - Check Playwright MCP server availability
   - Verify URL configuration
   - Check network connectivity

2. **CSS Rules Not Applied**
   - Verify CSS file exists
   - Check file permissions
   - Validate CSS syntax
   - Check domain detection logic

3. **Memory Leaks**
   - Monitor MCP client connections
   - Ensure proper cleanup in onModuleDestroy
   - Check for circular references

### Debug Mode

- Use `npm run start:debug` for debugging
- Enable verbose logging
- Use MCP Inspector for testing
- Monitor network requests

## Future Enhancements

### Planned Features

- Support for additional MCP tools
- Enhanced CSS rule management
- Caching mechanisms
- Performance optimizations
- Additional site-specific rules

### Architecture Improvements

- Microservices architecture
- Horizontal scaling support
- Advanced error handling
- Metrics and monitoring
- Configuration management
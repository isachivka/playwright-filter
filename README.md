# MCP Nest Boilerplate

A boilerplate template for creating new MCP (Model Context Protocol) projects with NestJS.

## Quick Start - Create New Project from Template

To create a new project based on this template without cloning the repository, use the provided script:

```bash
# Download and run the template creation script
curl -sSL https://raw.githubusercontent.com/isachivka/mcp-nest-boilerplate/main/create-from-template.sh | bash -s <your-project-name>
```

**Example:**
```bash
curl -sSL https://raw.githubusercontent.com/isachivka/mcp-nest-boilerplate/main/create-from-template.sh | bash -s my-awesome-mcp-project
```

This will:
1. Clone the template repository
2. Change the remote origin to your new repository
3. Push all code to your new repository
4. Set up the local repository for development

**Prerequisites:**
- Make sure you have created the target repository on GitHub first
- Ensure you have SSH access to GitHub configured

## Documentation

For detailed information about the project architecture, development standards, and contribution guidelines, please refer to the [INSTRUCTIONS.md](./INSTRUCTIONS.md) file.

## CI/CD

The project uses GitHub Actions for continuous integration and deployment:

- On push to main branch: Runs tests, linting, builds the project, and deploys to production
- On pull requests: Runs tests, linting, and builds the project

For deployment, the project can be deployed in two ways:

- Using Docker (with provided Dockerfile and docker-compose.yml)

To deploy with Docker:

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

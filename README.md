# Notebook MCP Server

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

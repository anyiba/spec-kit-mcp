# Spec Kit MCP Server

This is a Model Context Protocol (MCP) server for [Spec Kit](https://github.com/github/spec-kit). It allows AI assistants to interact with Spec Kit templates and workflows directly to help manage project specifications, planning, and implementation.

## Prerequisites

Before using this MCP server, you must have `specify-cli` installed on your system.

### Persistent Installation (Recommended)

Install once and use everywhere:

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

Then use the tool directly:

```bash
specify init <PROJECT_NAME>
specify check
```

To upgrade Specify, see the Upgrade Guide for detailed instructions. Quick upgrade:

```bash
uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git
```

## Installation & Usage

### Using with MCP Clients (e.g., Claude Desktop, Cursor)

You can run this server directly using `npx`. Add the following configuration to your MCP client settings:

```json
{
  "mcpServers": {
    "spec-kit": {
      "command": "npx",
      "args": [
        "-y",
        "@anyicode/spec-kit-mcp@latest"
      ]
    }
  }
}
```

## Features

This server provides prompts and tools to guide the AI through the Spec Kit workflow:

*   **Constitution** (`speckit.constitution`): Establish or review project principles (code quality, testing, etc.).
*   **Specify** (`speckit.specify`): Combine templates with user requirements to describe what to build.
*   **Plan** (`speckit.plan`): Analyze the project and create a technical plan.
*   **Tasks** (`speckit.tasks`): Break down the plan into actionable tasks.
*   **Implement** (`speckit.implement`): Provide implementation guidelines.

The server automatically detects and uses the `commands/` directory in your project root to access these templates.


## Publishing

To release a new version of this package, follow these steps:

1.  Update the package version (e.g., patch, minor, major):
    ```bash
    npm version patch
    ```
2.  Build the project:
    ```bash
    npm run build
    ```
3.  Publish the package to npm:
    ```bash
    npm publish --access public
    ```
4.  Verify the package is published:
    ```bash
    npm view @anyicode/spec-kit-mcp
    ```

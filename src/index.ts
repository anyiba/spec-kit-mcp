#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    ListToolsRequestSchema,
    CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前目录的辅助变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 我们假设 MCP 运行在用户的项目根目录，或者我们使用 process.cwd()
const PROJECT_ROOT = process.cwd();
const COMMANDS_DIR = path.join(PROJECT_ROOT, "commands");

class SpecKitServer {
    private server: Server;

    constructor() {
        // 初始化 MCP 服务器
        this.server = new Server(
            {
                name: "spec-kit-mcp",
                version: "1.0.0",
            },
            {
                capabilities: {
                    prompts: {},
                    tools: {
                        listChanged: true
                    },
                },
            }
        );

        // 设置请求处理器
        this.setupHandlers();
    }

    private setupHandlers() {
        console.error("DEBUG: Setting up handlers...");

        // 处理列出 Prompts 的请求
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
            return {
                prompts: [
                    {
                        name: "speckit.constitution",
                        description: "Establish project principles using spec-kit",
                    },
                    {
                        name: "speckit.specify",
                        description: "Describe what to build",
                        arguments: [
                            {
                                name: "request",
                                description: "The user's requirement (e.g., speckit: add new user)",
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "speckit.plan",
                        description: "Create a technical plan",
                        arguments: [
                            {
                                name: "context",
                                description: "Additional context or requirement",
                                required: false,
                            },
                        ],
                    },
                    {
                        name: "speckit.tasks",
                        description: "Generate task list",
                    },
                    {
                        name: "speckit.implement",
                        description: "Execute implementation",
                    },
                ],
            };
        });

        // 处理获取 Prompt 的请求
        this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const promptName = request.params.name;
            const args = request.params.arguments || {};

            try {
                // 直接使用 commands 目录路径
                const commandsPath = path.join(PROJECT_ROOT, "commands");

                switch (promptName) {
                    case "speckit.constitution":
                        return await this.handleConstitution(commandsPath);
                    case "speckit.specify":
                        return await this.handleSpecify(commandsPath, args.request as string);
                    case "speckit.plan":
                        return await this.handlePlan(commandsPath, args.context as string);
                    case "speckit.tasks":
                        return await this.handleTasks(commandsPath);
                    case "speckit.implement":
                        return await this.handleImplement(commandsPath);
                    default:
                        throw new Error(`Prompt not found: ${promptName}`);
                }
            } catch (error: any) {
                return {
                    messages: [
                        {
                            role: "user",
                            content: {
                                type: "text",
                                text: `Error: ${error.message}`,
                            },
                        },
                    ],
                };
            }
        });

        // 处理列出工具的请求
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            console.error("Received tools/list request");
            return {
                tools: [
                    {
                        name: "speckit_constitution",
                        description: "Establish project principles using spec-kit",
                        inputSchema: {
                            type: "object",
                            properties: {},
                        },
                    },
                    {
                        name: "speckit_specify",
                        description: "Describe what to build",
                        inputSchema: {
                            type: "object",
                            properties: {
                                request: {
                                    type: "string",
                                    description: "The user's requirement (e.g., speckit: add new user)",
                                },
                            },
                        },
                    },
                    {
                        name: "speckit_plan",
                        description: "Create a technical plan",
                        inputSchema: {
                            type: "object",
                            properties: {
                                context: {
                                    type: "string",
                                    description: "Additional context or requirement",
                                },
                            },
                        },
                    },
                    {
                        name: "speckit_tasks",
                        description: "Generate task list",
                        inputSchema: {
                            type: "object",
                            properties: {},
                        },
                    },
                    {
                        name: "speckit_implement",
                        description: "Execute implementation",
                        inputSchema: {
                            type: "object",
                            properties: {},
                        },
                    },
                ],
            };
        });

        // 处理调用工具的请求
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const toolName = request.params.name;
            const args = request.params.arguments || {};

            try {
                // 直接使用 commands 目录路径
                const commandsPath = path.join(PROJECT_ROOT, "commands");
                let result;
                switch (toolName) {
                    case "speckit_constitution":
                        result = await this.handleConstitution(commandsPath);
                        break;
                    case "speckit_specify":
                        result = await this.handleSpecify(commandsPath, args.request as string);
                        break;
                    case "speckit_plan":
                        result = await this.handlePlan(commandsPath, args.context as string);
                        break;
                    case "speckit_tasks":
                        result = await this.handleTasks(commandsPath);
                        break;
                    case "speckit_implement":
                        result = await this.handleImplement(commandsPath);
                        break;
                    default:
                        throw new Error(`Tool not found: ${toolName}`);
                }

                // 将 Prompt 结果 (messages) 转换为工具结果 (content)
                const firstMessage = result.messages[0];
                let textContent = "";

                if (firstMessage.content && typeof firstMessage.content === 'object' && 'text' in firstMessage.content) {
                    textContent = (firstMessage.content as any).text;
                } else if (typeof firstMessage.content === 'string') {
                    textContent = firstMessage.content;
                } else {
                    textContent = JSON.stringify(firstMessage.content);
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: textContent,
                        },
                    ],
                };

            } catch (error: any) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    // 处理 Constitution (项目宪章) 相关的逻辑
    private async handleConstitution(commandsPath: string) {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please read the project constitution at 'commands/speckit.constitution'. [Note that if this file exists, it is generally in the current directory's .specify/memory/ directory,Scan this folder directly to obtain it] [It's important. You must read it]. If the file is missing or empty, create it with principles focused on code quality, testing standards, user experience consistency, and performance requirements. If it exists, review and use it as the foundation.`,
                    },
                },
            ],
        };
    }

    // 处理 Specify (需求说明) 相关的逻辑
    private async handleSpecify(commandsPath: string, request?: string) {
        const userRequest = request || "No specific requirement provided.";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please read the specification template at 'commands/speckit.specify'[Note that if this file exists, it is generally in the current directory's commands/ directory,Scan this folder directly to obtain it,And the suffixes of each project are not consistent: speckit.specify.xxx] [It's important. You must read it]. Combine this template with the User Requirement: '${userRequest}' to describe what to build.`,
                    },
                },
            ],
        };
    }

    // 处理 Plan (技术计划) 相关的逻辑
    private async handlePlan(commandsPath: string, context?: string) {
        const extraContext = context ? `\nContext: '${context}'` : "";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please read the planning template at 'commands/speckit.plan'[Note that if this file exists, it is generally in the current directory's commands/ directory,Scan this folder directly to obtain it,And the suffixes of each project are not consistent: speckit.plan.xxx] [It's important. You must read it]. Analyze the current project to identify the technology stack. Then, using the template and the Context: '${extraContext}', create a technical plan.`,
                    },
                },
            ],
        };
    }

    // 处理 Tasks (任务分解) 相关的逻辑
    private async handleTasks(commandsPath: string) {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please read the task breakdown template at 'commands/speckit.tasks'[Note that if this file exists, it is generally in the current directory's commands/ directory,Scan this folder directly to obtain it,And the suffixes of each project are not consistent: speckit.tasks.xxx] [It's important. You must read it]. Use this template to break down the technical plan into a list of actionable tasks.`,
                    },
                },
            ],
        };
    }

    // 处理 Implement (实施) 相关的逻辑
    private async handleImplement(commandsPath: string) {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please read the implementation guidelines at 'commands/speckit.implement'[Note that if this file exists, it is generally in the current directory's commands/ directory,Scan this folder directly to obtain it,And the suffixes of each project are not consistent: speckit.implement.xxx] [It's important. You must read it]. Follow these guidelines to execute the implementation tasks.`,
                    },
                },
            ],
        };
    }

    // 启动服务器
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Spec Kit MCP Server running on stdio (v1.0.1)");
    }
}

const server = new SpecKitServer();
server.run().catch(console.error);

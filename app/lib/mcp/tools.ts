
/**
 * MCP Tools Registry & Dispatcher
 * 定义 available tools 并处理执行请求
 */

import type { MCPTool, MCPProjectUpdateParams } from './schema';

/**
 * 所有可用的工具定义
 */
export const AVAILABLE_TOOLS: MCPTool[] = [
    {
        name: "project_update",
        description: "Update project progress, status, and tasks in Cygnus Dashboard based on current context analysis. Use this when the user asks to sync or update project tracking.",
        inputSchema: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Unique identifier/path for the project (e.g. 'coding-agent', 'frontend-refactor'). Should be consistent."
                },
                projectName: {
                    type: "string",
                    description: "Human readable name of the project"
                },
                progress: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    description: "Completion percentage (0-100)"
                },
                healthScore: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    description: "Project health score (0-100)"
                },
                status: {
                    type: "string",
                    enum: ["pending", "in_progress", "completed", "paused"],
                    description: "Current project status"
                },
                tasks: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of active tasks or todo items (Markdown format)"
                }
            },
            required: ["path", "projectName", "progress", "status"]
        }
    },
    {
        name: "project_get",
        description: "Get current project status, progress, and tasks for a specific project path.",
        inputSchema: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Project unique path/identifier"
                }
            },
            required: ["path"]
        }
    },
    {
        name: "project_list",
        description: "List all tracked projects in the dashboard.",
        inputSchema: {
            type: "object",
            properties: {},
        }
    },
    {
        name: "get_schema_info",
        description: "Get the valid ENUM values for project statuses, task priorities, and other database constraints. Use this BEFORE creating/updating to ensure data validity.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "task_list",
        description: "List tasks for a given project ID, optionally filtered by status.",
        inputSchema: {
            type: "object",
            properties: {
                projectId: { type: "string", description: "UUID of the project" },
                status: { type: "string", description: "Filter by status: pending | completed" }
            },
            required: ["projectId"]
        }
    },
    {
        name: "task_create",
        description: "Create a new specific task with rich metadata.",
        inputSchema: {
            type: "object",
            properties: {
                projectId: { type: "string", description: "UUID of the project" },
                text: { type: "string", description: "Task description/content" },
                priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Task urgency" },
                status: { type: "string", enum: ["pending", "completed"], description: "Initial status" },
                filePath: { type: "string", description: "Related file path (optional)" },
                lineNumber: { type: "number", description: "Related line number (optional)" }
            },
            required: ["projectId", "text"]
        }
    },
    {
        name: "task_update",
        description: "Update a specific task's status or priority.",
        inputSchema: {
            type: "object",
            properties: {
                taskId: { type: "string", description: "UUID of the task" },
                status: { type: "string", enum: ["pending", "completed"] },
                priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                text: { type: "string" }
            },
            required: ["taskId"]
        }
    },
    {
        name: "prompt_search",
        description: "Search for prompts/skills in the Cygnus-OS library using semantic query, domain, or tags.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search query (text)" },
                domain: { type: "string", description: "Filter by domain" },
                tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
                limit: { type: "number", description: "Max results (default 20)" }
            }
        }
    },
    {
        name: "get_logs",
        description: "Retrieve recent system logs for debugging and observability.",
        inputSchema: {
            type: "object",
            properties: {
                lines: { type: "number", description: "Number of lines to retrieve (default 50)" },
                type: { type: "string", enum: ["cli", "recovery"], description: "Log type (default 'cli')" }
            }
        }
    }
];

/**
 * 列出所有工具
 */
export function listTools(): MCPTool[] {
    return AVAILABLE_TOOLS;
}

/**
 * 执行工具
 */
export async function executeTool(
    toolName: string,
    args: Record<string, unknown>,
    token: string | null
) {
    if (!token) {
        throw new Error("Authentication required to execute tools. Please provide a valid Bearer token.");
    }

    const projects = await import('./projects');

    switch (toolName) {
        case "project_update":
            return await projects.updateProjectProgress(token, args as unknown as MCPProjectUpdateParams);
        
        case "project_get":
            return await projects.getProjectStatus(token, args.path as string);

        case "project_list":
             return await projects.listProjects(token);

        case "get_schema_info":
             return projects.getSchemaInfo();

        case "task_list":
             return await projects.listTasks(token, args.projectId as string, args.status as string);

        case "task_create":
             return await projects.createTask(token, args.projectId as string, {
                 text: args.text as string,
                 priority: args.priority as string,
                 status: args.status as string,
                 file_path: args.filePath as string,
                 line_number: args.lineNumber as number
             });

        case "task_update":
             return await projects.updateTask(token, args.taskId as string, {
                 status: args.status as string,
                 priority: args.priority as string,
                 task_text: args.text as string
             });

        case "prompt_search":
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             return await import('./skills').then(m => m.searchSkills({ ...args, token } as any));

        case "get_logs":
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             return await import('./system').then(m => m.getLogs(args.lines as number, args.type as any));

        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}

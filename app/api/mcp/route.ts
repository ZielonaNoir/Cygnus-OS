/**
 * MCP Skills Market API
 * 实现 MCP 协议规范，将 PromptHub 作为技能包暴露给 AI 模型
 * 支持 SSE (Server-Sent Events) 和 JSON-RPC 2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerInfo, listSkills, listDomains, listScenarios } from '@lib/mcp/skills';
import { listTools, executeTool } from '@lib/mcp/tools';
import { getAuthToken } from '@lib/mcp/auth';

/**
 * MCP JSON-RPC Request Structure
 */
interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: unknown;
}

/**
 * POST /api/mcp
 * Handle JSON-RPC 2.0 requests and legacy actions
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const token = await getAuthToken(request); // Now async - supports API keys

  if (!token) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Authentication required" }, id: null },
      { status: 401 }
    );
  }

  // 1. Handle JSON-RPC (Standard MCP)
  try {
    // Clone request to check body without consuming it if it's not JSON
    const bodyText = await request.text();
    if (bodyText.trim().startsWith('{')) {
      const body = JSON.parse(bodyText) as JsonRpcRequest;
      
      if (body.jsonrpc === '2.0') {
        const result = await handleJsonRpc(body, token);
        return NextResponse.json(result);
      }
    }
    
    // Fallback for legacy action handling if not JSON-RPC
    if (action === 'execute') {
      const tool = searchParams.get('tool');
      if (!tool) throw new Error('Tool name required');
      const body = JSON.parse(bodyText);
      const result = await executeTool(tool, body, token);
      return NextResponse.json({ success: true, data: result });
    }

  } catch (error) {
    console.error('MCP Handler Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: String(error) } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid request format' } },
    { status: 400 }
  );
}

/**
 * JSON-RPC Handler
 */
async function handleJsonRpc(request: JsonRpcRequest, token: string) {
  try {
    switch (request.method) {
      case 'initialize':
        const serverInfo = getServerInfo();
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05", // MCP Protocol Version
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            },
            serverInfo: {
              name: serverInfo.name,
              version: serverInfo.version
            }
          }
        };

      case 'notifications/initialized':
        // Client ack
        return { jsonrpc: "2.0", id: request.id, result: {} };

      case 'tools/list':
        const tools = listTools();
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: tools.map(t => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema
            }))
          }
        };

      case 'tools/call':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params = request.params as any;
        if (!params || !params.name) {
           throw new Error("Missing tool name in params");
        }
        const toolResult = await executeTool(params.name, params.arguments || {}, token);
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: [{ type: "text", text: JSON.stringify(toolResult, null, 2) }]
          }
        };
      
      case 'resources/list':
        // Map skills to resources
        const skills = await listSkills({ limit: 50, offset: 0, token });
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            resources: skills.data.map(s => ({
              uri: `prompt://${s.id}`,
              name: s.name,
              description: s.description,
              mimeType: "text/markdown"
            }))
          }
        };

      default:
        // Support legacy prompts connection if requested via resources
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: { code: -32601, message: `Method not found: ${request.method}` }
        };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: { code: -32603, message: msg }
    };
  }
}

/**
 * GET /api/mcp
 * SSE Endpoint for MCP Connection
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = await getAuthToken(request); // Await the async function
  const action = searchParams.get('action');

  // If action is present, handle as legacy simple GET
  if (action) {
     const result = await handleLegacyGet(action, searchParams, token);
     return NextResponse.json(result);
  }

  // Standard MCP SSE Connection
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send Endpoint Event
      const endpointUrl = `${request.nextUrl.origin}/api/mcp${token ? `?token=${token}` : ''}`;
      
      controller.enqueue(encoder.encode(`event: endpoint\n`));
      controller.enqueue(encoder.encode(`data: ${endpointUrl}\n\n`));
      
      // Keep connection open with comments or occasional pings if needed
      // For now just keep it open
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Handler for Legacy GET actions (browser view)
 */
async function handleLegacyGet(action: string, searchParams: URLSearchParams, token: string | null) {
    if (action === 'tools') {
      return { success: true, data: { tools: listTools() } };
    }
    if (action === 'domains') {
      return { success: true, data: await listDomains(token) };
    }
    if (action === 'scenarios') {
      const domain = searchParams.get('domain');
      if (!domain) throw new Error('Domain required');
       return { success: true, data: await listScenarios(domain, token) };
    }
    return { success: false, error: 'Unknown action' };
}

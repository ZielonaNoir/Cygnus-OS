/**
 * Agent 相关类型定义
 */

export interface SIPEJSON {
  project_name: string;
  last_sync: string;
  progress: number;
  tasks: SIPETask[];
  requirements: string[];
  health_score: number;
}

export interface SIPETask {
  id: number;
  text: string;
  status: "completed" | "pending";
  priority: "low" | "medium" | "high" | "urgent";
}

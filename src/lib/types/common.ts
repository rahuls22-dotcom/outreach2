// Shared types used across Agents, Workflows, and Channels

/** Field type for data extraction from conversations */
export type FieldType = "string" | "number" | "boolean" | "range" | "enum" | "currency" | "duration";

/** Priority levels for objectives and qualification criteria */
export type Priority = "critical" | "high" | "medium" | "low";

/** Supported communication channels */
export type ChannelType = "voice" | "whatsapp";

/** Definition of a field to extract from a conversation */
export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  unit?: string; // e.g., "₹", "months"
  enum_values?: string[]; // if type is "enum"
}

/** Structured output produced by an agent after a conversation */
export interface AgentOutput {
  /** Call-level outcome */
  outcome: "connected" | "no_answer" | "busy" | "wrong_number" | "voicemail";
  /** Qualification result (null if call didn't connect) */
  qualification: "qualified" | "not_qualified" | "needs_followup" | null;
  /** All extracted fields from the conversation */
  extracted_fields: Record<string, string | number | boolean | null>;
  /** AI-generated conversation summary */
  summary: string;
  /** Overall lead sentiment */
  sentiment: "positive" | "neutral" | "negative";
  /** Confidence in the qualification decision (0-1) */
  confidence: number;
  /** Agent's suggested next action (input to orchestrator) */
  suggested_next_action: string;
  /** If not qualified, the primary reason */
  disqualification_reason?: string;
}

/** Contact outcome types (used in workflows) */
export type ContactOutcome =
  | "qualified"
  | "not_qualified"
  | "callback"
  | "no_answer"
  | "not_called"
  | "busy"
  | "wrong_number";

/** A contact within a workflow execution */
export interface WorkflowContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  outcome: ContactOutcome;
  duration?: string;
  qualification?: string;
  verified?: boolean;
  keyNotes?: string;
  calledAt?: string;
  /** AI orchestrator's decision for this contact */
  aiDecision?: {
    actions_taken: string[];
    reasoning: string;
    confidence: number;
  };
}

export interface SendMessagePayload {
  role: string;
  content: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  agent: string;
  content: string;
  confidence?: number;
  approvalId?: string;
}

export interface ApprovalItem {
  id: string;
  title: string;
  summary: string;
  preview?: string;
  confidence?: number;
  status: "pending" | "approved" | "rejected";
}

export interface ApprovalsResponse {
  items: ApprovalItem[];
}

export interface AgentStatus {
  name: string;
  role: string;
  status: string;
  currentTask?: string;
}

export interface TeamStatusResponse {
  agents: AgentStatus[];
}

/**
 * Typed HTTP client that wraps fetch calls to the Edify API.
 */
export class EdifyApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /**
   * Resolves a Slack user ID to an org auth token.
   * In production this would call an identity service or database lookup.
   */
  async resolveAuthToken(slackUserId: string): Promise<string> {
    // TODO: Implement real token resolution.
    // This should look up the Slack user in the Edify user store and
    // return a valid API bearer token for the user's org.
    //
    // Possible approaches:
    //   1. Call an internal endpoint: GET /v1/auth/slack/:slackUserId
    //   2. Query a mapping table directly
    //   3. Use a cached token from the OAuth install flow
    return `placeholder-token-for-${slackUserId}`;
  }

  /**
   * Sends a message to a specific agent via the conversations API.
   */
  async sendMessage(
    authToken: string,
    conversationId: string,
    payload: SendMessagePayload
  ): Promise<MessageResponse> {
    const res = await fetch(
      `${this.baseUrl}/v1/orgs/me/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      throw new Error(`Edify API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<MessageResponse>;
  }

  /**
   * Gets all pending approvals for the authenticated user's org.
   */
  async getApprovals(authToken: string): Promise<ApprovalsResponse> {
    const res = await fetch(`${this.baseUrl}/v1/orgs/me/approvals?status=pending`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) {
      throw new Error(`Edify API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<ApprovalsResponse>;
  }

  /**
   * Submits a decision (approved / rejected) for a specific approval.
   */
  async decideApproval(
    authToken: string,
    approvalId: string,
    decision: "approved" | "rejected"
  ): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/v1/orgs/me/approvals/${approvalId}/decide`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ decision }),
      }
    );

    if (!res.ok) {
      throw new Error(`Edify API error: ${res.status} ${res.statusText}`);
    }
  }

  /**
   * Gets the current status of all AI team members.
   */
  async getTeamStatus(authToken: string): Promise<TeamStatusResponse> {
    const res = await fetch(`${this.baseUrl}/v1/orgs/me/team/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) {
      throw new Error(`Edify API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<TeamStatusResponse>;
  }
}

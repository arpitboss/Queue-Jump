import { Router, Request, Response } from "express";
import { env } from "../config/env";

export const swaggerRouter = Router();

export function getOpenApiSpec(hostUrl: string) {
  return {
    openapi: "3.0.0",
    info: {
      title: "QueueJump REST API",
      version: "1.2.0",
      description:
        "Production-grade, high-concurrency viral waitlist and referral engine with sub-millisecond Redis ZSET rank calculations, anti-fraud shields, and automated cohort rollouts.",
      contact: {
        name: "QueueJump Product & Web App",
        url: env.APP_URL,
      },
    },
    externalDocs: {
      description: "QueueJump Founder Dashboard & Web App",
      url: env.APP_URL,
    },
    servers: [
      { url: hostUrl, description: "Active API Host" },
      { url: env.API_URL, description: "Configured API Environment" },
    ],
    tags: [
      { name: "Public Waitlist", description: "Client-facing endpoints for widget embeds and public forms" },
      { name: "Campaign Management", description: "Tenant-authenticated campaign configuration and analytics" },
      { name: "Cohort Management", description: "Staged beta rollouts and participant exports" },
      { name: "Tenant Authentication", description: "Founder registration and JWT session management" },
      { name: "System Telemetry", description: "Database and Redis health status" },
    ],
    paths: {
      "/api/v1/health": {
        get: {
          tags: ["System Telemetry"],
          summary: "System Health & Redis Latency Telemetry",
          description: "Returns connection status and latency for PostgreSQL and Redis.",
          responses: {
            200: { description: "All systems operational" },
            503: { description: "Degraded status" },
          },
        },
      },
      "/api/v1/tenants/register": {
        post: {
          tags: ["Tenant Authentication"],
          summary: "Create Founder Account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "Jane Doe" },
                    email: { type: "string", format: "email", example: "jane@startup.com" },
                    password: { type: "string", minLength: 8, example: "securepass123" },
                  },
                  required: ["name", "email", "password"],
                },
              },
            },
          },
          responses: { 201: { description: "Tenant registered with JWT access token" } },
        },
      },
      "/api/v1/tenants/login": {
        post: {
          tags: ["Tenant Authentication"],
          summary: "Sign In to Dashboard",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", format: "email", example: "demo@queuejump.dev" },
                    password: { type: "string", example: "demopassword123" },
                  },
                  required: ["email", "password"],
                },
              },
            },
          },
          responses: { 200: { description: "JWT session token returned" } },
        },
      },
      "/api/v1/campaigns": {
        post: {
          tags: ["Campaign Management"],
          summary: "Create New Launch Campaign",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "AI Beta Waitlist" },
                    referralBonusSec: { type: "number", example: 86400, description: "Seconds skipped per verified referral (86400 = 24h)" },
                    requireEmailVerification: { type: "boolean", default: false, description: "Set false for instant verified referrals without double opt-in" },
                    allowedDomains: { type: "string", example: "https://mycoolstartup.com", description: "Comma-separated domain whitelist" },
                    webhookUrl: { type: "string", example: "https://api.mycoolstartup.com/webhooks/queuejump" },
                    milestones: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          count: { type: "number", example: 3 },
                          reward: { type: "string", example: "Instant VIP Beta Access" },
                        },
                      },
                    },
                  },
                  required: ["name"],
                },
              },
            },
          },
          responses: { 201: { description: "Campaign created with live public and secret keys" } },
        },
        get: {
          tags: ["Campaign Management"],
          summary: "List All Campaigns",
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: "Array of tenant campaigns" } },
        },
      },
      "/api/v1/campaigns/{id}/export": {
        get: {
          tags: ["Cohort Management"],
          summary: "Export Waitlist to CSV",
          description: "Generates and downloads a complete CSV file of all participants ordered by queue rank.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Campaign ID" },
          ],
          responses: {
            200: {
              description: "CSV file download (Content-Type: text/csv)",
            },
          },
        },
      },
      "/api/v1/campaigns/{id}/admit": {
        post: {
          tags: ["Cohort Management"],
          summary: "Admit Cohort to Beta",
          description: "Grants access to the top N verified participants, marks their status as ADMITTED, and fires webhook alerts.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Campaign ID" },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "number", example: 25, description: "Number of top verified participants to admit" },
                  },
                  required: ["count"],
                },
              },
            },
          },
          responses: {
            200: { description: "Cohort admitted and status updated" },
          },
        },
      },
      "/api/v1/waitlist/join": {
        post: {
          tags: ["Public Waitlist"],
          summary: "Join Waitlist (Widget & Headless API)",
          description: "Submits an email to the waitlist. If a referral code is provided, the referrer's rank jumps forward.",
          parameters: [
            {
              name: "X-Campaign-Key",
              in: "header",
              required: true,
              schema: { type: "string", example: "pk_live_demo_queuejump" },
              description: "Public campaign key from your dashboard",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", format: "email", example: "user@startup.com" },
                    referralCode: { type: "string", example: "arpit92", nullable: true },
                    originUrl: { type: "string", example: "https://mycoolstartup.com", description: "Website where widget is hosted (for referral attribution)" },
                  },
                  required: ["email"],
                },
              },
            },
          },
          responses: {
            201: { description: "New participant created with rank position and unique referral link" },
            200: { description: "Existing participant returned idempotently with updated rank" },
          },
        },
      },
      "/api/v1/waitlist/status/{referralCode}": {
        get: {
          tags: ["Public Waitlist"],
          summary: "Get Participant Position & Telemetry",
          parameters: [
            { name: "X-Campaign-Key", in: "header", required: true, schema: { type: "string" } },
            { name: "referralCode", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Live queue position, total in line, and verified referrals" } },
        },
      },
      "/api/v1/waitlist/leaderboard": {
        get: {
          tags: ["Public Waitlist"],
          summary: "Get Public Campaign Leaderboard",
          parameters: [
            { name: "X-Campaign-Key", in: "header", required: true, schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "number", default: 20 } },
          ],
          responses: { 200: { description: "Top ranked participants with masked emails and referral scores" } },
        },
      },
      "/api/v1/waitlist/verify": {
        post: {
          tags: ["Public Waitlist"],
          summary: "Double-Opt-In Confirmation",
          parameters: [
            { name: "token", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Email confirmed and referrer rank jumped" } },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  };
}

swaggerRouter.get("/spec.json", (req: Request, res: Response) => {
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  res.json(getOpenApiSpec(hostUrl));
});

swaggerRouter.get("/", (_req: Request, res: Response) => {
  res.removeHeader("Content-Security-Policy");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>QueueJump API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background: #0A0A0C; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar-nav {
      background: #141417;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .topbar-nav a {
      color: #EDEDED;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: color 0.15s;
    }
    .topbar-nav a:hover {
      color: #10B981;
    }
    .topbar-nav .pill {
      font-size: 11px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #A1A1AA;
      padding: 3px 8px;
      border-radius: 9999px;
      font-family: monospace;
    }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); max-width: 1000px; margin: 0 auto; padding: 24px; }
    .swagger-ui .info h2 { color: #0A0A0A !important; }
    .swagger-ui .btn.execute { background-color: #0A0A0A !important; border-color: #0A0A0A !important; color: #fff !important; }
    .swagger-ui .opblock.opblock-post { border-color: #49cc90; }
    .swagger-ui .opblock.opblock-get { border-color: #61affe; }
  </style>
</head>
<body>
  <div class="topbar-nav">
    <a href="${env.APP_URL}">
      <span>&larr; Return to QueueJump App</span>
    </a>
    <span class="pill">v1.2.0 • OpenAPI 3.0</span>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/docs/spec.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;

  res.send(html);
});

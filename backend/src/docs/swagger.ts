import { Router, Request, Response } from "express";

export const swaggerRouter = Router();

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "QueueJump REST API",
    version: "1.0.0",
    description: "High-concurrency viral waitlist and referral engine with real-time Redis ranking.",
  },
  servers: [{ url: "http://localhost:4000", description: "Local Development" }],
  paths: {
    "/api/v1/health": {
      get: {
        summary: "Health & Telemetry Check",
        description: "Returns connection status and latency for PostgreSQL and Redis.",
        responses: {
          200: { description: "All systems operational" },
          503: { description: "Degraded status" },
        },
      },
    },
    "/api/v1/tenants/register": {
      post: {
        summary: "Register Tenant",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
                required: ["name", "email", "password"],
              },
            },
          },
        },
        responses: { 201: { description: "Tenant registered" } },
      },
    },
    "/api/v1/campaigns": {
      post: {
        summary: "Create Campaign",
        security: [{ BearerAuth: [] }],
        responses: { 201: { description: "Campaign created with live public and secret keys" } },
      },
      get: {
        summary: "List Campaigns",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Tenant campaigns list" } },
      },
    },
    "/api/v1/waitlist/join": {
      post: {
        summary: "Join Waitlist",
        parameters: [
          {
            name: "X-Campaign-Key",
            in: "header",
            required: true,
            schema: { type: "string", example: "pk_live_demo_queuejump" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  referralCode: { type: "string" },
                },
                required: ["email"],
              },
            },
          },
        },
        responses: {
          201: { description: "New participant joined" },
          200: { description: "Existing participant returned idempotently" },
        },
      },
    },
    "/api/v1/waitlist/status/{referralCode}": {
      get: {
        summary: "Participant Queue Status",
        parameters: [
          { name: "X-Campaign-Key", in: "header", required: true, schema: { type: "string" } },
          { name: "referralCode", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Live rank position and telemetry" } },
      },
    },
    "/api/v1/waitlist/verify": {
      post: {
        summary: "Double-Opt-In Email Verification",
        parameters: [
          { name: "token", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Email confirmed and referrer rank jumped" } },
      },
    },
    "/api/v1/waitlist/demo-simulate": {
      post: {
        summary: "Simulate Referral (Playground Only)",
        parameters: [
          { name: "X-Campaign-Key", in: "header", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Simulated verified referral jump" } },
      },
    },
  },
};

swaggerRouter.get("/spec.json", (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

swaggerRouter.get("/", (_req: Request, res: Response) => {
  // Remove Content-Security-Policy header specifically for Swagger UI
  res.removeHeader("Content-Security-Policy");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>QueueJump API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background: #0E0E12; font-family: sans-serif; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .info h2 { color: #FF4F00 !important; }
  </style>
</head>
<body>
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
      });
    };
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});
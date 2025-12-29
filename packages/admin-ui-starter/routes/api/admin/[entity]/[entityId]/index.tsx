import { Handlers } from "$fresh/server.ts";
import { getCookies } from "@std/http/cookie";

const API_BASE_URL = Deno.env.get("API_BASE_URL") || "http://localhost:8000";

// Proxy for individual entity operations: GET, PUT, DELETE /api/admin/:entity/:id
export const handler: Handlers = {
  async GET(req, ctx) {
    const { entity, entityId } = ctx.params;
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;

    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kebabEntity = entity.replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase();
    const url = `${API_BASE_URL}/ts-admin/${kebabEntity}/${entityId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  },

  async PUT(req, ctx) {
    const { entity, entityId } = ctx.params;
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;

    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kebabEntity = entity.replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase();
    const url = `${API_BASE_URL}/ts-admin/${kebabEntity}/${entityId}`;
    const body = await req.json();

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  },

  async DELETE(req, ctx) {
    const { entity, entityId } = ctx.params;
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;

    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kebabEntity = entity.replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase();
    const url = `${API_BASE_URL}/ts-admin/${kebabEntity}/${entityId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  },
};

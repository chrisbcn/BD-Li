import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-4aa4529b/health", (c) => {
  return c.json({ status: "ok" });
});

// Task management endpoints
app.get("/make-server-4aa4529b/tasks", async (c) => {
  try {
    const tasks = await kv.get("tasks");
    return c.json({ tasks: tasks || [] });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return c.json({ error: "Failed to fetch tasks", details: String(error) }, 500);
  }
});

app.post("/make-server-4aa4529b/tasks", async (c) => {
  try {
    const body = await c.req.json();
    const { tasks } = body;
    
    if (!Array.isArray(tasks)) {
      return c.json({ error: "Tasks must be an array" }, 400);
    }
    
    await kv.set("tasks", tasks);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving tasks:", error);
    return c.json({ error: "Failed to save tasks", details: String(error) }, 500);
  }
});

// Column names endpoints
app.get("/make-server-4aa4529b/column-names", async (c) => {
  try {
    const columnNames = await kv.get("column-names");
    return c.json({ columnNames: columnNames || null });
  } catch (error) {
    console.error("Error fetching column names:", error);
    return c.json({ error: "Failed to fetch column names", details: String(error) }, 500);
  }
});

app.post("/make-server-4aa4529b/column-names", async (c) => {
  try {
    const body = await c.req.json();
    const { columnNames } = body;
    
    await kv.set("column-names", columnNames);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving column names:", error);
    return c.json({ error: "Failed to save column names", details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
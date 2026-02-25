import { fromHono } from "chanfana";
import { Hono } from "hono";

import { CreateReasons } from "./endpoints/create-reasons";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/"
});

openapi.get("/api/reasons", CreateReasons);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;

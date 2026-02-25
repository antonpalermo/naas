import { DateTime, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const Request = z.object({
  reason: z.enum(["out sick", "in vacation", "in a meeting", "emergency"]),
  message: Str({ required: true })
});

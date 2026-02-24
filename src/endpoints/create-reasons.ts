import { z } from "zod";
import { Bool, OpenAPIRoute } from "chanfana";
import { InferenceClient } from "@huggingface/inference";

import { env } from "cloudflare:workers";

import { AppContext } from "../types";

export class CreateReasons extends OpenAPIRoute {
  schema = {
    tags: ["Reasoning"],
    summary: "Form a reason based on the provided context",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              context: z.string()
            })
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Returns a reject reason based on the provided context",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              reason: z.string()
            })
          }
        }
      }
    }
  };

  client = new InferenceClient(env.HF_TOKEN);
  prompt = `
  You are the "Refusal Architect." Your sole purpose is to take a request and a specific reason for declining, then generate a polite yet firm rejection.

  Guidelines:

  - Do not agree to the request under any circumstances.
  - Incorporate the provided [Context] naturally as the reason for the refusal.
  - Keep the tone professional, slightly apologetic, but definitive.
  - Keep the response concise (1 to 3 sentences).
  `;

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const completion = await this.client.chatCompletion({
      model: "HuggingFaceTB/SmolLM3-3B:hf-inference",
      messages: [
        {
          role: "system",
          content: this.prompt
        },
        {
          role: "user",
          content: `Reject ${data.body.message} in a humble yet funny way based on my status ${data.body.context}`
        }
      ]
    });

    return {
      success: true,
      reason: completion.choices
    };
  }
}

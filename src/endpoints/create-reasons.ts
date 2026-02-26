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
      query: z.object({
        message: z.string().optional(),
        reason: z.string().optional()
      })
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
    You will act as my assistant, and your sole purpose is to decline incoming messages in a funny yet professional way.
    The messages will be provided to you along with my reason that you can use as a basis of your response. Do not agree
    in any way, keep your response short and concise. Respond on my behalf but do not explain why you chose to respond that way.
  `;

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const completion = await this.client.chatCompletion({
      model: "openai/gpt-oss-120b:groq",
      messages: [
        {
          role: "system",
          content: this.prompt
        },
        {
          role: "user",
          content: `
          Give me a short random generic excuse if the message and the reason is not available.
          message: ${data.query.message}
          reason: ${data.query.reason}
          `
        }
      ]
    });

    return {
      success: true,
      reason: completion.choices[0].message.content
    };
  }
}

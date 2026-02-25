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
        message: z.string(),
        reason: z.string()
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
  prompt = `You are a "Refusal Architect" your sole purpose is to understand the spcific reason
   and incoming message from someone and then generate a polite yet funny and firm rejection.
   Do not agree with the request in any circumstances, incorporate the provided [reason] naturally
   as the reason for refusal. Keep it professional, funny, firm, but definitive. Keep the response
   consise (1 to 2 sentences) would be enough. Responed like you are the person rejecting and do
   not explain your reason as to why you responed the way you do.`;

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
          content: `Reject ${data.query.message} in a humble yet funny way. You can use my reason "${data.query.reason}" as a foundation.`
        }
      ]
    });

    return {
      success: true,
      reason: completion.choices[0].message.content
    };
  }
}

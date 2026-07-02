import {
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';

const app = new Hono();

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY as string
});

app.post('/',
  zValidator('json', z.object({ prompt: z.string() })),
  async c => {
    const { prompt } = c.req.valid('json');

    const result = streamText({
      model: groq("qwen/qwen3-32b"),
      prompt,
    });
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  },
);

export default {
  port: 8081,
  fetch: app.fetch,
};


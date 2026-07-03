import {
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import { sayHello, shellTool } from './lib/tools';
import { experimental_sandbox } from './lib/utils';

const app = new Hono();

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY as string
});

app.post('/chat',
  zValidator('json', z.object({ prompt: z.string(), directory: z.string() })),
  async c => {
    const { prompt, directory } = c.req.valid('json');
    const result = streamText({
      model: groq("qwen/qwen3-32b"),
      toolsContext: {
        shellCommands: { directory: directory }
      },
      tools: {
        sayGreet: sayHello,
        shellCommands: shellTool
      },
      experimental_sandbox: experimental_sandbox(directory) as any,
      stopWhen: isStepCount(3),
      prompt,
    });
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream, tools: result.toolResults as any }),
    });
  },
);


app.get("/health", (c) => {
  return c.json({
    message: "OK"
  }, 200);
});

export default {
  port: 8081,
  fetch: app.fetch,
};

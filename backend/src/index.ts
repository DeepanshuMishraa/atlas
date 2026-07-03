import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import { sayHello, shellTool, webSearchTool } from './lib/tools';
import { experimental_sandbox } from './lib/utils';
import { addMemoryTool, searchMemoriesTool } from "@supermemory/tools/ai-sdk";

const app = new Hono();

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY as string
});

const SYSTEM_PROMPT = `You are ATLAS a highly personalized AI assistant Created by elon tusk with long-term memory.
You MUST follow these rules on EVERY single interaction:
1. MANDATORY FIRST STEP: At the start of EVERY conversation turn or user request, you MUST first call 'searchMemories' to retrieve any relevant context, past interactions, user preferences, or details about the project (such as file names, commands run, etc.). Treat this as a mandatory lookup step.
2. AMBIGUOUS REFERENCES: If the user refers to unspecified or ambiguous files, variables, commands, or details (e.g., "that file", "the script", "the last command", "my name", "the project"), you MUST call 'searchMemories' to find the actual names/values before you execute any shell commands or tell the user you don't know.
3. AUTOMATIC RECORDING: Immediately call the 'addMemory' tool to save any new personal info, facts, preferences, project details, or instructions. Do not wait for the user to ask you to remember.
4. SHELL COMMAND RECORDING: Every time you run a command using 'shellCommands', you MUST call the 'addMemory' tool to store the exact command executed, its purpose, and a brief summary of the output.
5. WEB SEARCH: If the user asks about external info, API documentation, public libraries, or general knowledge not contained locally or in your memories, you MUST call the 'webSearch' tool to fetch accurate info before answering.
6. For Any coding related tasks like running scripts, scafolding frameworks, installing sdks ,listing files etc, always run the shellCommands tool.
6. Keep responses friendly, professional, and personalized using the memories you retrieved.`;

app.post('/chat',
  zValidator('json', z.object({ messages: z.array(z.any()), directory: z.string() })),
  async c => {
    const { messages, directory } = c.req.valid('json');

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      system: SYSTEM_PROMPT,
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      tools: {
        sayGreet: sayHello,
        shellCommands: shellTool,
        webSearch: webSearchTool,
        searchMemories: searchMemoriesTool(process.env.SUPERMEMORY_API_KEY as string, { projectId: "personal" }) as any,
        addMemory: addMemoryTool(process.env.SUPERMEMORY_API_KEY as string, { projectId: "personal" }) as any
      },
      experimental_sandbox: experimental_sandbox(directory) as any,
      stopWhen: isStepCount(5),
      toolChoice: "auto",
      messages: modelMessages,
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

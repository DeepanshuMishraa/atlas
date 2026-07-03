import { tool } from "ai";
import z from "zod";
import { shellCommandSchema, webSearchSchema } from "./types";


export const sayHello = tool({
  description: "Says greeting  to person",
  inputSchema: z.object({
    greet: z.string().describe("greeting to say"),
    person: z.string().describe("person to greet"),
  }),
  execute: ({ greet, person }) => {
    return `${greet} to the sweet and lovely ${person}!`;
  }
});


export const shellTool = tool({
  inputSchema: shellCommandSchema,
  execute: async ({ command, directory }, { experimental_sandbox, abortSignal }) => {
    if (!experimental_sandbox) {
      throw new Error('Experimental sandbox is not available');
    }

    return experimental_sandbox.run({ command, workingDirectory: directory, abortSignal });
  },

});


export const webSearchTool = tool({
  description: "Search the web",
  inputSchema: webSearchSchema,
  execute: async ({ query }) => {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        'X-API-KEY': 'cd4e2950d5b544cb117ee25460caa2902086f144',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query })
    });

    return response.json();
  }
})

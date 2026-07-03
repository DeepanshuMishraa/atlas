import { tool } from "ai";
import z from "zod";
import { ContextSchema, shellCommandSchema } from "./types";


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
  contextSchema: ContextSchema,
  description: ({ context, experimental_sandbox }) =>
    [
      `Run shell commands for the ${context.directory} project.`,
      experimental_sandbox != null
        ? `Sandbox: ${experimental_sandbox.description}`
        : undefined,
    ]
      .filter(Boolean)
      .join('\n'),

  inputSchema: shellCommandSchema,
  execute: async ({ command }, { experimental_sandbox }) => {
    if (!experimental_sandbox) {
      throw new Error('Experimental sandbox is not available');
    }

    return experimental_sandbox.run({ command });
  },

})

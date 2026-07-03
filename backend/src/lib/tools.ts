import { tool } from "ai";
import z from "zod";


export const sayHello = tool({
  description: "Says greeting  to person",
  inputSchema: z.object({
    greet: z.string().describe("greeting to say"),
    person: z.string().describe("person to greet"),
  }),
  execute: ({ greet, person }) => {
    return `${greet} to the sweet and lovely ${person}!`;
  }
})

import z from "zod";


export const shellCommandSchema = z.object({
  command: z.string().describe("command to run"),
});


export const ContextSchema = z.object({
  directory: z.string().describe("directory to run command in"),
})

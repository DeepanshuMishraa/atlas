import z from "zod";


export const shellCommandSchema = z.object({
  command: z.string().describe("command to run"),
  directory: z.string().describe("directory to run the command in"),
});




export const webSearchSchema = z.object({
  query: z.string().describe("query to search"),
})

export const experimental_sandbox = (directory: string) => {
  return {
    description: `Local project directory: ${directory}`,
    run: async ({ command }: { command: string; }) => {
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        const { stdout, stderr } = await execAsync(command, { cwd: directory });
        return { stdout, stderr, exitCode: 0 };
      } catch (error: any) {
        return {
          stdout: error.stdout || "",
          stderr: error.stderr || error.message || "",
          exitCode: error.code || 1
        };
      }
    }
  };
};

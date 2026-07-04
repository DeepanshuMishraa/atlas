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

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const API_KEY_DIR = path.join(os.homedir(), '.atlas');
const API_KEY_PATH = path.join(API_KEY_DIR, 'apiKey.json');

export function readApiKeyFromDisk(): string | null {
  try {
    const raw = fs.readFileSync(API_KEY_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return typeof parsed.apiKey === 'string' ? parsed.apiKey : null;
  } catch {
    return null;
  }
}

export function writeApiKeyToDisk(apiKey: string): void {
  fs.mkdirSync(API_KEY_DIR, { recursive: true });
  fs.writeFileSync(API_KEY_PATH, JSON.stringify({ apiKey }), 'utf-8');
}

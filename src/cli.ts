#!/usr/bin/env bun
import { fetch } from "bun";

const args = process.argv.slice(2);

if (args[0] === '--set-api-key' && args[1]) {
  const apiKey = args[1];

  try {
    const res = await fetch('http://localhost:8081/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });

    if (res.ok) {
      console.log('✓ API key saved successfully');
      process.exit(0);
    } else {
      const body = await res.json().catch(() => ({} as Record<string, unknown>));
      const errorMsg = body && typeof body === 'object' && 'error' in body
        ? String(body.error)
        : res.statusText;
      console.error('✗ Failed:', errorMsg);
      process.exit(1);
    }
  } catch {
    console.error('✗ Could not reach the backend at http://localhost:8081');
    console.error('  Make sure the server is running (bun run --hot backend/src/index.ts)');
    process.exit(1);
  }
} else {
  console.log('Usage: bun run src/cli.ts -- --set-api-key <your-groq-api-key>');
  process.exit(1);
}

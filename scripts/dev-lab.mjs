#!/usr/bin/env node
/**
 * Scenario Lab dev workflow: runs `next dev` (apps/web, :3000) and the Lab's Vite dev server (:5173, base /lab/) together.
 * Open http://localhost:5173/lab/. Vite proxies every path that is not the Lab's own to :3000, so the iframe is same-origin.
 */
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const procs = [
  { name: 'web', color: '\x1b[36m', args: ['run', 'dev', '-w', '@pll/web'] },
  { name: 'lab', color: '\x1b[35m', args: ['run', 'dev', '-w', '@pll/lab'] },
];

let stopping = false;
const children = procs.map(({ name, color, args }) => {
  const child = spawn('npm', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  const prefix = `${color}[${name}]\x1b[0m `;
  const pipe = (stream, out) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) out.write(`${prefix}${line}\n`);
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`${prefix}exited with code ${code}; stopping the other process`);
      stop(code ?? 1);
    }
  });
  return child;
});

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGTERM'); // the whole process group (npm -> node -> next/vite)
    } catch {
      /* already gone */
    }
  }
  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
console.log('Scenario Lab: web on http://localhost:3000, Lab on http://localhost:5173/lab/');

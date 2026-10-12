/** Lab-side half of the service worker protocol (see src/sw/index.ts). */
import type { ScenarioState } from '@pll/scenarios';

export const SW_URL = '/lab-sw.js';

export async function registerServiceWorker(timeoutMs = 8000): Promise<void> {
  if (!('serviceWorker' in navigator)) throw new Error('This browser has no service worker support (or the page is not on https/localhost).');
  await navigator.serviceWorker.register(SW_URL, { scope: '/' });
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('The service worker is active but is not controlling this page. This happens after a hard reload (Shift+Reload): reload normally.')),
      timeoutMs,
    );
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/** Post a message and wait for the worker's reply on a private channel. */
export function request<T = unknown>(message: unknown, timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const controller = navigator.serviceWorker.controller;
    if (!controller) return reject(new Error('No active service worker.'));
    const channel = new MessageChannel();
    const timer = setTimeout(() => reject(new Error('The service worker did not answer.')), timeoutMs);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(event.data as T);
    };
    controller.postMessage(message, [channel.port2]);
  });
}

export const pushState = (state: ScenarioState) => request({ type: 'SET_STATE', state });

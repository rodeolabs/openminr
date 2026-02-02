import { nanoid } from 'nanoid';

/**
 * Generates a cryptographically secure unique ID
 * Replaces Math.random() fallback which could have collisions
 */
export function generateUUID(): string {
  return nanoid();
}

/**
 * Generates a short ID (21 chars) for notifications and temporary IDs
 */
export function generateShortId(): string {
  return nanoid(12);
}
/**
 * Vercel Serverless Function Bridge for RescueRoom
 * Routes incoming API requests directly through the hardened RescueRoom backend requestHandler.
 */
import { requestHandler } from '../server/index.js';

export default async function handler(req, res) {
  return requestHandler(req, res);
}


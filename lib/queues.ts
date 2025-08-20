// lib/queues.ts
import { Queue } from 'bullmq';
const connection = { connection: { url: process.env.REDIS_URL! } };
export const thumbQueue = new Queue('thumbs', connection);

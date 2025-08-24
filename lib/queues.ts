
// lib/queues.ts
import type { SendMessageCommandOutput } from "@aws-sdk/client-sqs";

type GenerateThumbsPayload = { videoId: string };

const provider = (process.env.QUEUE_PROVIDER || "redis").toLowerCase();

export async function enqueueGenerateThumbs(videoId: string): Promise<unknown> {
  const payload: GenerateThumbsPayload = { videoId };
  if (provider === "sqs") return enqueueSQS("generate-thumbs", payload);
  return enqueueRedis("thumbs", payload);
}

/* ---------- REDIS (kept for local/dev) ---------- */
let bullQueue: Queue | null = null;
async function enqueueRedis(name: string, data: unknown) {
  if (!bullQueue) {
    const { Queue } = await import("bullmq");
    bullQueue = new Queue("video-jobs", { connection: { url: process.env.REDIS_URL! } });
  }
  return bullQueue.add(name, data, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
}

/* ---------- SQS (production) ---------- */
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { Queue } from "bullmq";
const sqs = new SQSClient({ region: process.env.AWS_REGION });

async function enqueueSQS(type: string, data: unknown): Promise<SendMessageCommandOutput> {
  const QueueUrl = process.env.SQS_QUEUE_URL!;
  const isFifo = (process.env.SQS_QUEUE_FIFO || "false").toLowerCase() === "true";

  const body = JSON.stringify({ type, version: 1 as const, data });

  const cmd = new SendMessageCommand({
    QueueUrl,
    MessageBody: body,
    ...(isFifo ? {
      MessageGroupId: "video-jobs",
      MessageDeduplicationId: `dedupe:${type}:${(data as GenerateThumbsPayload)?.videoId ?? Date.now()}`
    } : {})
  });

  return sqs.send(cmd);
}

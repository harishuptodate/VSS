// worker/index.ts
import "dotenv/config";
import { worker } from "./thumb.worker";

console.log("Thumb worker started");
worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed`, err));

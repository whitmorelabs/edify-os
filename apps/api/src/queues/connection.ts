import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import type IORedis from 'ioredis';

export function createQueue(name: string, redis: IORedis) {
  return new Queue(name, {
    connection: redis as unknown as ConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  });
}

export function createWorker(
  name: string,
  processor: Parameters<typeof Worker>[1],
  redis: IORedis,
  concurrency = 5
) {
  return new Worker(name, processor, {
    connection: redis as unknown as ConnectionOptions,
    concurrency,
  });
}

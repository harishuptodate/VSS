// worker/index.ts
import 'dotenv/config';
import { worker } from './thumb.worker';
import http from 'http';

// Production logging
const log = (level: string, message: string, meta?: Record<string, unknown>) => {
	const timestamp = new Date().toISOString();
	console.log(
		JSON.stringify({
			timestamp,
			level,
			message,
			...meta,
		}),
	);
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
	log('info', `Received ${signal}, starting graceful shutdown`);

	try {
		await worker.close();
		log('info', 'Worker closed successfully');
		process.exit(0);
	} catch (error) {
		log('error', 'Error during shutdown', { error: (error as Error).message });
		process.exit(1);
	}
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Worker event handlers
worker.on('completed', (job) => {
	log('info', 'Job completed', {
		jobId: job.id,
		jobName: job.name,
		duration: Date.now() - job.timestamp,
	});
});

worker.on('failed', (job, err) => {
	log('error', 'Job failed', {
		jobId: job?.id,
		jobName: job?.name,
		error: err.message,
		stack: err.stack,
	});
});

worker.on('error', (err) => {
	log('error', 'Worker error', {
		error: err.message,
		stack: err.stack,
	});
});

// Health check endpoint (optional)
if (process.env.ENABLE_HEALTH_CHECK === 'true') {
	const server = http.createServer((req, res) => {
		if (req.url === '/health') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({
					status: 'healthy',
					timestamp: new Date().toISOString(),
				}),
			);
		} else {
			res.writeHead(404);
			res.end();
		}
	});

	const port = process.env.HEALTH_CHECK_PORT || 3001;
	server.listen(port, () => {
		log('info', `Health check server listening on port ${port}`);
	});
}

log('info', 'Thumbnail worker started successfully');

// worker/utils/ffmpeg.ts
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from '@ffprobe-installer/ffprobe';
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath || 'ffmpeg');
ffmpeg.setFfprobePath(ffprobePath.path);

export function probeDuration(filePath: string): Promise<number> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(
			filePath,
			(err: Error | null, data: { format: { duration?: number } }) => {
				console.log('from probeDuration');
				console.log(err, data);
				if (err) return reject(err);
				const dur = data.format.duration ?? 0;
				resolve(Math.max(0, Math.floor(dur)));
			},
		);
	});
}

export function extractJpeg(
	input: string,
	output: string,
	timeSec: number,
): Promise<void> {
	return new Promise((resolve, reject) => {
		ffmpeg(input)
			.seekInput(timeSec)
			.frames(1)
			.outputOptions(['-qscale:v 3'])
			.save(output)
			.on('end', () => resolve())
			.on('error', reject);
	});
}


import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { JobManager } from './job-manager';

const CHUNK_DURATION_SECONDS = 600; // 10 minutes

export async function processAudio(jobId: string, filePath: string) {
    console.log(`Starting processing for job ${jobId}`);
    JobManager.updateJob(jobId, { status: 'processing', progress: 5 });

    try {
        const outputDir = path.join(path.dirname(filePath), `${jobId}_chunks`);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        // 1. Split Audio
        console.log(`Splitting audio file: ${filePath}`);
        // Always use WAV for processing (compatible with soundfile/noisereduce)
        const outputPattern = path.join(outputDir, `chunk_%03d.wav`);

        await new Promise<void>((resolve, reject) => {
            ffmpeg(filePath)
                .outputOptions([
                    `-f segment`,
                    `-segment_time ${CHUNK_DURATION_SECONDS}`,
                    `-reset_timestamps 1`,
                    `-acodec pcm_s16le`, // Force WAV PCM
                    `-ar 16000`,         // Whisper optimal rate
                    `-ac 1`              // Mono
                ])
                .output(outputPattern)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });

        const chunkFiles = fs.readdirSync(outputDir).sort();
        console.log(`Split into ${chunkFiles.length} chunks`);
        JobManager.updateJob(jobId, { totalChunks: chunkFiles.length, progress: 10 });

        // 2. Transcribe Chunks
        let fullText = '';

        for (let i = 0; i < chunkFiles.length; i++) {
            const chunkName = chunkFiles[i];
            const chunkPath = path.join(outputDir, chunkName);

            console.log(`Transcribing chunk ${i + 1}/${chunkFiles.length}: ${chunkName}`);
            JobManager.updateJob(jobId, {
                currentChunk: i + 1,
                progress: 10 + Math.round(((i) / chunkFiles.length) * 80)
            });

            const text = await transcribeChunk(chunkPath);
            fullText += text + '\n\n';
        }

        // Cleanup
        // fs.rmSync(outputDir, { recursive: true, force: true });
        // fs.unlinkSync(filePath); // keeping files for debug for now

        JobManager.updateJob(jobId, {
            status: 'completed',
            progress: 100,
            result: fullText
        });

    } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        JobManager.updateJob(jobId, {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
        });
    }
}

function transcribeChunk(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(process.cwd(), 'scripts', 'transcribe.py');
        const pythonProcess = spawn('python3', [scriptPath, file, 'base']);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`[Python API] ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
            } else {
                resolve(output.trim());
            }
        });
    });
}

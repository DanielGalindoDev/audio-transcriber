
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { JobManager } from './job-manager';

const CHUNK_DURATION_SECONDS = 600; // 10 minutes


export async function processQueue() {
    // 1. Check if a job is already running
    const running = JobManager.getRunningJob();
    if (running) {
        console.log(`Job ${running.id} is currently processing. Queue waiting.`);
        return;
    }

    // 2. Get next job
    const job = JobManager.getNextQueuedJob();
    if (!job) {
        console.log("No jobs in queue.");
        return;
    }

    // 3. Start Processing
    console.log(`Starting job ${job.id} (${job.filename})`);

    // Construct file path
    const uploadsDir = path.join(process.cwd(), 'lib', 'tmp', 'uploads');
    const filePath = path.join(uploadsDir, `${job.id}_${job.filename}`);

    JobManager.updateJob(job.id, { status: 'processing', progress: 0 });

    const outputDir = path.join(uploadsDir, `${job.id}_chunks`);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
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

        // 2. Transcribe Chunks
        const chunks = fs.readdirSync(outputDir).filter(f => f.endsWith('.wav')).sort();
        console.log(`Found ${chunks.length} chunks to process`);

        JobManager.updateJob(job.id, { totalChunks: chunks.length });

        let fullText = "";

        for (let i = 0; i < chunks.length; i++) {
            const chunkName = chunks[i];
            const chunkPath = path.join(outputDir, chunkName);

            console.log(`Processing chunk ${i + 1}/${chunks.length}: ${chunkName}`);
            JobManager.updateJob(job.id, {
                currentChunk: i + 1,
                progress: ((i) / chunks.length) * 100
            });

            // Call Python script
            const transcription = await transcribeChunk(chunkPath);
            fullText += transcription + " ";
        }

        // 3. Finish
        JobManager.updateJob(job.id, {
            status: 'completed',
            progress: 100,
            result: fullText.trim()
        });

    } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        JobManager.updateJob(job.id, {
            status: 'failed',
            error: String(error)
        });
    } finally {
        // TRIGGER NEXT JOB
        processQueue();
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

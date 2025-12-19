
import { NextRequest, NextResponse } from 'next/server';
import { JobManager } from '@/lib/job-manager';
import { processAudio } from '@/lib/process-audio';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';


export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Create a Job ID
        const jobId = crypto.randomUUID();
        const uploadsDir = path.join(process.cwd(), 'lib', 'tmp', 'uploads');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, `${jobId}_${file.name}`);

        // Convert Web Stream to Node Stream and save to disk
        // @ts-ignore - Readable.fromWeb is available in Node 18+
        const readable = Readable.fromWeb(file.stream());
        const writeStream = fs.createWriteStream(filePath);
        await pipeline(readable, writeStream);

        // Create Job
        JobManager.createJob(jobId, file.name);

        // Start processing in background (without awaiting)
        processAudio(jobId, filePath);

        return NextResponse.json({ jobId, message: 'Upload successful, processing started' });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed', details: String(error) }, { status: 500 });
    }
}

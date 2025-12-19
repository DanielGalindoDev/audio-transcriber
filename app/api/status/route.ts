
import { NextRequest, NextResponse } from 'next/server';
import { JobManager } from '@/lib/job-manager';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing job ID' }, { status: 400 });
    }

    const job = JobManager.getJob(id);

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
}


import { NextRequest, NextResponse } from 'next/server';
import { JobManager } from '@/lib/job-manager';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const job = JobManager.getJob(id);

    if (!job || !job.result) {
        return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Return plain text
    return new NextResponse(job.result, {
        headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${job.filename}_transcript.txt"`,
        },
    });
}

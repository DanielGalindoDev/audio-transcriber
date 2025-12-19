
import { NextRequest, NextResponse } from 'next/server';
import { JobManager } from '@/lib/job-manager';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    JobManager.deleteJob(id);
    return NextResponse.json({ success: true });
}

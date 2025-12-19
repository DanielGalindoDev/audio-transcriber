
import { NextResponse } from 'next/server';
import { JobManager } from '@/lib/job-manager';

export async function GET() {
    const jobs = JobManager.getAllJobs();
    // Return array sorted by creation time (descending)
    const jobsList = Object.values(jobs).sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json(jobsList);
}


import fs from 'fs';
import path from 'path';

const JOBS_FILE = path.join(process.cwd(), 'lib', 'tmp', 'jobs.json');

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Job {
    id: string;
    filename: string;
    status: JobStatus;
    progress: number; // 0 to 100
    currentChunk?: number;
    totalChunks?: number;
    result?: string;
    error?: string;
    createdAt: number;
}

// Ensure tmp directory exists
if (!fs.existsSync(path.dirname(JOBS_FILE))) {
    fs.mkdirSync(path.dirname(JOBS_FILE), { recursive: true });
}

// Initialize jobs file if empty
if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, JSON.stringify({}));
}

export const JobManager = {
    getJob: (id: string): Job | null => {
        const jobs = JobManager.getAllJobs();
        return jobs[id] || null;
    },

    getAllJobs: (): Record<string, Job> => {
        try {
            if (!fs.existsSync(JOBS_FILE)) return {};
            const data = fs.readFileSync(JOBS_FILE, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            console.error("Error reading jobs file", e);
            return {};
        }
    },

    createJob: (id: string, filename: string): Job => {
        const jobs = JobManager.getAllJobs();
        const job: Job = {
            id,
            filename,
            status: 'queued',
            progress: 0,
            createdAt: Date.now(),
        };
        jobs[id] = job;
        JobManager.saveJobs(jobs);
        return job;
    },

    updateJob: (id: string, updates: Partial<Job>) => {
        const jobs = JobManager.getAllJobs();
        if (jobs[id]) {
            jobs[id] = { ...jobs[id], ...updates };
            JobManager.saveJobs(jobs);
        }
    },

    saveJobs: (jobs: Record<string, Job>) => {
        fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
    }
};

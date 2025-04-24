import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { exec } from 'child_process';

export async function POST(req: NextRequest) {
  const scriptPath = path.join(process.cwd(), 'api', 'scheduling', 'generate_schedule.py');
  const command = `python "${scriptPath}"`;

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error('Python Error:', error?.message || stderr);
        resolve(NextResponse.json({ error: 'Schedule generation failed', details: stderr || error?.message }, { status: 500 }));
        return;
      }

      try {
        const schedule = JSON.parse(stdout);
        resolve(NextResponse.json({ success: true, schedule }));
      } catch (err) {
        console.error('Parse error:', err);
        resolve(NextResponse.json({ error: 'Invalid output from Python script' }, { status: 500 }));
      }
    });
  });
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const UPLOAD_DIR = path.join(process.cwd(), 'app', 'upload', 'data');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file'); 

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Define the file path
    const filePath = path.join(UPLOAD_DIR, file.name);

    // Save the file to the disk
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Run the pdfscraper.py script
    const command = `python "..\\schedule-lsu\\app\\upload\\pdfScraper.py" "${filePath}"`;
    
    return new Promise<NextResponse>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
          reject(`Error: ${error?.message || stderr}`);
        } else {
          try {
            const parsedData = JSON.parse(stdout); 
            resolve(NextResponse.json(parsedData));
          } catch (err) {
            reject('Failed to parse Python script output');
          }
        }
      });
    });

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

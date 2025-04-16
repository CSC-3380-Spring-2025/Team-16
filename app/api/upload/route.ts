import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const UPLOAD_DIR = path.join(process.cwd(), 'app', 'api', 'upload', 'data');

export async function POST(request: NextRequest) {
  try {
    // 1. Handle file upload
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 2. Ensure upload directory exists
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    // 3. Save the uploaded PDF
    const filePath = path.join(UPLOAD_DIR, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // 4. Prepare Python command (using relative path)
    const scriptPath = path.join(process.cwd(), 'app', 'api', 'upload', 'pdfScraper.py');
    const outputName = file.name.replace('.pdf', '');
    const command = `python "${scriptPath}" "${filePath}" "${outputName}"`;

    // 5. Execute Python script
    return new Promise<NextResponse>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        // Clean up the uploaded PDF after processing
        try { fs.unlinkSync(filePath); } catch {} 

        if (error || stderr) {
          console.error('Python Error:', error?.message || stderr);
          resolve(NextResponse.json(
            { error: 'PDF processing failed', details: stderr || error?.message },
            { status: 500 }
          ));
          return;
        }

        try {
          // Parse the Python script's JSON output
          // Check if CSV file was generated
          const csvPath = path.join(UPLOAD_DIR, `${outputName}.csv`);
          if (!fs.existsSync(csvPath)) {
            throw new Error('CSV output file not found');
          }

          // Return success with CSV data
          const csvData = fs.readFileSync(csvPath, 'utf8');
          resolve(NextResponse.json({
            success: true,
            data: csvData,
            downloadUrl: `/api/upload/download?file=${outputName}.csv`
          }));

        } catch (parseError) {
          console.error('Output Error:', parseError);
          reject(NextResponse.json(
            { error: 'Failed to process results', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
            { status: 500 }
          ));
        }
      });
    });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add this to handle CSV downloads
export async function GET(request: NextRequest) {
  try {
    const fileName = request.nextUrl.searchParams.get('file');
    if (!fileName) {
      return NextResponse.json(
        { error: 'File parameter missing' },
        { status: 400 }
      );
    }

    const filePath = path.join(UPLOAD_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const fileData = fs.readFileSync(filePath);
    return new NextResponse(fileData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });

  } catch (error) {
    console.error('Download Error:', error);
    return NextResponse.json(
      { error: 'File download failed' },
      { status: 500 }
    );
  }
}
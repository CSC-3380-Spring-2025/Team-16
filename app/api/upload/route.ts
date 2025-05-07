import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const UPLOAD_DIR = path.join(process.cwd(), 'app', 'api', 'upload', 'data');

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type');

  // Handle JSON-based manual entry export
  if (contentType?.includes('application/json')) {
    try {
      const body = await request.json();
      const outputPath = path.join(UPLOAD_DIR, 'manualEntries.json');
      fs.writeFileSync(outputPath, JSON.stringify(body.entries, null, 2));
      return NextResponse.json({ success: true });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to save manual entries' }, { status: 500 });
    }
  }

  // Handle file upload (PDF)
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const filePath = path.join(UPLOAD_DIR, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const scriptPath = path.join(process.cwd(), 'app', 'api', 'upload', 'pdfScraper.py');
    const outputName = file.name.replace('.pdf', '');
    const command = `python "${scriptPath}" "${filePath}" "${outputName}"`;

    return new Promise<NextResponse>((resolve) => {
      exec(command, (error, stdout, stderr) => {
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
          const jsonPath = path.join(UPLOAD_DIR, `${outputName}.json`);
          if (!fs.existsSync(jsonPath)) throw new Error('JSON output file not found');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          resolve(NextResponse.json({
            success: true,
            data: jsonData
          }));
        } catch (parseError) {
          console.error('Output Error:', parseError);
          resolve(NextResponse.json(
            { error: 'Failed to process results', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
            { status: 500 }
          ));
        }
      });
    });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const fileName = request.nextUrl.searchParams.get('file');
    const catalogParam = request.nextUrl.searchParams.get('catalog');

    if (catalogParam === 'true') {
      const catalogPath = path.join(UPLOAD_DIR, '..', 'finTest.json');
      const catalogData = fs.readFileSync(catalogPath, 'utf8');
      return NextResponse.json(JSON.parse(catalogData));
    }

    if (!fileName) {
      return NextResponse.json({ error: 'File parameter missing' }, { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileData = fs.readFileSync(filePath);
    return new NextResponse(fileData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });

  } catch (error) {
    console.error('Download or catalog error:', error);
    return NextResponse.json({ error: 'GET route failed' }, { status: 500 });
  }
}

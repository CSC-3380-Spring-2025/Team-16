import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Get verification codes from the Python script
const verificationCodes: { [email: string]: string } = {};

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  const scriptPath = path.join(process.cwd(), 'app', 'api', 'login', 'emailVerification.py');

  return new Promise((resolve) => {
    const py = spawn('python', [scriptPath, email]);
    let buffer = '';

    py.stdout.on('data', (data) => {
      buffer += data.toString();
    });

    py.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    py.on('close', (code) => {
      const match = buffer.match(/CODE_START:(\w+):CODE_END/);
      const plainCode = match?.[1];

      if (code === 0 && plainCode) {
        verificationCodes[email] = plainCode;
        resolve(NextResponse.json({ message: 'Verification code sent successfully' }));
      } else {
        resolve(NextResponse.json({ error: 'Email sending failed' }, { status: 500 }));
      }
    });
  });
}

export async function PUT(request: NextRequest) {
  const { email, encrypted } = await request.json();
  const storedCode = verificationCodes[email];

  if (!storedCode) {
    return NextResponse.json({ error: 'Code not found or expired' }, { status: 404 });
  }

  // Replace this with real encryption comparison later
  const isMatch = encrypted === storedCode;

  if (isMatch) {
    // Remove the code after successful verification
    delete verificationCodes[email]; 
    return NextResponse.json({ verified: true });
  } else {
    return NextResponse.json({ verified: false });
  }
}

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


   const filePath = path.join(UPLOAD_DIR, file.name);


   const buffer = Buffer.from(await file.arrayBuffer());
   fs.writeFileSync(filePath, buffer);


   const command = `python3 "../schedule-lsu/app/upload/pdfScraper.py" "${filePath}" "${file.name.replace('.pdf', '')}"`;


   return new Promise<NextResponse>((resolve, reject) => {
     exec(command, (error, stdout, stderr) => {
       if (error || stderr) {
         reject(`Error: ${error?.message || stderr}`);
       } else {
         // Read the CSV file after the Python script has finished
         const csvFilePath = path.join(UPLOAD_DIR, `${file.name.replace('.pdf', '')}.csv`);
         if (fs.existsSync(csvFilePath)) {
           const data = fs.readFileSync(csvFilePath, 'utf8');
           resolve(NextResponse.json({ data: data }));
         } else {
           reject('Failed to generate CSV data');
         }
       }
     });
   });


 } catch (error) {
   return NextResponse.json({ error: 'Server error' }, { status: 500 });
 }
}




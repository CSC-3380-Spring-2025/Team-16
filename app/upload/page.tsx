'use client'
import { useState } from 'react';
import Image from "next/image";


export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        if (result.data) {
          setCsvData(result.data);
          setError(null);
        } else {
          setError('No data to display.');
        }
      } else {
        setError('Error uploading the file.');
      }
    } catch (err) {
      setError('Error uploading the file.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="section-container flex items-center justify-center sm:flex-row gap-8" style={{ margin: 'auto' }}>
          <div className="flex flex-col items-center sm:flex-row" style={{ margin: "auto" }}>
            <Image
              src="/logo.svg"
              alt="ScheduleLSU logo"
              width={100}
              height={100}
              style={{ transform: 'rotate(90deg)' }}
              priority
            />
            <div style={{ height: 100 }} className="flex justify-center items-center text-lg lg:text-base h-10 font-[family-name:helvetica]">
              <p style={{ fontSize: "28px" }}>ScheduleLSU</p>
            </div>
          </div>
  
          <div className="font-[family-name:var(--font-geist-mono)] text-center">
            <p className="special-header text-lg m-4 text-center font-[family-name:var(--font-geist-mono)]">Upload Transcript</p>
            <p>Upload Your PDF:</p>
            <input
              type="file"
              onChange={handleFileChange}
              className="text-input-field mb-4 p-2 border border-gray-300 rounded-md"
            />
            <div className="text-center">
              <button
                onClick={handleFileUpload}
                className="button p-2 bg-blue-500 text-white rounded-md"
                disabled={loading}
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
          </div>
        </div>
  
        {/* CSV Output */}
        {csvData && (
          <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Transcript Data</h2>
            <div className="overflow-y-auto h-[50vh]">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{csvData}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

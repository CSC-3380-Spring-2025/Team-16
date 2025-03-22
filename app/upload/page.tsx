'use client'; 

import { useState } from 'react';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setFile(file);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data && !data.error) {
        setTableData(data); 
      } else {
        setError(data.error || 'Error processing file');
      }
    } catch (error) {
      setError('Error uploading file');
    } finally {
      setLoading(false);

    }
  };

  return (
    <div className="grid grid-rows-[auto_1fr] items-center justify-items-center min-h-screen p-4 gap-4 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-4 items-center sm:items-start w-full">
        {/* Header Section */}
        <div className="flex flex-col items-center sm:flex-row gap-2 mb-4">
          <div className="flex flex-col items-center sm:flex-row">
            <img
              src="/logo.svg"
              alt="ScheduleLSU logo"
              width={60}
              height={60}
              style={{ transform: 'rotate(90deg)' }}
              className="mb-1 sm:mb-0"
            />
            <div className="flex justify-center items-center">
              <p className="text-lg font-semibold">ScheduleLSU</p>
            </div>
          </div>
        </div>
  
        {/* File Upload Section */}
        <div className="font-[family-name:var(--font-geist-mono)] text-center mb-4">
          <p className="text-md mb-2 font-[family-name:var(--font-geist-mono)]">Upload Your PDF</p>
          <input
            type="file"
            onChange={handleFileChange}
            className="text-input-field mb-2 p-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleUpload}
            className="button p-2 bg-blue-500 text-white rounded-md"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
  
        {/* Table Display */}
        {tableData.length > 0 && (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full bg-white border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border-b">DEPT</th>
                  <th className="p-2 border-b">CRSE</th>
                  <th className="p-2 border-b">GR</th>
                  <th className="p-2 border-b">CARR</th>
                  <th className="p-2 border-b">EARN</th>
                  <th className="p-2 border-b">QPTS</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-2 border-b">{row.DEPT}</td>
                    <td className="p-2 border-b">{row.CRSE}</td>
                    <td className="p-2 border-b">{row.GR}</td>
                    <td className="p-2 border-b">{row.CARR}</td>
                    <td className="p-2 border-b">{row.EARN}</td>
                    <td className="p-2 border-b">{row.QPTS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default UploadPage;

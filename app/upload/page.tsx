'use client'


import { useState } from 'react';


export default function UploadPage() {
 const [file, setFile] = useState<File | null>(null);
 const [csvData, setCsvData] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);


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
         // If data is returned, display it
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
   <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
     <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
       <h1 className="text-2xl font-bold text-center mb-6 text-gray-700">Upload PDF</h1>


       {/* File Upload Section */}
       <div className="font-[family-name:var(--font-geist-mono)] text-center mb-4">
         <p className="text-md mb-2 font-[family-name:var(--font-geist-mono)]">Upload Your PDF</p>
         <input
           type="file"
           onChange={handleFileChange}
           className="text-input-field mb-2 p-2 border border-gray-300 rounded-md"
         />
         <button
           onClick={handleFileUpload}
           className="button p-2 bg-blue-500 text-white rounded-md"
           disabled={loading}
         >
           {loading ? 'Uploading...' : 'Upload'}
         </button>
         {error && <p className="text-red-500 mt-2">{error}</p>}
       </div>


       {/* CSV Data Display */}
       {csvData && (
         <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
           <h2 className="text-xl font-semibold text-gray-800 mb-4">CSV Data</h2>
           <div className="overflow-y-auto h-[50vh]">
             <pre className="text-sm text-gray-700 whitespace-pre-wrap">{csvData}</pre>
           </div>
         </div>
       )}
     </div>
   </div>
 );
}




import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      console.log("Uploading:", file.name);
      // Handle file upload logic here
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">ScheduleLSU</h1>
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Upload Your Transcript</h2>
          <Input type="file" onChange={handleFileChange} className="mb-4" />
          <Button onClick={handleUpload} className="w-full" disabled={!file}>
            Upload Transcript
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

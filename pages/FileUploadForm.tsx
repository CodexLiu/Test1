import React, { ChangeEvent, useCallback, useState } from 'react';
import axios, { AxiosProgressEvent } from 'axios';

interface FileUploadFormProps {}

const FileUploadForm: React.FC<FileUploadFormProps> = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [completedUploads, setCompletedUploads] = useState<number>(0);
  const [fileProgress, setFileProgress] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false); // Add a state variable to keep track of upload status

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(event.target.files);
      setFileProgress(new Array(event.target.files.length).fill(0));
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (selectedFiles) {
        setIsUploading(true); // Set upload status to "uploading"
        try {
          for (let i = 0; i < selectedFiles.length; i++) {
            const formData = new FormData();
            formData.append("pdf", selectedFiles[i]);
  
            await axios.post('http://35.91.178.131:4000/upload', formData, {
              onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                if (progressEvent.total) {
                  const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                  setFileProgress(prevFileProgress => {
                    const newFileProgress = [...prevFileProgress];
                    newFileProgress[i] = progress;
                    return newFileProgress;
                  });
                  setUploadProgress(fileProgress.reduce((a, b) => a + b, 0) / selectedFiles.length);
                }
              }
            });
  
            setCompletedUploads((prevCompletedUploads) => prevCompletedUploads + 1);
          }
  
          setUploadStatus('PDF file(s) uploaded to database successfully.');
        } catch (error) {
          setUploadStatus('An error occurred while uploading the PDF file(s)');
        } finally {
          setIsUploading(false); // Reset upload status
        }
  
        setSelectedFiles(null);
      }
    },
    [selectedFiles, completedUploads, fileProgress]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-center gap-4 py-4 border border-gray-300 rounded-md"
    >
      <h3 className="text-lg font-semibold mb-2">Upload Documents to Tidal Vision Database</h3>
      {uploadStatus && <p>{uploadStatus}</p>}
      {uploadProgress > 0 && (
        <div className="w-full h-2 bg-gray-300 rounded-md">
          <div
            className="h-2 bg-blue-600 rounded-md"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
      <div className="flex gap-4 items-center">
        <input
          type="file"
          id="file"
          name="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <label htmlFor="file" className="cursor-pointer text-blue-600">
          {selectedFiles ? `Selected ${selectedFiles.length} files` : 'Choose files'}
        </label>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          disabled={!selectedFiles}
        >
          Upload
        </button>
      </div>
      {isUploading ? "Uploading..." : "No Uploads in Progress"}
    </form>
  );
 };

 export default FileUploadForm;


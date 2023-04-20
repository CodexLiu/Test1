import React, { ChangeEvent, useCallback, useState } from 'react';

interface FileUploadFormProps {}

const FileUploadForm: React.FC<FileUploadFormProps> = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(event.target.files);
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (selectedFiles) {
        const formData = new FormData();
        formData.append('pdf', selectedFiles[0]);

        try {
          const response = await fetch('http://35.90.17.67:4000/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            setUploadStatus('PDF file(s) uploaded successfully!');
          } else {
            setUploadStatus('An error occurred while uploading the PDF file(s)');
          }
        } catch (error) {
          setUploadStatus('An error occurred while uploading the PDF file');
        }

        setSelectedFiles(null);
      }
    },
    [selectedFiles]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-center gap-4 py-4 border border-gray-300 rounded-md"
    >
      <h3 className="text-lg font-semibold mb-2">Upload Documents to Digestive Database</h3>
      {uploadStatus && <p>{uploadStatus}</p>}
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
    </form>
  );
};

export default FileUploadForm;

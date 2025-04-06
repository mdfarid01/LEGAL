import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  id: string;
  onChange: (file: File) => void;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  id, 
  onChange, 
  accept = '.pdf,.doc,.docx,image/*' 
}) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size <= 10 * 1024 * 1024) { // 10MB limit
        onChange(file);
      } else {
        alert('File size should not exceed 10MB');
      }
    }
  }, [onChange]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size <= 10 * 1024 * 1024) { // 10MB limit
        onChange(file);
      } else {
        alert('File size should not exceed 10MB');
        e.target.value = ''; // Reset input
      }
    }
  }, [onChange]);

  return (
    <div
      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-500 transition-colors"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="space-y-1 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="flex text-sm text-gray-600">
          <label
            htmlFor={id}
            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
          >
            <span>Upload a file</span>
            <input
              id={id}
              name={id}
              type="file"
              className="sr-only"
              accept={accept}
              onChange={handleFileChange}
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">
          PDF, DOC, DOCX, or images up to 10MB
        </p>
      </div>
    </div>
  );
};
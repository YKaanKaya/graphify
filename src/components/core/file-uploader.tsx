'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react'; // For delete icon

// Define accepted file types
const acceptedFileTypes = '.csv,.xlsx,.xls';

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  multiple?: boolean;
}

export function FileUploader({ onFileSelect, multiple = true }: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [dragActive, setDragActive] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Handle file selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Convert FileList to Array
    const filesArray = Array.from(files);
    processSelectedFiles(filesArray);
  };

  // Process the selected files
  const processSelectedFiles = (files: File[]) => {
    if (multiple) {
      setSelectedFiles(prev => {
        // Filter out duplicates by filename and size
        const newFiles = files.filter(newFile => 
          !prev.some(existingFile => 
            existingFile.name === newFile.name && existingFile.size === newFile.size
          )
        );
        return [...prev, ...newFiles];
      });
      onFileSelect(files);
    } else {
      // In single file mode, just replace the current file
      setSelectedFiles([files[0]]);
      onFileSelect([files[0]]);
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    // Convert FileList to Array
    const filesArray = Array.from(e.dataTransfer.files);
    processSelectedFiles(filesArray);
  };

  // Remove a single file
  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(file => 
      file.name !== fileToRemove.name || file.size !== fileToRemove.size
    ));
  };

  // Clear all files
  const removeAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div 
        className={`w-full border-2 border-dashed rounded-md p-6 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <Label 
            htmlFor="file-upload" 
            className="cursor-pointer text-center block font-medium"
          >
            {selectedFiles.length > 0 
              ? <span className="text-green-600">{selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected</span>
              : <>Drag and drop your file{multiple ? 's' : ''} here or <span className="text-blue-600 underline">browse</span></>
            }
          </Label>
          <p className="text-sm text-gray-500">(Supported formats: CSV, Excel)</p>
          <Input 
            id="file-upload" 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            onClick={(e) => e.currentTarget.value = ''}  // Reset file input on click
            accept={acceptedFileTypes}
            multiple={multiple}
            className="hidden" // Hide the default input
          />
        </div>
      </div>
      
      {/* File list display */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 border rounded-md overflow-hidden">
          <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
            <h3 className="font-medium">Selected Files</h3>
            {selectedFiles.length > 1 && (
              <button 
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={removeAllFiles}
              >
                Remove All
              </button>
            )}
          </div>
          <ul className="divide-y">
            {selectedFiles.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`} className="flex justify-between items-center p-2 hover:bg-gray-50">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB 
                    {file.type && ` • ${file.type}`}
                  </p>
                </div>
                <button 
                  type="button"
                  className="p-1 text-gray-500 hover:text-red-600"
                  onClick={() => removeFile(file)}
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 
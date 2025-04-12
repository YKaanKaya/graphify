import { ChangeEvent } from "react";

// Define the types of file formats we support
export type FileType = "csv" | "json";

export interface FilePreviewData {
  fileName: string;
  filePath: string;
  fileContent: string;
  fileSize: number;
  previewData: string[][];
  fileType: FileType;
}

export interface FileUploadResult {
  success: boolean;
  data?: FilePreviewData;
  error?: string;
}

/**
 * Validates the file type based on the provided expected type
 */
export function validateFileType(file: File, expectedType: FileType): boolean {
  if (expectedType === "csv") {
    return file.type === "text/csv" || file.name.endsWith(".csv");
  } else if (expectedType === "json") {
    return (
      file.type === "application/json" ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".jsonl")
    );
  }
  return false;
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Handles CSV file parsing and preview generation
 */
function handleCsvFile(content: string, delimiter: string = ","): string[][] {
  const lines = content.split("\n").filter(line => line.trim());
  return lines.slice(0, 5).map(line => line.split(delimiter));
}

/**
 * Handles JSON file parsing and preview generation
 */
function handleJsonFile(content: string): string[][] {
  try {
    // First try parsing as a single JSON object
    const parsed = JSON.parse(content);
    return [["Valid JSON detected", JSON.stringify(parsed, null, 2)]];
  } catch {
    // Try parsing as JSON Lines (one object per line)
    const lines = content.split("\n").filter(line => line.trim());
    const validLines = lines.filter(line => {
      try {
        JSON.parse(line);
        return true;
      } catch {
        return false;
      }
    });
    
    if (validLines.length > 0) {
      return validLines.slice(0, 3).map(line => {
        const parsed = JSON.parse(line);
        return [JSON.stringify(parsed, null, 2)];
      });
    }
    
    throw new Error("Invalid JSON format");
  }
}

/**
 * Processes a file upload event, validates the file, and generates preview data
 */
export function processFileUpload(
  e: ChangeEvent<HTMLInputElement>,
  fileType: FileType,
  delimiter?: string
): Promise<FileUploadResult> {
  return new Promise((resolve) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      resolve({ 
        success: false, 
        error: "No file selected" 
      });
      return;
    }
    
    // Validate file type
    if (!validateFileType(file, fileType)) {
      resolve({ 
        success: false, 
        error: `Please upload a valid ${fileType.toUpperCase()} file` 
      });
      return;
    }
    
    // Check file size (limit to 10MB for browser handling)
    if (file.size > 10 * 1024 * 1024) {
      resolve({ 
        success: false, 
        error: "File size should be less than 10MB" 
      });
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      let previewData: string[][] = [];
      
      try {
        if (fileType === "csv") {
          previewData = handleCsvFile(content, delimiter);
        } else if (fileType === "json") {
          previewData = handleJsonFile(content);
        }
        
        resolve({
          success: true,
          data: {
            fileName: file.name,
            filePath: file.name,
            fileContent: content,
            fileSize: file.size,
            previewData,
            fileType
          }
        });
      } catch (error) {
        resolve({ 
          success: false, 
          error: `Invalid ${fileType.toUpperCase()} format: ${error instanceof Error ? error.message : String(error)}` 
        });
      }
    };
    
    reader.onerror = () => {
      resolve({ 
        success: false, 
        error: "Error reading file" 
      });
    };
    
    reader.readAsText(file);
  });
}

/**
 * Reprocesses a CSV file with a new delimiter
 */
export function reprocessCsvWithDelimiter(
  fileContent: string, 
  delimiter: string
): string[][] {
  if (!fileContent) return [];
  
  try {
    return handleCsvFile(fileContent, delimiter);
  } catch (error) {
    console.error("Error reprocessing CSV:", error);
    return [];
  }
}

/**
 * Tests a connection to a file by validating its content
 */
export function testFileConnection(fileContent?: string): boolean {
  return !!fileContent && fileContent.trim().length > 0;
} 
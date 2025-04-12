// Define the types of database sources we support
export type SourceType = 
  | "postgresql"
  | "mysql"
  | "sqlserver"
  | "oracle"
  | "csv"
  | "json";

// Interface for a source connection
export interface SourceConnection {
  id: string;
  name: string;
  type: SourceType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  filePath?: string;
  fileName?: string;
  fileContent?: string;
  fileSize?: number;
  connectionStatus?: "connected" | "failed" | "unknown";
  lastTested?: Date;
  instance?: string;
  serviceName?: string;
  ssl?: boolean;
  delimiter?: string;
  hasHeader?: boolean;
  previewData?: string[][];
} 
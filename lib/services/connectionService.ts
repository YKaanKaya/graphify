import { SourceType } from "@/app/connections/sources/types";

interface ConnectionTestResult {
  success: boolean;
  timestamp: Date;
}

/**
 * Get the default port for a database type
 */
export function getDefaultPortForDatabase(type: string): number | undefined {
  switch (type) {
    case "postgresql":
      return 5432;
    case "mysql":
      return 3306;
    case "sqlserver":
      return 1433;
    case "oracle":
      return 1521;
    default:
      return undefined;
  }
}

/**
 * Mock function to test database connection
 * In a real implementation, this would make an API call to test the connection
 */
export function testDatabaseConnection(
  type: SourceType,
  host?: string,
  port?: number,
  database?: string,
  username?: string,
  password?: string,
  options?: { instance?: string; serviceName?: string; ssl?: boolean }
): Promise<ConnectionTestResult> {
  return new Promise((resolve) => {
    // In a real app, this would actually test the connection to the database
    // For now, we'll just return a random success/failure
    setTimeout(() => {
      resolve({
        success: Math.random() > 0.3, // 70% chance of success
        timestamp: new Date()
      });
    }, 500); // Simulate network delay
  });
}

/**
 * Validates that all required fields are provided for a database connection
 */
export function validateDatabaseConnection(
  type: SourceType,
  host?: string,
  database?: string
): boolean {
  // All database types require a host
  if (!host) return false;
  
  // SQL Server doesn't require a database name (can use default)
  if (type === "sqlserver") return true;
  
  // Other database types require a database name
  return !!database;
} 
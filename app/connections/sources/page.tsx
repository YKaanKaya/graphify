"use client";

import { useState, useRef, ChangeEvent } from "react";
import { ArrowLeft, Check, Database, Plus, RefreshCw, Search, X, Upload, File, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  FileType, 
  processFileUpload, 
  formatFileSize, 
  reprocessCsvWithDelimiter, 
  testFileConnection 
} from "@/lib/services/fileUploadService";
import {
  getDefaultPortForDatabase,
  testDatabaseConnection,
  validateDatabaseConnection
} from "@/lib/services/connectionService";
import { SourceType, SourceConnection } from "./types";

export default function SourceConnectionsPage() {
  const [connections, setConnections] = useState<SourceConnection[]>([]);
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newConnection, setNewConnection] = useState<Partial<SourceConnection>>({
    type: "postgresql",
    name: "",
    port: 5432, // Default for PostgreSQL
  });
  
  // Filter connections based on search query
  const filteredConnections = connections.filter(conn => 
    conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.type.includes(searchQuery.toLowerCase())
  );

  // Function to add a new connection
  const handleAddConnection = () => {
    if (!newConnection.name) return;
    
    const connection: SourceConnection = {
      id: crypto.randomUUID(),
      name: newConnection.name,
      type: newConnection.type as SourceType,
      host: newConnection.host,
      port: newConnection.port,
      database: newConnection.database,
      username: newConnection.username,
      password: newConnection.password,
      filePath: newConnection.filePath,
      fileName: newConnection.fileName,
      fileContent: newConnection.fileContent,
      fileSize: newConnection.fileSize,
      connectionStatus: "unknown",
      instance: newConnection.instance,
      serviceName: newConnection.serviceName,
      ssl: newConnection.ssl,
      delimiter: newConnection.delimiter || ",",
      hasHeader: newConnection.hasHeader || true,
      previewData: newConnection.previewData,
    };
    
    setConnections([...connections, connection]);
    setIsAddingConnection(false);
    setNewConnection({ type: "postgresql", name: "", port: 5432 });
    setFileError(null);
  };

  // Function to test connection
  const handleTestConnection = async (connectionId: string) => {
    const connectionIndex = connections.findIndex(c => c.id === connectionId);
    if (connectionIndex === -1) return;
    
    const connection = connections[connectionIndex];
    
    // For CSV and JSON files, validate the uploaded file
    if (connection.type === "csv" || connection.type === "json") {
      // Use the service function to test the file connection
      const isConnected = testFileConnection(connection.fileContent);
      
      setConnections(conns => {
        const updatedConnections = [...conns];
        updatedConnections[connectionIndex] = {
          ...updatedConnections[connectionIndex],
          connectionStatus: isConnected ? "connected" : "failed",
          lastTested: new Date(),
        };
        return updatedConnections;
      });
      return;
    }
    
    // For database connections, use the connection service
    try {
      const result = await testDatabaseConnection(
        connection.type,
        connection.host,
        connection.port,
        connection.database,
        connection.username,
        connection.password,
        {
          instance: connection.instance,
          serviceName: connection.serviceName,
          ssl: connection.ssl
        }
      );
      
      setConnections(conns => {
        const updatedConnections = [...conns];
        updatedConnections[connectionIndex] = {
          ...updatedConnections[connectionIndex],
          connectionStatus: result.success ? "connected" : "failed",
          lastTested: result.timestamp,
        };
        return updatedConnections;
      });
    } catch (error) {
      setConnections(conns => {
        const updatedConnections = [...conns];
        updatedConnections[connectionIndex] = {
          ...updatedConnections[connectionIndex],
          connectionStatus: "failed",
          lastTested: new Date(),
        };
        return updatedConnections;
      });
    }
  };

  // Function to delete a connection
  const handleDeleteConnection = (connectionId: string) => {
    setConnections(connections.filter(c => c.id !== connectionId));
  };

  // Update port when database type changes
  const handleSourceTypeChange = (type: string) => {
    const defaultPort = getDefaultPortForDatabase(type);
    
    setNewConnection({
      ...newConnection,
      type: type as SourceType,
      port: defaultPort,
    });
  };

  // Handle file selection for CSV and JSON
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    
    // Use the file upload service to process the file
    const fileType = newConnection.type as FileType;
    const result = await processFileUpload(e, fileType, newConnection.delimiter);
    
    if (!result.success) {
      setFileError(result.error || "Error uploading file");
      return;
    }
    
    if (result.data) {
      setNewConnection({
        ...newConnection,
        fileName: result.data.fileName,
        filePath: result.data.filePath,
        fileContent: result.data.fileContent,
        fileSize: result.data.fileSize,
        previewData: result.data.previewData,
      });
    }
  };

  // Function to toggle preview
  const togglePreview = () => {
    setIsPreviewVisible(!isPreviewVisible);
  };

  // Handle delimiter change
  const handleDelimiterChange = (delimiter: string) => {
    setNewConnection({...newConnection, delimiter});
    
    // Reprocess the file with the new delimiter if there's content
    if (newConnection.fileContent) {
      const newPreviewData = reprocessCsvWithDelimiter(newConnection.fileContent, delimiter);
      setNewConnection(prev => ({
        ...prev,
        previewData: newPreviewData
      }));
    }
  };

  // Check if form is valid for adding a connection
  const isAddConnectionDisabled = () => {
    if (!newConnection.name) return true;
    
    if (["postgresql", "mysql", "sqlserver", "oracle"].includes(newConnection.type || "")) {
      return !validateDatabaseConnection(
        newConnection.type as SourceType,
        newConnection.host,
        newConnection.database
      );
    }
    
    return !newConnection.fileContent;
  };

  return (
    <div className="bg-background text-foreground animate-appear">
      <div className="max-w-container pt-6 pb-12">
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4 p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold">Source Connections</h1>
        </div>

        {/* Search and Add section */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search connections..."
              className="pl-10 pr-4 py-2 w-full rounded-md border border-input bg-background placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddingConnection(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Connection
          </Button>
        </div>

        {/* Connection list */}
        {filteredConnections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnections.map((connection) => (
              <div key={connection.id} className="border rounded-lg p-4 bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow animate-appear-zoom">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {connection.type === "csv" || connection.type === "json" ? (
                      <File className="h-5 w-5 text-primary" />
                    ) : (
                      <Database className="h-5 w-5 text-primary" />
                    )}
                    <h3 className="font-medium">{connection.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {connection.type}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  {connection.host && (
                    <p>Host: {connection.host}{connection.port ? `:${connection.port}` : ""}</p>
                  )}
                  {connection.database && <p>Database: {connection.database}</p>}
                  {connection.instance && <p>Instance: {connection.instance}</p>}
                  {connection.serviceName && <p>Service Name: {connection.serviceName}</p>}
                  {connection.username && <p>Username: {connection.username}</p>}
                  {connection.fileName && <p>File: {connection.fileName}</p>}
                  {connection.fileSize && <p>Size: {formatFileSize(connection.fileSize)}</p>}
                  {connection.delimiter && <p>Delimiter: "{connection.delimiter}"</p>}
                  {connection.hasHeader !== undefined && <p>Has Header: {connection.hasHeader ? "Yes" : "No"}</p>}
                  {connection.ssl && <p className="flex items-center gap-1">SSL/TLS: <span className="text-green-600">Enabled</span></p>}
                  
                  {connection.connectionStatus && (
                    <div className="flex items-center gap-2 mt-3">
                      <span>Status:</span>
                      {connection.connectionStatus === "connected" ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Connected
                        </span>
                      ) : connection.connectionStatus === "failed" ? (
                        <span className="text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          Failed
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not tested</span>
                      )}
                    </div>
                  )}
                  
                  {connection.lastTested && (
                    <p className="text-xs text-muted-foreground">
                      Last tested: {connection.lastTested.toLocaleString()}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button
                    onClick={() => handleTestConnection(connection.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Test Connection
                  </Button>
                  {(connection.type === "csv" || connection.type === "json") && connection.previewData && (
                    <Button
                      onClick={() => {
                        setIsPreviewVisible(true);
                        setNewConnection({
                          ...connection,
                          previewData: connection.previewData
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Preview Data
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteConnection(connection.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-accent/50 rounded-lg animate-appear">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">No connections found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "No connections match your search criteria" 
                : "Add your first database or file connection to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsAddingConnection(true)}
                className="inline-flex items-center gap-2"
                variant="default"
              >
                <Plus className="h-4 w-4" />
                Add Connection
              </Button>
            )}
          </div>
        )}

        {/* Add connection modal */}
        {isAddingConnection && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-appear-zoom">
            <div className="bg-card text-card-foreground rounded-lg border shadow-lg p-6 max-w-md w-full my-auto">
              <h2 className="text-xl font-semibold mb-4">Add Source Connection</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Connection Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-primary focus:border-primary"
                    placeholder={`My ${
                      newConnection.type === "postgresql" ? "PostgreSQL" :
                      newConnection.type === "mysql" ? "MySQL" :
                      newConnection.type === "sqlserver" ? "SQL Server" :
                      newConnection.type === "oracle" ? "Oracle" :
                      newConnection.type === "csv" ? "CSV File" :
                      newConnection.type === "json" ? "JSON" : ""
                    } Database`}
                    value={newConnection.name}
                    onChange={(e) => setNewConnection({...newConnection, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Source Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-primary focus:border-primary"
                    value={newConnection.type}
                    onChange={(e) => handleSourceTypeChange(e.target.value)}
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="sqlserver">SQL Server</option>
                    <option value="oracle">Oracle</option>
                    <option value="csv">CSV File</option>
                    <option value="json">JSON Lines</option>
                  </select>
                </div>
                
                {/* Conditional fields based on the selected type */}
                {["postgresql", "mysql", "sqlserver", "oracle"].includes(newConnection.type || "") ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Host
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-primary focus:border-primary"
                          placeholder={newConnection.type === "postgresql" ? "localhost or postgres.example.com" : 
                                      newConnection.type === "mysql" ? "localhost or mysql.example.com" : 
                                      newConnection.type === "sqlserver" ? "localhost or sqlserver.example.com" : 
                                      "localhost or oracle.example.com"}
                          value={newConnection.host || ""}
                          onChange={(e) => setNewConnection({...newConnection, host: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Port
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-primary focus:border-primary"
                          value={newConnection.port || ""}
                          onChange={(e) => setNewConnection({...newConnection, port: parseInt(e.target.value) || undefined})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {newConnection.type === "sqlserver" ? "Database Name (Optional)" : "Database Name"}
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-primary focus:border-primary"
                        placeholder={newConnection.type === "postgresql" ? "postgres" : 
                                    newConnection.type === "mysql" ? "mysql" : 
                                    newConnection.type === "sqlserver" ? "master (or leave blank for default)" : 
                                    "ORCL"}
                        value={newConnection.database || ""}
                        onChange={(e) => setNewConnection({...newConnection, database: e.target.value})}
                      />
                    </div>
                    
                    {newConnection.type === "sqlserver" && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Instance Name (Optional)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-primary focus:border-primary"
                          placeholder="MSSQLSERVER"
                          value={newConnection.instance || ""}
                          onChange={(e) => setNewConnection({...newConnection, instance: e.target.value})}
                        />
                      </div>
                    )}
                    
                    {newConnection.type === "oracle" && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Service Name / SID
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-primary focus:border-primary"
                          placeholder="ORCL"
                          value={newConnection.serviceName || ""}
                          onChange={(e) => setNewConnection({...newConnection, serviceName: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use Service Name for Oracle 12c+ or SID for earlier versions
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-primary focus:border-primary"
                        placeholder={newConnection.type === "postgresql" ? "postgres" : 
                                    newConnection.type === "mysql" ? "root" : 
                                    newConnection.type === "sqlserver" ? "sa" : 
                                    "system"}
                        value={newConnection.username || ""}
                        onChange={(e) => setNewConnection({...newConnection, username: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-primary focus:border-primary"
                        placeholder="••••••••"
                        value={newConnection.password || ""}
                        onChange={(e) => setNewConnection({...newConnection, password: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="ssl"
                        className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={newConnection.ssl || false}
                        onChange={(e) => setNewConnection({...newConnection, ssl: e.target.checked})}
                      />
                      <label htmlFor="ssl" className="text-sm font-medium">
                        Enable SSL/TLS
                      </label>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Upload {newConnection.type?.toUpperCase()} File
                    </label>
                    
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-input rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="flex text-sm text-muted-foreground">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-background rounded-md font-medium text-primary hover:text-primary/80">
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept={newConnection.type === "csv" ? ".csv,text/csv" : ".json,.jsonl,application/json"}
                              onChange={handleFileUpload}
                              ref={fileInputRef}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {newConnection.type === "csv" ? "CSV up to 10MB" : "JSON or JSON Lines up to 10MB"}
                        </p>
                      </div>
                    </div>
                    
                    {fileError && (
                      <p className="mt-2 text-sm text-destructive">{fileError}</p>
                    )}
                    
                    {newConnection.fileName && (
                      <div className="mt-3 p-3 bg-accent/30 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <File className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{newConnection.fileName}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatFileSize(newConnection.fileSize)}</span>
                        </div>
                        
                        {newConnection.type === "csv" && newConnection.previewData && newConnection.previewData.length > 0 && (
                          <div className="mt-2">
                            <button 
                              onClick={togglePreview}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              {isPreviewVisible ? "Hide Preview" : "Show Preview"}
                            </button>
                            
                            {isPreviewVisible && (
                              <div className="mt-2 overflow-x-auto text-xs">
                                <table className="w-full border-collapse">
                                  <tbody>
                                    {newConnection.previewData.slice(0, 5).map((row, rowIndex) => (
                                      <tr key={rowIndex} className={rowIndex === 0 && newConnection.hasHeader ? "font-medium bg-accent/50" : ""}>
                                        {row.map((cell, cellIndex) => (
                                          <td key={cellIndex} className="border border-input p-1 truncate max-w-[100px]">
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {newConnection.type === "json" && newConnection.previewData && newConnection.previewData.length > 0 && (
                          <div className="mt-2">
                            <button 
                              onClick={togglePreview}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              {isPreviewVisible ? "Hide Preview" : "Show Preview"}
                            </button>
                            
                            {isPreviewVisible && (
                              <div className="mt-2 overflow-x-auto">
                                <pre className="text-xs bg-accent/20 p-2 rounded max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                                  {newConnection.previewData[0][0]}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {newConnection.type === "csv" && (
                      <>
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-1">
                            Delimiter
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-primary focus:border-primary"
                            placeholder=","
                            maxLength={1}
                            value={newConnection.delimiter || ""}
                            onChange={(e) => handleDelimiterChange(e.target.value)}
                          />
                        </div>
                        
                        <div className="mt-3 flex items-center">
                          <input
                            type="checkbox"
                            id="hasHeader"
                            className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={newConnection.hasHeader || false}
                            onChange={(e) => setNewConnection({...newConnection, hasHeader: e.target.checked})}
                          />
                          <label htmlFor="hasHeader" className="text-sm font-medium">
                            Has Header Row
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingConnection(false);
                    setFileError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddConnection}
                  disabled={isAddConnectionDisabled()}
                >
                  Add Connection
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Data preview modal */}
        {isPreviewVisible && newConnection.previewData && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-appear-zoom">
            <div className="bg-card text-card-foreground rounded-lg border shadow-lg p-6 max-w-screen-lg w-full my-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Data Preview: {newConnection.fileName}</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsPreviewVisible(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {newConnection.type === "csv" ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      {newConnection.previewData.slice(0, 10).map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex === 0 && newConnection.hasHeader ? "font-medium bg-accent/50" : ""}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-input p-2 truncate max-w-[200px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <pre className="bg-accent/20 p-4 rounded max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                    {newConnection.previewData[0][0]}
                  </pre>
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setIsPreviewVisible(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
"use client";

import { useState } from "react";
import { ArrowLeft, Check, Database, Plus, RefreshCw, Search, X } from "lucide-react";
import Link from "next/link";

// Define the types of database sources we support
type SourceType = 
  | "postgresql"
  | "mysql"
  | "sqlserver"
  | "oracle"
  | "csv"
  | "json";

// Interface for a source connection
interface SourceConnection {
  id: string;
  name: string;
  type: SourceType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  filePath?: string;
  connectionStatus?: "connected" | "failed" | "unknown";
  lastTested?: Date;
  instance?: string;
  serviceName?: string;
  ssl?: boolean;
  delimiter?: string;
  hasHeader?: boolean;
}

export default function SourceConnectionsPage() {
  const [connections, setConnections] = useState<SourceConnection[]>([]);
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
      connectionStatus: "unknown",
      instance: newConnection.instance,
      serviceName: newConnection.serviceName,
      ssl: newConnection.ssl,
      delimiter: newConnection.delimiter,
      hasHeader: newConnection.hasHeader,
    };
    
    setConnections([...connections, connection]);
    setIsAddingConnection(false);
    setNewConnection({ type: "postgresql", name: "", port: 5432 });
  };

  // Function to test connection
  const handleTestConnection = async (connectionId: string) => {
    // In a real app, this would make an API call to test the connection
    const connectionIndex = connections.findIndex(c => c.id === connectionId);
    if (connectionIndex === -1) return;
    
    // Mock testing a connection
    setConnections(conns => {
      const updatedConnections = [...conns];
      updatedConnections[connectionIndex] = {
        ...updatedConnections[connectionIndex],
        connectionStatus: Math.random() > 0.3 ? "connected" : "failed",
        lastTested: new Date(),
      };
      return updatedConnections;
    });
  };

  // Function to delete a connection
  const handleDeleteConnection = (connectionId: string) => {
    setConnections(connections.filter(c => c.id !== connectionId));
  };

  // Update port when database type changes
  const handleSourceTypeChange = (type: string) => {
    let defaultPort;
    switch (type) {
      case "postgresql":
        defaultPort = 5432;
        break;
      case "mysql":
        defaultPort = 3306;
        break;
      case "sqlserver":
        defaultPort = 1433;
        break;
      case "oracle":
        defaultPort = 1521;
        break;
      default:
        defaultPort = undefined;
    }

    setNewConnection({
      ...newConnection,
      type: type as SourceType,
      port: defaultPort,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Source Connections</h1>
      </div>

      {/* Search and Add section */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search connections..."
            className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAddingConnection(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Connection
        </button>
      </div>

      {/* Connection list */}
      {filteredConnections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConnections.map((connection) => (
            <div key={connection.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">{connection.name}</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                  {connection.type}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {connection.host && (
                  <p>Host: {connection.host}{connection.port ? `:${connection.port}` : ""}</p>
                )}
                {connection.database && <p>Database: {connection.database}</p>}
                {connection.instance && <p>Instance: {connection.instance}</p>}
                {connection.serviceName && <p>Service Name: {connection.serviceName}</p>}
                {connection.username && <p>Username: {connection.username}</p>}
                {connection.filePath && <p>File Path: {connection.filePath}</p>}
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
                      <span className="text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        Failed
                      </span>
                    ) : (
                      <span className="text-gray-600">Not tested</span>
                    )}
                  </div>
                )}
                
                {connection.lastTested && (
                  <p className="text-xs text-gray-500">
                    Last tested: {connection.lastTested.toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleTestConnection(connection.id)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  Test Connection
                </button>
                <button
                  onClick={() => handleDeleteConnection(connection.id)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-red-600 hover:bg-red-50"
                >
                  <X className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No connections found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery 
              ? "No connections match your search criteria" 
              : "Add your first database or file connection to get started"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsAddingConnection(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Connection
            </button>
          )}
        </div>
      )}

      {/* Add connection modal */}
      {isAddingConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Source Connection</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Host
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder={newConnection.type === "postgresql" ? "localhost or postgres.example.com" : 
                                    newConnection.type === "mysql" ? "localhost or mysql.example.com" : 
                                    newConnection.type === "sqlserver" ? "localhost or sqlserver.example.com" : 
                                    "localhost or oracle.example.com"}
                        value={newConnection.host || ""}
                        onChange={(e) => setNewConnection({...newConnection, host: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Port
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newConnection.port || ""}
                        onChange={(e) => setNewConnection({...newConnection, port: parseInt(e.target.value) || undefined})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {newConnection.type === "sqlserver" ? "Database Name (Optional)" : "Database Name"}
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instance Name (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="MSSQLSERVER"
                        value={newConnection.instance || ""}
                        onChange={(e) => setNewConnection({...newConnection, instance: e.target.value})}
                      />
                    </div>
                  )}
                  
                  {newConnection.type === "oracle" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Name / SID
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="ORCL"
                        value={newConnection.serviceName || ""}
                        onChange={(e) => setNewConnection({...newConnection, serviceName: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use Service Name for Oracle 12c+ or SID for earlier versions
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={newConnection.type === "postgresql" ? "postgres" : 
                                  newConnection.type === "mysql" ? "root" : 
                                  newConnection.type === "sqlserver" ? "sa" : 
                                  "system"}
                      value={newConnection.username || ""}
                      onChange={(e) => setNewConnection({...newConnection, username: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={newConnection.password || ""}
                      onChange={(e) => setNewConnection({...newConnection, password: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Credentials are securely encrypted before storage
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Path
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={newConnection.type === "csv" ? "/path/to/data.csv" : "/path/to/data.json"}
                    value={newConnection.filePath || ""}
                    onChange={(e) => setNewConnection({...newConnection, filePath: e.target.value})}
                  />
                  
                  {newConnection.type === "csv" && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CSV Options
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Delimiter
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-1 border border-gray-300 rounded-md"
                            placeholder=","
                            value={newConnection.delimiter || ""}
                            onChange={(e) => setNewConnection({...newConnection, delimiter: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Has Header
                          </label>
                          <select
                            className="w-full px-3 py-1 border border-gray-300 rounded-md"
                            value={newConnection.hasHeader ? "true" : "false"}
                            onChange={(e) => setNewConnection({
                              ...newConnection, 
                              hasHeader: e.target.value === "true"
                            })}
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Enter a local file path or upload a file
                  </p>
                  
                  <div className="mt-3">
                    <button
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Upload File
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Connection Format</h4>
              <p className="text-xs text-gray-600">
                {newConnection.type === "postgresql" && 
                  "postgresql://username:password@hostname:5432/database"}
                {newConnection.type === "mysql" && 
                  "mysql://username:password@hostname:3306/database"}
                {newConnection.type === "sqlserver" && 
                  "sqlserver://username:password@hostname:1433/database"}
                {newConnection.type === "oracle" && 
                  "oracle://username:password@hostname:1521/service_name"}
              </p>
            </div>

            <div className="mt-2">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={newConnection.ssl}
                  onChange={(e) => setNewConnection({...newConnection, ssl: e.target.checked})}
                />
                <span className="ml-2 text-sm text-gray-700">Use SSL/TLS for connection</span>
              </label>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddingConnection(false);
                  setNewConnection({ type: "postgresql", name: "", port: 5432 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConnection}
                disabled={!newConnection.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                Add Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import * as React from 'react';
import { ParsedData, NodeMapping, RelationshipMapping } from '../../types/mapping';
import { generateCypherQueries, generateGremlinQueries, generateJSONOutput } from '../../utils/export-utils';

interface ExportPanelProps {
  exportFormat: 'cypher' | 'gremlin' | 'json';
  onExportFormatChange: (format: 'cypher' | 'gremlin' | 'json') => void;
  exportContent: string;
  isExporting: boolean;
  error: string;
}

export function ExportPanel({ 
  exportFormat, 
  onExportFormatChange, 
  exportContent, 
  isExporting, 
  error 
}: ExportPanelProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleCopyToClipboard = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      document.execCommand('copy');
      // Optional: Show a success message
      alert('Copied to clipboard!');
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const fileExtension = exportFormat === 'json' ? 'json' : exportFormat === 'gremlin' ? 'groovy' : 'cypher';
    const file = new Blob([exportContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `export.${fileExtension}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="text-lg font-semibold">Export Graph Data</h3>
      
      <div className="flex border-b">
        <button
          className={`py-2 px-4 font-medium ${exportFormat === 'cypher' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => onExportFormatChange('cypher')}
        >
          Cypher (Neo4j)
        </button>
        <button
          className={`py-2 px-4 font-medium ${exportFormat === 'gremlin' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => onExportFormatChange('gremlin')}
        >
          Gremlin
        </button>
        <button
          className={`py-2 px-4 font-medium ${exportFormat === 'json' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => onExportFormatChange('json')}
        >
          JSON
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <h4 className="font-medium">{exportFormat === 'cypher' ? 'Neo4j Cypher Queries' : exportFormat === 'gremlin' ? 'Gremlin Queries' : 'JSON Graph Data'}</h4>
          <div className="space-x-2">
            <button 
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              onClick={handleCopyToClipboard}
              disabled={isExporting || !exportContent}
            >
              Copy
            </button>
            <button 
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              onClick={handleDownload}
              disabled={isExporting || !exportContent}
            >
              Download
            </button>
          </div>
        </div>
        
        {isExporting ? (
          <div className="w-full h-64 p-2 border rounded flex items-center justify-center">
            <p className="text-gray-500">Generating export...</p>
          </div>
        ) : error ? (
          <div className="w-full h-64 p-2 border rounded flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="w-full h-64 p-2 border rounded font-mono text-sm"
            value={exportContent}
            readOnly
          />
        )}
        
        <div className="text-sm text-gray-600">
          {exportFormat === 'cypher' && (
            <p>Use these Cypher queries in Neo4j Browser or Neo4j Cypher Shell to create your graph.</p>
          )}
          {exportFormat === 'gremlin' && (
            <p>Use these Gremlin queries in a TinkerPop-compatible graph database like JanusGraph, Amazon Neptune, or Azure Cosmos DB.</p>
          )}
          {exportFormat === 'json' && (
            <p>This JSON format can be used with various graph import tools or for visualization libraries.</p>
          )}
        </div>
      </div>
    </div>
  );
} 
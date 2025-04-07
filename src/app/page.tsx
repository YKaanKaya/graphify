'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { FileUploader } from "../components/core/file-uploader";
import { parse as parseCsv } from 'papaparse';
import * as XLSX from 'xlsx';
import { Loader2 } from 'lucide-react';
import { MappingConfigurator } from '../components/core/mapping-configurator';
import { ExportPanel } from '../components/core/export-panel';
import { ParsedData, NodeMapping, RelationshipMapping, DatasetInfo, DatasetRef } from "../types/mapping";
import { generateCypherQueries, generateJSONOutput, generateGremlinQueries } from '../utils/export-utils';

/**
 * Analyzes a dataset to suggest appropriate mapping configurations
 */
function detectMappingConfiguration(headers: string[], data: Record<string, string | number | boolean>[]): {
  nodeMapping: NodeMapping;
  relationshipMapping: RelationshipMapping;
} {
  // Default configuration
  const nodeMapping: NodeMapping = {
    idColumn: null,
    labelSource: 'static',
    labelColumn: null,
    staticLabel: 'Item',
    propertyColumns: [],
  };

  const relationshipMapping: RelationshipMapping = {
    sourceRef: {
      datasetId: null,
      column: null
    },
    targetRef: {
      datasetId: null,
      column: null
    },
    relationshipTypeSource: 'static',
    relationshipTypeColumn: null,
    staticRelationshipType: 'RELATES_TO',
    propertyColumns: [],
  };

  // Auto-detection logic
  if (headers.length > 0) {
    // Look for common ID columns
    const idCandidates = ['id', 'uuid', 'key', 'show_id', '_id', 'nodeId'];
    const foundIdHeader = headers.find(h => 
      idCandidates.includes(h.toLowerCase()) || 
      h.toLowerCase().includes('id') || 
      h.toLowerCase().includes('key')
    );
    
    if (foundIdHeader) {
      nodeMapping.idColumn = foundIdHeader;
    } else {
      // Use the first column as ID if no obvious ID column
      nodeMapping.idColumn = headers[0];
    }

    // Look for potential label columns
    const labelCandidates = ['type', 'category', 'label', 'class', 'name', 'title'];
    const foundLabelHeader = headers.find(h => 
      labelCandidates.includes(h.toLowerCase()) || 
      h.toLowerCase().includes('type') || 
      h.toLowerCase().includes('category') ||
      h.toLowerCase().includes('name') ||
      h.toLowerCase().includes('title')
    );
    
    if (foundLabelHeader) {
      nodeMapping.labelSource = 'column';
      nodeMapping.labelColumn = foundLabelHeader;
      // Use the data to suggest an appropriate static label
      if (data.length > 0 && foundLabelHeader in data[0]) {
        const firstLabel = data[0][foundLabelHeader];
        if (typeof firstLabel === 'string') {
          nodeMapping.staticLabel = firstLabel;
        }
      }
    }
    
    // Set all other columns as properties (except ID and label)
    nodeMapping.propertyColumns = headers.filter(h => 
      h !== nodeMapping.idColumn && 
      (nodeMapping.labelSource !== 'column' || h !== nodeMapping.labelColumn)
    );

    // For relationship mapping, try to find columns that might be references to other entities
    const refCandidates = headers.filter(h => 
      h.toLowerCase().includes('ref') || 
      h.toLowerCase().includes('parent') || 
      h.toLowerCase().includes('child') ||
      h.toLowerCase().includes('source') ||
      h.toLowerCase().includes('target') ||
      h.toLowerCase().includes('related') ||
      h.toLowerCase().includes('link')
    );

    if (refCandidates.length >= 1) {
      relationshipMapping.sourceRef.column = nodeMapping.idColumn;
      relationshipMapping.targetRef.column = refCandidates[0];
      
      // Determine relationship type based on column names
      if (refCandidates[0].toLowerCase().includes('parent')) {
        relationshipMapping.staticRelationshipType = 'CHILD_OF';
      } else if (refCandidates[0].toLowerCase().includes('director')) {
        relationshipMapping.staticRelationshipType = 'DIRECTED_BY';
      } else if (refCandidates[0].toLowerCase().includes('cast')) {
        relationshipMapping.staticRelationshipType = 'ACTED_IN';
      } else if (refCandidates[0].toLowerCase().includes('country')) {
        relationshipMapping.staticRelationshipType = 'LOCATED_IN';
      }
    } else if (headers.length > 1) {
      // If no obvious reference columns, use first and second columns
      relationshipMapping.sourceRef.column = nodeMapping.idColumn;
      // Find a second column that's not the ID column
      const secondColumn = headers.find(h => h !== nodeMapping.idColumn);
      if (secondColumn) {
        relationshipMapping.targetRef.column = secondColumn;
      }
    }
  }

  return { nodeMapping, relationshipMapping };
}

// Function to parse CSV files
async function parseCsvFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    parseCsv<Record<string, string | number | boolean>>(file, {
      header: true,       // Treat the first row as headers
      skipEmptyLines: true,
      dynamicTyping: true, // Automatically convert numbers/booleans
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV Parsing errors:", results.errors);
          // Even with errors, might still have partial data
          // reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
        }
        if (!results.meta.fields) {
          return reject(new Error('Could not detect headers in CSV file.'));
        }
        resolve({
          headers: results.meta.fields,
          rows: results.data
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Function to parse Excel files
async function parseExcelFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryString = event.target?.result;
        if (!binaryString) throw new Error("Failed to read file");

        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON array of objects, use header: 1 for array of arrays
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number | boolean>>(worksheet, { header: undefined, defval: "" });
        
        if (jsonData.length === 0) {
            return reject(new Error('Excel sheet appears to be empty or has no data.'));
        }

        // Infer headers from the keys of the first row object
        const headers = Object.keys(jsonData[0]);

        resolve({
          headers: headers,
          rows: jsonData
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(new Error("Failed to read file for Excel parsing"));
    };
    reader.readAsBinaryString(file);
  });
}

// Memoized files tab component to prevent re-renders
const DatasetTabs = React.memo(({ 
  datasets, 
  activeDatasetId, 
  onDatasetChange 
}: { 
  datasets: DatasetInfo[]; 
  activeDatasetId: string | null; 
  onDatasetChange: (id: string) => void;
}) => (
  <div className="border-b">
    <div className="flex overflow-x-auto">
      {datasets.map(ds => (
        <button
          key={ds.id}
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            ds.id === activeDatasetId 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => onDatasetChange(ds.id)}
        >
          {ds.fileName}
        </button>
      ))}
    </div>
  </div>
));

// Memoized MappingConfigurator component to prevent unnecessary rerenders
const MemoizedMappingConfigurator = React.memo(MappingConfigurator);

export default function Home() {
  // State for all uploaded datasets
  const [datasets, setDatasets] = React.useState<DatasetInfo[]>([]);
  // Currently active dataset
  const [activeDatasetId, setActiveDatasetId] = React.useState<string | null>(null);
  
  // Current mappings
  const [nodeMapping, setNodeMapping] = React.useState<NodeMapping | null>(null);
  const [relationshipMapping, setRelationshipMapping] = React.useState<RelationshipMapping | null>(null);

  // State for export format and content
  const [exportFormat, setExportFormat] = React.useState<'cypher' | 'gremlin' | 'json'>('cypher');
  const [exportContent, setExportContent] = React.useState<string>('');
  const [isExporting, setIsExporting] = React.useState<boolean>(false);
  const [exportError, setExportError] = React.useState<string>('');

  // Get the active dataset
  const activeDataset = React.useMemo(() => {
    return datasets.find(d => d.id === activeDatasetId) || null;
  }, [datasets, activeDatasetId]);

  // Transform datasets to DatasetRef format for the MappingConfigurator
  const datasetRefs = React.useMemo<DatasetRef[]>(() => {
    return datasets.map(dataset => ({
      id: dataset.id,
      fileName: dataset.fileName,
      headers: dataset.data.headers
    }));
  }, [datasets]);

  // Handle file selection
  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    
    // Process each file one by one
    for (const file of files) {
      // Skip files that already exist in datasets by name and size
      const fileExists = datasets.some(ds => ds.fileName === file.name);
      if (fileExists) {
        console.log(`File ${file.name} already processed, skipping.`);
        continue;
      }
      
      try {
        console.log(`Processing file: ${file.name}`);
        
        // Parse the file
        let parsedData: ParsedData;
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          parsedData = await parseCsvFile(file);
        } else if (
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.name.endsWith('.xls') ||
          file.name.endsWith('.xlsx')
        ) {
          parsedData = await parseExcelFile(file);
        } else {
          console.warn(`Unsupported file type: ${file.name}`);
          continue; // Skip this file but continue with others
        }
        
        // Auto-detect mapping configuration
        const { nodeMapping: detectedNodeMapping, relationshipMapping: detectedRelationshipMapping } = detectMappingConfiguration(
          parsedData.headers, 
          parsedData.rows
        );
        
        // Create a unique ID for this dataset
        const datasetId = `dataset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Add the new dataset
        const newDataset: DatasetInfo = {
          id: datasetId,
          fileName: file.name,
          data: parsedData,
          nodeMapping: detectedNodeMapping,
          relationshipMapping: detectedRelationshipMapping
        };
        
        setDatasets(prev => [...prev, newDataset]);
        
        // Set this as the active dataset if it's the first one
        if (!activeDatasetId) {
          setActiveDatasetId(datasetId);
        }
        
        setNodeMapping(detectedNodeMapping);
        setRelationshipMapping(detectedRelationshipMapping);
        console.log(`File ${file.name} processed successfully.`);
      } catch (err: any) {
        console.error(`Error processing file ${file.name}:`, err);
        setExportError(`Error processing ${file.name}: ${err.message || 'Unknown error'}`);
      }
    }
  };

  // Auto-configure mappings when active dataset changes
  React.useEffect(() => {
    if (activeDataset) {
      console.log('Initializing mappings for dataset:', activeDataset.fileName);
      const headers = activeDataset.data.headers;
      
      // Create default node mapping
      const defaultNodeMapping: NodeMapping = {
        idColumn: headers.length > 0 ? headers[0] : null,
        labelSource: 'static',
        labelColumn: null,
        staticLabel: 'Node',
        propertyColumns: [],
      };
      
      // Create default relationship mapping
      const defaultRelationshipMapping: RelationshipMapping = {
        sourceRef: {
          datasetId: activeDataset.id,
          column: headers.length > 0 ? headers[0] : null,
        },
        targetRef: {
          datasetId: activeDataset.id,
          column: headers.length > 1 ? headers[1] : null,
        },
        relationshipTypeSource: 'static',
        relationshipTypeColumn: null,
        staticRelationshipType: 'RELATES_TO',
        propertyColumns: [],
      };
      
      setNodeMapping(defaultNodeMapping);
      setRelationshipMapping(defaultRelationshipMapping);
    }
  }, [activeDataset]);

  // Handle node mapping changes
  const handleNodeMappingChange = React.useCallback((newMapping: NodeMapping) => {
    console.log('Node mapping updated:', newMapping);
    // Only update if there's a real change to prevent unnecessary re-renders
    setNodeMapping(prev => {
      if (prev && JSON.stringify(prev) === JSON.stringify(newMapping)) {
        return prev; // No change, return previous state
      }
      return newMapping;
    });
  }, []);

  // Handle relationship mapping changes
  const handleRelationshipMappingChange = React.useCallback((newMapping: RelationshipMapping) => {
    console.log('Relationship mapping updated:', newMapping);
    // Only update if there's a real change to prevent unnecessary re-renders
    setRelationshipMapping(prev => {
      if (prev && JSON.stringify(prev) === JSON.stringify(newMapping)) {
        return prev; // No change, return previous state
      }
      return newMapping;
    });
  }, []);

  // Generate graph export
  const handleGenerateExport = () => {
    if (!activeDataset || !nodeMapping || !relationshipMapping) {
      setExportError('Please upload data and configure mappings first');
      return;
    }

    setIsExporting(true);
    setExportError('');

    try {
      // Get a map of all datasets by ID for cross-file relationships
      const datasetsMap = new Map<string, DatasetInfo>();
      datasets.forEach(ds => datasetsMap.set(ds.id, ds));

      // Generate export content based on selected format
      let content = '';
      switch (exportFormat) {
        case 'cypher':
          content = generateCypherQueries(activeDataset.data, nodeMapping, relationshipMapping, datasetsMap);
          break;
        case 'gremlin':
          content = generateGremlinQueries(activeDataset.data, nodeMapping, relationshipMapping, datasetsMap);
          break;
        case 'json':
          content = generateJSONOutput(activeDataset.data, nodeMapping, relationshipMapping, datasetsMap);
          break;
      }

      setExportContent(content);
    } catch (error) {
      console.error('Export error:', error);
      setExportError(`Error generating export: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle changing datasets
  const handleDatasetChange = (datasetId: string) => {
    setActiveDatasetId(datasetId);
  };

  // Handle dataset deletion
  const handleDatasetDelete = (datasetId: string) => {
    setDatasets(prev => prev.filter(ds => ds.id !== datasetId));
    if (activeDatasetId === datasetId) {
      // Set the first available dataset as active, or null if none left
      setActiveDatasetId(datasets.length > 1 ? datasets.find(ds => ds.id !== datasetId)?.id || null : null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 md:p-24">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Graphify - Tabular Data to Graph</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Upload your CSV or Excel files to begin.</p>
          <FileUploader onFileSelect={handleFileSelect} multiple={true} />
          
          {isExporting && (
             <div className="flex items-center space-x-2 mt-4">
               <Loader2 className="h-5 w-5 animate-spin" />
               <span>Generating export...</span>
             </div>
          )}

          {exportError && (
            <p className="text-red-600 mt-4">Error: {exportError}</p>
          )}

          {datasets.length > 0 && (
            <div className="mt-4 space-y-6">
              {/* Dataset selection tabs */}
              <DatasetTabs 
                datasets={datasets} 
                activeDatasetId={activeDatasetId} 
                onDatasetChange={handleDatasetChange}
              />
              
              {/* Active dataset content */}
              {activeDataset && (
                <>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex justify-between items-center">
                      <p className="text-green-600 font-medium">{activeDataset.fileName}</p>
                      <button 
                        className="text-xs text-red-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDatasetDelete(activeDataset.id);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-sm mt-1">
                      Detected {activeDataset.data.headers.length} columns and {activeDataset.data.rows.length} rows.
                    </p>
                  </div>
                  
                  {activeDataset.nodeMapping && activeDataset.relationshipMapping && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-700 font-medium">✓ Automatic mapping configuration detected!</p>
                      <ul className="mt-2 text-sm">
                        <li><span className="font-medium">Node ID:</span> {activeDataset.nodeMapping.idColumn}</li>
                        <li>
                          <span className="font-medium">Node Label:</span> 
                          {activeDataset.nodeMapping.labelSource === 'column' 
                            ? `From column "${activeDataset.nodeMapping.labelColumn}"` 
                            : `Static "${activeDataset.nodeMapping.staticLabel}"`}
                        </li>
                        <li>
                          <span className="font-medium">Relationship:</span> 
                          {activeDataset.relationshipMapping.sourceRef.column} → 
                          {activeDataset.relationshipMapping.targetRef.column} 
                          ({activeDataset.relationshipMapping.staticRelationshipType})
                        </li>
                      </ul>
                    </div>
                  )}
                  
                  <MemoizedMappingConfigurator 
                    headers={activeDataset.data.headers}
                    data={activeDataset.data.rows}
                    availableDatasets={datasetRefs}
                    currentDatasetId={activeDataset.id}
                    initialNodeMapping={nodeMapping || undefined}
                    initialRelationshipMapping={relationshipMapping || undefined}
                    onNodeMappingChange={handleNodeMappingChange}
                    onRelationshipMappingChange={handleRelationshipMappingChange}
                  />
                  
                  <div className="flex justify-center">
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                      onClick={handleGenerateExport}
                    >
                      Generate Graph Database Queries
                    </button>
                  </div>
                  
                  {activeDataset.nodeMapping && activeDataset.relationshipMapping && (
                    <ExportPanel 
                      exportFormat={exportFormat}
                      onExportFormatChange={setExportFormat}
                      exportContent={exportContent}
                      isExporting={isExporting}
                      error={exportError}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

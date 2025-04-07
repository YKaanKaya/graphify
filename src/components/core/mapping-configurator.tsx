'use client';

import * as React from 'react';
import { ParsedData, NodeMapping, RelationshipMapping, DatasetRef } from '../../types/mapping';

interface MappingConfiguratorProps {
  headers: string[];
  data: ParsedData['rows'];
  // List of all available datasets for cross-file mapping
  availableDatasets: DatasetRef[];
  // Current dataset ID
  currentDatasetId: string;
  // Add initial values for auto-configured mappings
  initialNodeMapping?: NodeMapping;
  initialRelationshipMapping?: RelationshipMapping;
  // Add callbacks for when mappings change
  onNodeMappingChange?: (mapping: NodeMapping) => void;
  onRelationshipMappingChange?: (mapping: RelationshipMapping) => void;
}

export function MappingConfigurator({ 
  headers, 
  data,
  availableDatasets,
  currentDatasetId,
  initialNodeMapping,
  initialRelationshipMapping,
  onNodeMappingChange,
  onRelationshipMappingChange
}: MappingConfiguratorProps) {
  // Track whether changes are internal or from props
  const isInternalNodeUpdate = React.useRef(false);
  const isInternalRelationshipUpdate = React.useRef(false);
  
  // Initial state for node mappings, using provided initialNodeMapping if available
  const [nodeMapping, setNodeMapping] = React.useState<NodeMapping>(
    initialNodeMapping || {
      idColumn: headers.length > 0 ? headers[0] : null,
      labelSource: 'static',
      labelColumn: null,
      staticLabel: 'Node',
      propertyColumns: [],
    }
  );

  // Initial state for relationship mappings, using provided initialRelationshipMapping if available
  const [relationshipMapping, setRelationshipMapping] = React.useState<RelationshipMapping>(
    initialRelationshipMapping || {
      sourceRef: {
        datasetId: currentDatasetId,
        column: headers.length > 0 ? headers[0] : null,
      },
      targetRef: {
        datasetId: currentDatasetId,
        column: headers.length > 1 ? headers[1] : null,
      },
      relationshipTypeSource: 'static',
      relationshipTypeColumn: null,
      staticRelationshipType: 'RELATES_TO',
      propertyColumns: [],
    }
  );
  
  // Store previous props for comparison
  const prevInitialNodeMapping = React.useRef(initialNodeMapping);
  const prevInitialRelationshipMapping = React.useRef(initialRelationshipMapping);
  
  // Notify parent component when nodeMapping changes - only for internal updates
  React.useEffect(() => {
    if (onNodeMappingChange && isInternalNodeUpdate.current) {
      onNodeMappingChange(nodeMapping);
      isInternalNodeUpdate.current = false;
    }
  }, [nodeMapping, onNodeMappingChange]);
  
  // Notify parent component when relationshipMapping changes - only for internal updates
  React.useEffect(() => {
    if (onRelationshipMappingChange && isInternalRelationshipUpdate.current) {
      onRelationshipMappingChange(relationshipMapping);
      isInternalRelationshipUpdate.current = false;
    }
  }, [relationshipMapping, onRelationshipMappingChange]);
  
  // Update local state when initialNodeMapping changes
  React.useEffect(() => {
    // Only update if props have actually changed and are different from current state
    if (initialNodeMapping && 
        initialNodeMapping !== prevInitialNodeMapping.current &&
        JSON.stringify(initialNodeMapping) !== JSON.stringify(nodeMapping)) {
      setNodeMapping(initialNodeMapping);
      prevInitialNodeMapping.current = initialNodeMapping;
    }
  }, [initialNodeMapping, nodeMapping]);
  
  // Update local state when initialRelationshipMapping changes
  React.useEffect(() => {
    // Only update if props have actually changed and are different from current state
    if (initialRelationshipMapping && 
        initialRelationshipMapping !== prevInitialRelationshipMapping.current &&
        JSON.stringify(initialRelationshipMapping) !== JSON.stringify(relationshipMapping)) {
      setRelationshipMapping(initialRelationshipMapping);
      prevInitialRelationshipMapping.current = initialRelationshipMapping;
    }
  }, [initialRelationshipMapping, relationshipMapping]);

  // Function to update nodeMapping and notify parent
  const updateNodeMapping = (newMapping: Partial<NodeMapping>) => {
    isInternalNodeUpdate.current = true;
    const updatedMapping = { ...nodeMapping, ...newMapping };
    setNodeMapping(updatedMapping);
  };
  
  // Function to update relationshipMapping and notify parent
  const updateRelationshipMapping = (newMapping: Partial<RelationshipMapping>) => {
    isInternalRelationshipUpdate.current = true;
    const updatedMapping = { ...relationshipMapping, ...newMapping };
    setRelationshipMapping(updatedMapping);
  };

  // Get headers for a specific dataset
  const getDatasetHeaders = (datasetId: string | null): string[] => {
    if (!datasetId || datasetId === currentDatasetId) {
      return headers;
    }
    
    const dataset = availableDatasets.find(ds => ds.id === datasetId);
    return dataset ? dataset.headers : [];
  };

  // Get source dataset headers
  const sourceDatasetHeaders = React.useMemo(() => 
    getDatasetHeaders(relationshipMapping.sourceRef.datasetId), 
    [relationshipMapping.sourceRef.datasetId, currentDatasetId, headers, availableDatasets]
  );
  
  // Get target dataset headers
  const targetDatasetHeaders = React.useMemo(() => 
    getDatasetHeaders(relationshipMapping.targetRef.datasetId),
    [relationshipMapping.targetRef.datasetId, currentDatasetId, headers, availableDatasets]
  );

  return (
    <div className="space-y-6 p-4 border rounded-md">
      <h3 className="text-lg font-semibold">Configure Graph Mapping</h3>
      
      {/* Node Mapping Section */}
      <div className="space-y-4 p-4 border rounded-md">
        <h4 className="font-medium">Node Mapping</h4>
        <p className="text-sm text-gray-500">
          Define how table columns map to graph nodes (labels, IDs, properties).
        </p>
        
        {/* Node ID Column Selection */}
        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-2">
          <label htmlFor="node-id" className="font-medium">Node ID Column:</label>
          <select 
            id="node-id"
            className="w-full p-2 border rounded"
            value={nodeMapping.idColumn || ""}
            onChange={(e) => updateNodeMapping({idColumn: e.target.value})}
          >
            <option value="">Select ID column...</option>
            {headers.map(header => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
        </div>

        {/* Node Label Source Selection */}
        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-2">
          <div className="font-medium">Node Label:</div>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <input 
                type="radio" 
                id="label-from-column" 
                checked={nodeMapping.labelSource === 'column'}
                onChange={() => updateNodeMapping({labelSource: 'column'})}
              />
              <label htmlFor="label-from-column">From Column</label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="radio" 
                id="label-static" 
                checked={nodeMapping.labelSource === 'static'}
                onChange={() => updateNodeMapping({labelSource: 'static'})}
              />
              <label htmlFor="label-static">Static</label>
            </div>
          </div>
        </div>

        {/* Conditional Label Source UI */}
        {nodeMapping.labelSource === 'column' ? (
          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-2 pl-4">
            <label htmlFor="label-column" className="font-medium">Label Column:</label>
            <select 
              id="label-column"
              className="w-full p-2 border rounded"
              value={nodeMapping.labelColumn || ""}
              onChange={(e) => updateNodeMapping({labelColumn: e.target.value})}
            >
              <option value="">Select label column...</option>
              {headers.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-2 pl-4">
            <label htmlFor="static-label" className="font-medium">Static Label:</label>
            <input 
              type="text"
              id="static-label"
              className="w-full p-2 border rounded"
              value={nodeMapping.staticLabel}
              onChange={(e) => updateNodeMapping({staticLabel: e.target.value})}
              placeholder="Enter static label"
            />
          </div>
        )}

        {/* Node Properties Selection */}
        <div className="space-y-2">
          <label className="font-medium">Node Properties:</label>
          <p className="text-sm text-gray-500">Select columns to include as node properties.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-2 border rounded-md max-h-48 overflow-y-auto">
            {headers.map(header => {
              // Disable checkbox if column is used for ID or Label
              const isDisabled = header === nodeMapping.idColumn || 
                                (nodeMapping.labelSource === 'column' && header === nodeMapping.labelColumn);
              return (
                <div key={header} className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id={`prop-${header}`} 
                    checked={nodeMapping.propertyColumns.includes(header)}
                    onChange={(e) => {
                      const newProps = e.target.checked
                        ? [...nodeMapping.propertyColumns, header]
                        : nodeMapping.propertyColumns.filter(col => col !== header);
                      updateNodeMapping({propertyColumns: newProps});
                    }}
                    disabled={isDisabled}
                  />
                  <label 
                    htmlFor={`prop-${header}`} 
                    className={isDisabled ? "text-gray-400" : ""}
                  >
                    {header}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Relationship Mapping Section */}
      <div className="space-y-4 p-4 border rounded-md">
        <h4 className="font-medium">Relationship Mapping</h4>
        <p className="text-sm text-gray-500">
          Define how table columns map to graph relationships (source, target, type, properties).
          You can create relationships between columns in this file or across different files.
        </p>
        
        {/* Source and Target Dataset Selection Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Source Dataset Selection */}
          <div className="space-y-2">
            <label htmlFor="source-dataset" className="font-medium block">Source Dataset:</label>
            <select 
              id="source-dataset"
              className="w-full p-2 border rounded"
              value={relationshipMapping.sourceRef.datasetId || currentDatasetId}
              onChange={(e) => updateRelationshipMapping({
                sourceRef: {
                  ...relationshipMapping.sourceRef,
                  datasetId: e.target.value,
                  // Reset column when dataset changes
                  column: null
                }
              })}
            >
              {availableDatasets.map(ds => (
                <option key={ds.id} value={ds.id}>
                  {ds.fileName} {ds.id === currentDatasetId ? '(current)' : ''}
                </option>
              ))}
            </select>
          </div>
        
          {/* Target Dataset Selection */}
          <div className="space-y-2">
            <label htmlFor="target-dataset" className="font-medium block">Target Dataset:</label>
            <select 
              id="target-dataset"
              className="w-full p-2 border rounded"
              value={relationshipMapping.targetRef.datasetId || currentDatasetId}
              onChange={(e) => updateRelationshipMapping({
                targetRef: {
                  ...relationshipMapping.targetRef,
                  datasetId: e.target.value,
                  // Reset column when dataset changes
                  column: null
                }
              })}
            >
              {availableDatasets.map(ds => (
                <option key={ds.id} value={ds.id}>
                  {ds.fileName} {ds.id === currentDatasetId ? '(current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
          
        {/* Source and Target Column Selection Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Source Node ID Selection */}
          <div className="space-y-2">
            <label htmlFor="source-id" className="font-medium block">Source Node ID:</label>
            <select 
              id="source-id"
              className="w-full p-2 border rounded"
              value={relationshipMapping.sourceRef.column || ""}
              onChange={(e) => updateRelationshipMapping({
                sourceRef: {
                  ...relationshipMapping.sourceRef,
                  column: e.target.value
                }
              })}
            >
              <option value="">Select source column...</option>
              {sourceDatasetHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          {/* Target Node ID Selection */}
          <div className="space-y-2">
            <label htmlFor="target-id" className="font-medium block">Target Node ID:</label>
            <select 
              id="target-id"
              className="w-full p-2 border rounded"
              value={relationshipMapping.targetRef.column || ""}
              onChange={(e) => updateRelationshipMapping({
                targetRef: {
                  ...relationshipMapping.targetRef,
                  column: e.target.value
                }
              })}
            >
              <option value="">Select target column...</option>
              {targetDatasetHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Relationship Type Selection - Full Width */}
        <div className="space-y-2">
          <label htmlFor="rel-type" className="font-medium block">Relationship Type:</label>
          <input 
            type="text"
            id="rel-type"
            className="w-full p-2 border rounded"
            value={relationshipMapping.staticRelationshipType}
            onChange={(e) => updateRelationshipMapping({staticRelationshipType: e.target.value})}
            placeholder="Enter relationship type (e.g., RELATES_TO)"
          />
        </div>

        {/* Visual representation of the relationship - Maintain fixed height to prevent layout shifts */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm min-h-[80px] flex items-center">
          {relationshipMapping.sourceRef.column && relationshipMapping.targetRef.column ? (
            <div className="w-full">
              <p className="font-medium mb-2">Relationship Preview:</p>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="p-1.5 bg-blue-100 rounded">
                  {relationshipMapping.sourceRef.datasetId === currentDatasetId ? 'Current' : 
                    availableDatasets.find(ds => ds.id === relationshipMapping.sourceRef.datasetId)?.fileName || 'Unknown'}: 
                  <span className="font-medium ml-1">{relationshipMapping.sourceRef.column}</span>
                </span>
                <span className="text-gray-400">—</span>
                <span className="p-1 bg-green-100 rounded font-medium">{relationshipMapping.staticRelationshipType}</span>
                <span className="text-gray-400">→</span>
                <span className="p-1.5 bg-purple-100 rounded">
                  {relationshipMapping.targetRef.datasetId === currentDatasetId ? 'Current' : 
                    availableDatasets.find(ds => ds.id === relationshipMapping.targetRef.datasetId)?.fileName || 'Unknown'}: 
                  <span className="font-medium ml-1">{relationshipMapping.targetRef.column}</span>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select source and target columns to preview the relationship</p>
          )}
        </div>
      </div>

      {/* Multi-file relationship examples */}
      {availableDatasets.length > 1 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-800">Multi-File Relationship Examples</h4>
          <p className="text-sm text-blue-700 mt-1">
            You can create complex graph structures by connecting data across different files:
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc pl-5">
            <li>Connect products to customers (Product file → Customer file)</li>
            <li>Link movies to actors (Movies file → Actors file)</li>
            <li>Map locations to events (Location file → Events file)</li>
          </ul>
          <p className="text-sm text-blue-700 mt-2">
            Simply select different datasets for source and target to create cross-file relationships.
          </p>
        </div>
      )}
    </div>
  );
} 
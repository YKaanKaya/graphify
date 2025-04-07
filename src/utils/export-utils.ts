/**
 * Export utilities for converting tabular data to graph database formats
 * Supports Cypher (Neo4j) and Gremlin query generation based on mapping configuration
 */

import { ParsedData, NodeMapping, RelationshipMapping, DatasetInfo } from '../types/mapping';

// Helper type for parsed data
interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
}

/**
 * Escapes strings for Cypher queries
 */
function escapeCypher(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  
  // For strings, escape quotes and backslashes
  return `"${String(value).replace(/"/g, '\\"').replace(/\\/g, '\\\\')}"`;
}

/**
 * Escapes strings for Gremlin queries
 */
function escapeGremlin(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  
  // For strings, escape single quotes and backslashes
  return `'${String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\')}'`;
}

/**
 * Convert a property name to a valid graph database property key
 */
function normalizePropertyKey(key: string): string {
  // Replace spaces and special characters with underscores
  return key.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Generate Cypher queries for Neo4j based on the provided data and mappings
 */
export function generateCypherQueries(
  data: ParsedData,
  nodeMapping: NodeMapping,
  relationshipMapping: RelationshipMapping,
  datasetsMap: Map<string, DatasetInfo>
): string {
  try {
    let queries: string[] = [];
    
    // Generate CREATE commands for nodes
    const createNodesQuery = generateCypherCreateNodes(data, nodeMapping);
    queries.push(createNodesQuery);
    
    // Generate CREATE commands for relationships
    const createRelationshipsQuery = generateCypherCreateRelationships(
      data, 
      nodeMapping, 
      relationshipMapping,
      datasetsMap
    );
    queries.push(createRelationshipsQuery);
    
    return queries.join('\n\n');
  } catch (error) {
    console.error("Error generating Cypher queries:", error);
    return `Error generating Cypher: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Generate Gremlin queries for graph databases like JanusGraph, Neptune, etc.
 */
export function generateGremlinQueries(
  data: ParsedData,
  nodeMapping: NodeMapping,
  relationshipMapping: RelationshipMapping,
  datasetsMap: Map<string, DatasetInfo>
): string {
  try {
    let queries: string[] = [];
    
    // Create vertices (nodes)
    const verticesQuery = generateGremlinVertices(data, nodeMapping);
    queries.push(verticesQuery);
    
    // Create edges (relationships)
    const edgesQuery = generateGremlinEdges(
      data, 
      nodeMapping, 
      relationshipMapping,
      datasetsMap
    );
    queries.push(edgesQuery);
    
    return queries.join('\n\n');
  } catch (error) {
    console.error("Error generating Gremlin queries:", error);
    return `Error generating Gremlin: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Generate JSON output that can be imported into various graph databases
 */
export function generateJSONOutput(
  data: ParsedData,
  nodeMapping: NodeMapping,
  relationshipMapping: RelationshipMapping,
  datasetsMap: Map<string, DatasetInfo>
): string {
  try {
    // Create nodes array
    const nodes = generateJSONNodes(data, nodeMapping);
    
    // Create relationships array
    const relationships = generateJSONRelationships(
      data, 
      nodeMapping, 
      relationshipMapping,
      datasetsMap
    );
    
    // Combine into JSON structure
    const output = {
      nodes,
      relationships
    };
    
    return JSON.stringify(output, null, 2);
  } catch (error) {
    console.error("Error generating JSON output:", error);
    return `Error generating JSON: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Helper functions

/**
 * Generate Cypher CREATE statements for nodes
 */
function generateCypherCreateNodes(data: ParsedData, nodeMapping: NodeMapping): string {
  if (!nodeMapping.idColumn) {
    throw new Error("Node ID column is required for Cypher node creation");
  }

  const lines: string[] = [];
  lines.push('// Create nodes');
  
  // Use UNWIND for better performance with large datasets
  lines.push('UNWIND [');
  
  // Generate node data objects
  data.rows.forEach((row, index) => {
    const nodeId = String(row[nodeMapping.idColumn!]);
    const nodeLabel = nodeMapping.labelSource === 'column' && nodeMapping.labelColumn 
      ? String(row[nodeMapping.labelColumn])
      : nodeMapping.staticLabel;
    
    // Create properties object
    const properties: Record<string, any> = {};
    
    // Add ID as a property
    properties.id = nodeId;
    
    // Add all selected properties
    nodeMapping.propertyColumns.forEach(propCol => {
      if (row[propCol] !== undefined && row[propCol] !== null) {
        properties[propCol] = row[propCol];
      }
    });
    
    // Format as Cypher object
    const propsString = Object.entries(properties)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          // Escape quotes in strings
          const escapedValue = value.replace(/"/g, '\\"');
          return `${key}: "${escapedValue}"`;
        }
        return `${key}: ${value}`;
      })
      .join(', ');
    
    lines.push(`  {id: "${nodeId}", label: "${nodeLabel}", properties: {${propsString}}}${index < data.rows.length - 1 ? ',' : ''}`);
  });
  
  lines.push('] AS nodeData');
  lines.push(`CREATE (n:${nodeMapping.staticLabel} {id: nodeData.id})`);
  lines.push('SET n += nodeData.properties');
  
  return lines.join('\n');
}

/**
 * Generate Cypher CREATE statements for relationships
 */
function generateCypherCreateRelationships(
  data: ParsedData,
  nodeMapping: NodeMapping,
  relationshipMapping: RelationshipMapping,
  datasetsMap: Map<string, DatasetInfo>
): string {
  if (!relationshipMapping.sourceRef.column || !relationshipMapping.targetRef.column) {
    throw new Error("Source and target columns are required for Cypher relationship creation");
  }
  
  const lines: string[] = [];
  lines.push('// Create relationships');
  
  // Get source and target datasets
  const sourceDatasetId = relationshipMapping.sourceRef.datasetId;
  const targetDatasetId = relationshipMapping.targetRef.datasetId;
  
  // Use the current dataset if no specific dataset is specified
  const sourceData = sourceDatasetId && sourceDatasetId !== nodeMapping.idColumn 
    ? datasetsMap.get(sourceDatasetId)?.data 
    : data;
    
  const targetData = targetDatasetId && targetDatasetId !== nodeMapping.idColumn
    ? datasetsMap.get(targetDatasetId)?.data
    : data;
  
  if (!sourceData || !targetData) {
    throw new Error("Source or target dataset not found");
  }
  
  // For cross-file relationships, we'll need to prepare data differently
  if (sourceDatasetId && targetDatasetId && sourceDatasetId !== targetDatasetId) {
    // Cross-file relationship - need to handle differently
    lines.push('// Cross-file relationship');
    lines.push('MATCH (source:Node), (target:Node)');
    lines.push(`WHERE source.id IN [${generateDistinctValues(sourceData.rows, relationshipMapping.sourceRef.column)}]`);
    lines.push(`AND target.id IN [${generateDistinctValues(targetData.rows, relationshipMapping.targetRef.column)}]`);
    lines.push(`CREATE (source)-[:${relationshipMapping.staticRelationshipType}]->(target)`);
  } else {
    // Same-file relationship
    lines.push('// Within-file relationship');
    lines.push('UNWIND [');
    
    // Generate relationship data
    data.rows.forEach((row, index) => {
      const sourceId = String(row[relationshipMapping.sourceRef.column!]);
      const targetId = String(row[relationshipMapping.targetRef.column!]);
      
      // Only add valid relationships where both source and target exist
      if (sourceId && targetId) {
        // Create relationship properties
        const properties: Record<string, any> = {};
        
        // Add selected properties
        relationshipMapping.propertyColumns.forEach(propCol => {
          if (row[propCol] !== undefined && row[propCol] !== null) {
            properties[propCol] = row[propCol];
          }
        });
        
        // Format properties as string
        const propsString = Object.entries(properties)
          .map(([key, value]) => {
            if (typeof value === 'string') {
              const escapedValue = value.replace(/"/g, '\\"');
              return `${key}: "${escapedValue}"`;
            }
            return `${key}: ${value}`;
          })
          .join(', ');
        
        lines.push(`  {sourceId: "${sourceId}", targetId: "${targetId}", properties: {${propsString}}}${index < data.rows.length - 1 ? ',' : ''}`);
      }
    });
    
    lines.push('] AS relData');
    lines.push('MATCH (source:Node), (target:Node)');
    lines.push('WHERE source.id = relData.sourceId AND target.id = relData.targetId');
    lines.push(`CREATE (source)-[:${relationshipMapping.staticRelationshipType} {id: relData.sourceId + "_" + relData.targetId}]->(target)`);
    lines.push('SET r += relData.properties');
  }
  
  return lines.join('\n');
}

/**
 * Generate Gremlin code for creating vertices (nodes)
 */
function generateGremlinVertices(data: ParsedData, nodeMapping: NodeMapping): string {
  if (!nodeMapping.idColumn) {
    throw new Error("Node ID column is required for Gremlin vertex creation");
  }

  const lines: string[] = [];
  lines.push('// Create vertices (nodes)');
  
  // For each row, create a vertex
  data.rows.forEach((row, index) => {
    const nodeId = String(row[nodeMapping.idColumn!]);
    const nodeLabel = nodeMapping.labelSource === 'column' && nodeMapping.labelColumn 
      ? String(row[nodeMapping.labelColumn])
      : nodeMapping.staticLabel;
    
    let vertexCode = `g.addV('${nodeLabel}').property('id', '${nodeId}')`;
    
    // Add all selected properties
    nodeMapping.propertyColumns.forEach(propCol => {
      if (row[propCol] !== undefined && row[propCol] !== null) {
        // Format value based on type
        let formattedValue = row[propCol];
        if (typeof formattedValue === 'string') {
          formattedValue = `'${formattedValue.replace(/'/g, "\\'")}'`;
        }
        
        vertexCode += `.property('${propCol}', ${formattedValue})`;
      }
    });
    
    lines.push(vertexCode);
  });
  
  return lines.join('\n');
}

/**
 * Generate Gremlin code for creating edges (relationships)
 */
function generateGremlinEdges(
  data: ParsedData,
  nodeMapping: NodeMapping,
  relationshipMapping: RelationshipMapping,
  datasetsMap: Map<string, DatasetInfo>
): string {
  if (!relationshipMapping.sourceRef.column || !relationshipMapping.targetRef.column) {
    throw new Error("Source and target columns are required for Gremlin edge creation");
  }
  
  const lines: string[] = [];
  lines.push('// Create edges (relationships)');
  
  // Get source and target datasets
  const sourceDatasetId = relationshipMapping.sourceRef.datasetId;
  const targetDatasetId = relationshipMapping.targetRef.datasetId;
  
  // Use the current dataset if no specific dataset is specified
  const sourceData = sourceDatasetId && sourceDatasetId !== nodeMapping.idColumn 
    ? datasetsMap.get(sourceDatasetId)?.data 
    : data;
    
  const targetData = targetDatasetId && targetDatasetId !== nodeMapping.idColumn
    ? datasetsMap.get(targetDatasetId)?.data
    : data;
  
  if (!sourceData || !targetData) {
    throw new Error("Source or target dataset not found");
  }
  
  // For cross-file relationships, we'll handle differently
  if (sourceDatasetId && targetDatasetId && sourceDatasetId !== targetDatasetId) {
    // Cross-file relationship
    lines.push('// Cross-file relationship edges');
    
    // Get distinct source and target IDs
    const sourceIds = getDistinctValues(sourceData.rows, relationshipMapping.sourceRef.column);
    const targetIds = getDistinctValues(targetData.rows, relationshipMapping.targetRef.column);
    
    // Create edges between all source and target vertices
    sourceIds.forEach(sourceId => {
      targetIds.forEach(targetId => {
        const edgeCode = `g.V().has('id', '${sourceId}').as('source')`
          + `.V().has('id', '${targetId}').as('target')`
          + `.addE('${relationshipMapping.staticRelationshipType}')`
          + `.from('source').to('target')`;
        
        lines.push(edgeCode);
      });
    });
  } else {
    // Same-file relationships
    lines.push('// Within-file relationship edges');
    
    // Create edges for each row
    data.rows.forEach(row => {
      const sourceId = String(row[relationshipMapping.sourceRef.column!]);
      const targetId = String(row[relationshipMapping.targetRef.column!]);
      
      // Only add valid relationships where both source and target exist
      if (sourceId && targetId) {
        let edgeCode = `g.V().has('id', '${sourceId}').as('source')`
          + `.V().has('id', '${targetId}').as('target')`
          + `.addE('${relationshipMapping.staticRelationshipType}')`
          + `.from('source').to('target')`;
        
        // Add properties to the edge
        relationshipMapping.propertyColumns.forEach(propCol => {
          if (row[propCol] !== undefined && row[propCol] !== null) {
            // Format value based on type
            let formattedValue = row[propCol];
            if (typeof formattedValue === 'string') {
              formattedValue = `'${formattedValue.replace(/'/g, "\\'")}'`;
            }
            
            edgeCode += `.property('${propCol}', ${formattedValue})`;
          }
        });
        
        lines.push(edgeCode);
      }
    });
  }
  
  return lines.join('\n');
}

/**
 * Generate JSON representation of nodes
 */
function generateJSONNodes(data: ParsedData, nodeMapping: NodeMapping): any[] {
  if (!nodeMapping.idColumn) {
    throw new Error("Node ID column is required for JSON node creation");
  }

  const nodes: any[] = [];
  
  // Create node for each row
  data.rows.forEach(row => {
    const nodeId = String(row[nodeMapping.idColumn!]);
    const nodeLabel = nodeMapping.labelSource === 'column' && nodeMapping.labelColumn 
      ? String(row[nodeMapping.labelColumn])
      : nodeMapping.staticLabel;
    
    // Create node object
    const node: any = {
      id: nodeId,
      label: nodeLabel,
      properties: {}
    };
    
    // Add selected properties
    nodeMapping.propertyColumns.forEach(propCol => {
      if (row[propCol] !== undefined && row[propCol] !== null) {
        node.properties[propCol] = row[propCol];
      }
    });
    
    nodes.push(node);
  });
  
  return nodes;
}

/**
 * Generate JSON representation of relationships
 */
function generateJSONRelationships(
  data: ParsedData,
  nodeMapping: NodeMapping,
  relationshipMapping: RelationshipMapping,
  datasetsMap: Map<string, DatasetInfo>
): any[] {
  if (!relationshipMapping.sourceRef.column || !relationshipMapping.targetRef.column) {
    throw new Error("Source and target columns are required for JSON relationship creation");
  }
  
  const relationships: any[] = [];
  
  // Get source and target datasets
  const sourceDatasetId = relationshipMapping.sourceRef.datasetId;
  const targetDatasetId = relationshipMapping.targetRef.datasetId;
  
  // Use the current dataset if no specific dataset is specified
  const sourceData = sourceDatasetId && sourceDatasetId !== nodeMapping.idColumn 
    ? datasetsMap.get(sourceDatasetId)?.data 
    : data;
    
  const targetData = targetDatasetId && targetDatasetId !== nodeMapping.idColumn
    ? datasetsMap.get(targetDatasetId)?.data
    : data;
  
  if (!sourceData || !targetData) {
    throw new Error("Source or target dataset not found");
  }
  
  // For cross-file relationships, we'll handle differently
  if (sourceDatasetId && targetDatasetId && sourceDatasetId !== targetDatasetId) {
    // Cross-file relationship
    
    // Get distinct source and target IDs
    const sourceIds = getDistinctValues(sourceData.rows, relationshipMapping.sourceRef.column);
    const targetIds = getDistinctValues(targetData.rows, relationshipMapping.targetRef.column);
    
    // Create relationships between all source and target nodes
    let relationshipId = 1;
    
    sourceIds.forEach(sourceId => {
      targetIds.forEach(targetId => {
        const relationship = {
          id: `r${relationshipId++}`,
          type: relationshipMapping.staticRelationshipType,
          sourceId: sourceId,
          targetId: targetId,
          properties: {}
        };
        
        relationships.push(relationship);
      });
    });
  } else {
    // Same-file relationships
    let relationshipId = 1;
    
    // Create relationship for each row
    data.rows.forEach(row => {
      const sourceId = String(row[relationshipMapping.sourceRef.column!]);
      const targetId = String(row[relationshipMapping.targetRef.column!]);
      
      // Only add valid relationships where both source and target exist
      if (sourceId && targetId) {
        const relationship: any = {
          id: `r${relationshipId++}`,
          type: relationshipMapping.staticRelationshipType,
          sourceId: sourceId,
          targetId: targetId,
          properties: {}
        };
        
        // Add selected properties
        relationshipMapping.propertyColumns.forEach(propCol => {
          if (row[propCol] !== undefined && row[propCol] !== null) {
            relationship.properties[propCol] = row[propCol];
          }
        });
        
        relationships.push(relationship);
      }
    });
  }
  
  return relationships;
}

/**
 * Helper function to get distinct values from a column
 */
function getDistinctValues(rows: Record<string, any>[], column: string): string[] {
  const valueSet = new Set<string>();
  
  rows.forEach(row => {
    if (row[column] !== undefined && row[column] !== null) {
      valueSet.add(String(row[column]));
    }
  });
  
  return Array.from(valueSet);
}

/**
 * Helper function to format distinct values as a string for Cypher
 */
function generateDistinctValues(rows: Record<string, any>[], column: string): string {
  const values = getDistinctValues(rows, column);
  return values.map(v => `"${v.replace(/"/g, '\\"')}"`).join(', ');
}

// Additional utility function for direct Neo4j connection (if needed)
export async function exportDirectlyToNeo4j(
  cypherQuery: string, 
  connectionUri: string,
  username: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  try {
    // This would require a Neo4j driver - not included in this implementation
    // Sample implementation using neo4j-driver would be added here
    return {
      success: false,
      message: "Direct Neo4j connection not implemented - please copy the Cypher queries and run them manually"
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 
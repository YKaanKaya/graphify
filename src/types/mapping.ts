/**
 * Shared types for mapping configuration
 */

/**
 * Type for parsed CSV/Excel data
 */
export interface ParsedData {
  headers: string[];
  rows: Record<string, string | number | boolean>[];
}

/**
 * Dataset reference information
 */
export interface DatasetRef {
  id: string;
  fileName: string;
  headers: string[];
}

/**
 * Type for complete dataset info stored in state
 */
export interface DatasetInfo {
  id: string;
  fileName: string;
  data: ParsedData;
  nodeMapping?: NodeMapping;
  relationshipMapping?: RelationshipMapping;
}

/**
 * Node mapping configuration
 */
export interface NodeMapping {
  // Column used for node ID, must be unique
  idColumn: string | null;
  
  // Source for node label
  labelSource: 'column' | 'static';
  
  // If labelSource is 'column', this is the column to use for label values
  labelColumn: string | null;
  
  // If labelSource is 'static', this is the fixed label for all nodes
  staticLabel: string;
  
  // Columns to use as node properties
  propertyColumns: string[];
}

/**
 * Types for cross-file relationship references
 */
export interface ColumnRef {
  datasetId: string;
  column: string | null;
}

/**
 * Relationship mapping configuration
 */
export interface RelationshipMapping {
  // Instead of direct column references, use references that include dataset ID
  sourceRef: {
    datasetId: string | null;
    column: string | null;
  };
  
  // Instead of direct column references, use references that include dataset ID
  targetRef: {
    datasetId: string | null;
    column: string | null;
  };
  
  // Source for relationship type
  relationshipTypeSource: 'column' | 'static';
  
  // If relationshipTypeSource is 'column', this is the column to use for type values
  relationshipTypeColumn: string | null;
  
  // If relationshipTypeSource is 'static', this is the fixed type for all relationships
  staticRelationshipType: string;
  
  // Columns to use as relationship properties
  propertyColumns: string[];
} 
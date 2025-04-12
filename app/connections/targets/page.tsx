"use client";

import { Database } from "lucide-react";

export default function TargetConnectionsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Target Connections</h1>

      {/* Placeholder - Coming Soon */}
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-600 mb-1">Target Connections Coming Soon</h3>
        <p className="text-gray-500 mb-4">
          This feature is currently in development. You'll soon be able to connect to graph databases like Neo4j, 
          Amazon Neptune, and TigerGraph.
        </p>
      </div>
    </div>
  );
} 
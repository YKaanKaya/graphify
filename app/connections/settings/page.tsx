"use client";

import { useState } from "react";
import { Eye, EyeOff, Key, Lock, Save } from "lucide-react";

export default function SettingsPage() {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async () => {
    // This would save the API key to a secure storage in a real application
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    setSaveSuccess(true);
    
    // Reset success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">API Keys & Security</h1>
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start mb-4">
            <Key className="text-blue-500 mt-1 mr-3 h-5 w-5" />
            <div>
              <h2 className="text-lg font-medium">Gemini API Key</h2>
              <p className="text-gray-600 text-sm mb-4">
                Configure your Gemini API key to enable AI-powered features like schema mapping suggestions and error explanations.
              </p>
              
              <div className="relative mb-4">
                <input
                  type={showApiKey ? "text" : "password"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                  placeholder="Enter your Gemini API key"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>No data containing sensitive information will be sent to the Gemini API. Learn more about our <a href="#" className="text-blue-600 hover:underline">privacy policy</a>.</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSaving ? "Saving..." : "Save Settings"}
              {!isSaving && <Save className="h-4 w-4" />}
            </button>
          </div>
          
          {saveSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
              Settings saved successfully!
            </div>
          )}
        </div>
        
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <div className="flex items-start">
            <Lock className="text-blue-500 mt-1 mr-3 h-5 w-5" />
            <div>
              <h2 className="text-lg font-medium">Connection Security</h2>
              <p className="text-gray-600 text-sm mb-4">
                All database credentials are encrypted using AES-256 before being stored. Credentials are only decrypted when establishing connections.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Security Features</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• AES-256 encryption for all credentials</li>
                  <li>• Credentials never exposed in logs or error messages</li>
                  <li>• TLS/SSL connections to databases enforced where available</li>
                  <li>• Secure connection testing with minimal permissions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
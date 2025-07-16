'use client';

import React, { useState } from 'react';
import { X, Wand2, Loader2 } from 'lucide-react';
import { GenerateRequest } from '../types/karate';
import { generateFeature } from '../services/karateService';

interface FeatureGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (generatedContent: string) => void;
}

export const FeatureGeneratorModal: React.FC<FeatureGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const [name, setName] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [headers, setHeaders] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [expectedResponse, setExpectedResponse] = useState('');
  const [verifications, setVerifications] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!name.trim()) {
      setError('Please provide a name for the test');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const request: GenerateRequest = {
        name: name.trim(),
        httpMethod: httpMethod.trim() || undefined,
        apiEndpoint: apiEndpoint.trim() || undefined,
        headers: headers.trim() || undefined,
        requestBody: requestBody.trim() || undefined,
        expectedResponse: expectedResponse.trim() || undefined,
        verifications: verifications.trim() || undefined,
      };

      const generatedContent = await generateFeature(request);
      onGenerate(generatedContent);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate feature');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setName('');
    setHttpMethod('GET');
    setApiEndpoint('');
    setHeaders('');
    setRequestBody('');
    setExpectedResponse('');
    setVerifications('');
    setError(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Generate Feature</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a descriptive name for your test (e.g., 'User Login API Test')"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">API Test Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTTP Method
                </label>
                <select
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Endpoint
                </label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.example.com/users"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Headers
              </label>
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='Content-Type: application/json'
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Body
              </label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder="Request body content"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Response
              </label>
              <textarea
                value={expectedResponse}
                onChange={(e) => setExpectedResponse(e.target.value)}
                placeholder="Expected response body"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verifications
            </label>
            <textarea
              value={verifications}
              onChange={(e) => setVerifications(e.target.value)}
              placeholder="Specify what to verify in the test (e.g., 'status code 200', 'response contains user data')"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !name.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                <span>Generate Feature</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
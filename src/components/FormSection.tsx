import React, { useState, useEffect } from 'react';
import { FormField as FormFieldType } from '../types';
import { HelpCircle, Loader } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { analyzeCaseDescription } from '../services/azure-openai';

interface FormSectionProps {
  title: string;
  fields: FormFieldType[];
  formData: { [key: string]: string | File };
  onInputChange: (id: string, value: string | File) => void;
  errors: { [key: string]: string };
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  fields,
  formData,
  onInputChange,
  errors,
}) => {
  const [aiGuidance, setAiGuidance] = useState<{
    explanation: string;
    requirements: string[];
    suggestions: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const caseDescription = formData.caseDescription as string;
    if (caseDescription && caseDescription.length > 50) {
      const analyzeCase = async () => {
        setIsAnalyzing(true);
        try {
          const guidance = await analyzeCaseDescription(caseDescription);
          setAiGuidance(guidance);
        } catch (error) {
          console.error('Failed to get AI guidance:', error);
        } finally {
          setIsAnalyzing(false);
        }
      };

      const debounceTimer = setTimeout(analyzeCase, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [formData.caseDescription]);

  const hasCaseDescription = fields.some(field => field.id === 'caseDescription');

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="relative">
            <label
              htmlFor={field.id}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              {field.type === 'file' ? (
                <FileUpload
                  id={field.id}
                  onChange={(file) => onInputChange(field.id, file)}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.id}
                  value={formData[field.id] as string || ''}
                  onChange={(e) => onInputChange(field.id, e.target.value)}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors[field.id] ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  id={field.id}
                  value={formData[field.id] as string || ''}
                  onChange={(e) => onInputChange(field.id, e.target.value)}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors[field.id] ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              )}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 group">
                <HelpCircle className="h-5 w-5 text-gray-400" />
                <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {field.tooltip}
                </div>
              </div>
            </div>
            {errors[field.id] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.id]}</p>
            )}
          </div>
        ))}

        {/* AI Guidance Section */}
        {hasCaseDescription && formData.caseDescription && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            {isAnalyzing ? (
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader className="h-5 w-5 animate-spin" />
                <span>Analyzing your case...</span>
              </div>
            ) : aiGuidance ? (
              <div className="space-y-3">
                <h4 className="font-medium text-blue-800">AI Legal Guidance</h4>
                <p className="text-sm text-gray-700">{aiGuidance.explanation}</p>
                {aiGuidance.requirements.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700">Requirements:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {aiGuidance.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiGuidance.suggestions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700">Suggestions:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {aiGuidance.suggestions.map((sug, index) => (
                        <li key={index}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
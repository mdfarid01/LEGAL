import React, { useState, useCallback } from 'react';
import { FormSection } from './components/FormSection';
import { SpeechInput } from './components/SpeechInput';
import { ProgressTracker } from './components/ProgressTracker';
import { StatusTracker } from './components/StatusTracker';
import { FormData, FormSection as FormSectionType, ValidationErrors } from './types';
import { Scale, FileText, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { translateText } from './services/bhashini';

const formSections: FormSectionType[] = [
  {
    title: 'Personal Information',
    fields: [
      {
        id: 'name',
        label: 'Full Name',
        type: 'text',
        tooltip: 'Enter your legal name as it appears on official documents',
        required: true,
        validation: {
          pattern: /^[a-zA-Z\s]{2,50}$/,
          message: 'Please enter a valid name (2-50 characters, letters only)',
        },
      },
      {
        id: 'dob',
        label: 'Date of Birth',
        type: 'date',
        tooltip: 'Your date of birth as per official records',
        required: true,
      },
      {
        id: 'address',
        label: 'Current Address',
        type: 'text',
        tooltip: 'Your complete residential address',
        required: true,
      },
      {
        id: 'idProof',
        label: 'Identity Proof',
        type: 'file',
        tooltip: 'Upload a government-issued ID proof (Aadhaar, PAN, etc.)',
        required: true,
      },
    ],
  },
  {
    title: 'Case Information',
    fields: [
      {
        id: 'caseType',
        label: 'Type of Case',
        type: 'select',
        options: [
          'Civil Case',
          'Criminal Case',
          'Family Matter',
          'Property Dispute',
          'Consumer Complaint',
        ],
        tooltip: 'Select the category that best describes your legal matter',
        required: true,
      },
      {
        id: 'caseDescription',
        label: 'Case Description',
        type: 'text',
        tooltip: 'Briefly describe your legal matter',
        required: true,
      },
      {
        id: 'supportingDocs',
        label: 'Supporting Documents',
        type: 'file',
        tooltip: 'Upload any relevant documents supporting your case',
        required: true,
      },
    ],
  },
];

const steps = ['Personal Info', 'Case Details', 'Review', 'Submit'];

const formSchema = z.object({
  name: z.string().min(2).max(50).regex(/^[a-zA-Z\s]+$/),
  dob: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(10, 'Please enter a complete address'),
  idProof: z.instanceof(File, { message: 'Identity proof is required' }),
  caseType: z.string().min(1, 'Please select a case type'),
  caseDescription: z.string().min(50, 'Please provide a detailed description'),
  supportingDocs: z.instanceof(File, { message: 'Supporting documents are required' }),
});

function App() {
  const [formData, setFormData] = useState<FormData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [status, setStatus] = useState({
    id: '123',
    status: 'pending' as const,
    lastUpdated: new Date().toISOString(),
    comments: 'Your application is being processed.',
  });

  const handleInputChange = useCallback((id: string, value: string | File) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  }, []);

  const handleSpeechInput = useCallback(async (transcript: string) => {
    const words = transcript.toLowerCase().split(' ');
    
    const fieldMappings = {
      name: ['name', 'naam', 'नाम'],
      address: ['address', 'pata', 'पता'],
      caseDescription: ['case', 'description', 'मामला', 'विवरण'],
    };

    try {
      // Translate the transcript to English for better processing
      const translatedText = await translateText(transcript, 'auto', 'en');
      const translatedWords = translatedText.translatedText.toLowerCase().split(' ');

      Object.entries(fieldMappings).forEach(([field, keywords]) => {
        keywords.forEach(keyword => {
          const keywordIndex = translatedWords.findIndex(word => 
            word.includes(keyword.toLowerCase())
          );
          
          if (keywordIndex !== -1 && translatedWords[keywordIndex + 1]) {
            const value = translatedWords.slice(keywordIndex + 1).join(' ');
            handleInputChange(field, value);
          }
        });
      });
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to basic keyword matching if translation fails
      Object.entries(fieldMappings).forEach(([field, keywords]) => {
        keywords.forEach(keyword => {
          if (words.includes(keyword)) {
            const keywordIndex = words.indexOf(keyword);
            if (words[keywordIndex + 1]) {
              const value = words.slice(keywordIndex + 1).join(' ');
              handleInputChange(field, value);
            }
          }
        });
      });
    }
  }, [handleInputChange]);

  const validateStep = useCallback(() => {
    const currentFields = formSections[currentStep].fields.map(f => f.id);
    const currentData = Object.fromEntries(
      Object.entries(formData).filter(([key]) => currentFields.includes(key))
    );

    const requiredFields = formSections[currentStep].fields
      .filter(f => f.required)
      .map(f => f.id);

    const missingFields = requiredFields.filter(field => !currentData[field]);

    if (missingFields.length > 0) {
      const newErrors = missingFields.reduce((acc, field) => {
        acc[field] = 'This field is required';
        return acc;
      }, {} as ValidationErrors);
      setErrors(newErrors);
      return false;
    }

    try {
      // Create a partial schema for the current step
      const currentSchema = z.object(
        Object.fromEntries(
          currentFields.map(field => [
            field,
            formSchema.shape[field as keyof typeof formSchema.shape]
          ])
        )
      );

      currentSchema.parse(currentData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = error.errors.reduce((acc, err) => {
          acc[err.path[0]] = err.message;
          return acc;
        }, {} as ValidationErrors);
        setErrors(newErrors);
      }
      return false;
    }
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      setErrors({});
    }
  }, [validateStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setErrors({});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep()) {
      // Here you would integrate with your backend API
      console.log('Form submitted:', formData);
      setStatus({
        id: '123',
        status: 'reviewing',
        lastUpdated: new Date().toISOString(),
        comments: 'Your application is under review.',
      });
      setCurrentStep(steps.length - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Legal Filing Assistant</h1>
          </div>
          <SpeechInput onTranscript={handleSpeechInput} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-8">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Legal Application Form</h2>
            </div>
            <p className="mt-2 text-gray-600">
              Fill out the form below using text or voice input. Required fields are marked with an asterisk (*).
            </p>
          </div>

          <ProgressTracker steps={steps} currentStep={currentStep} />

          <form onSubmit={handleSubmit} className="mt-8">
            {currentStep < steps.length - 2 && (
              <FormSection
                title={formSections[currentStep].title}
                fields={formSections[currentStep].fields}
                formData={formData}
                onInputChange={handleInputChange}
                errors={errors}
              />
            )}

            {currentStep === steps.length - 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Review Your Information</h3>
                {formSections.map((section) => (
                  <div key={section.title} className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-700 mb-2">{section.title}</h4>
                    <dl className="space-y-2">
                      {section.fields.map((field) => (
                        <div key={field.id} className="flex justify-between">
                          <dt className="text-gray-600">{field.label}:</dt>
                          <dd className="text-gray-900">
                            {field.type === 'file'
                              ? (formData[field.id] as File)?.name || 'No file uploaded'
                              : formData[field.id] || 'Not provided'}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            )}

            {currentStep === steps.length - 1 && (
              <StatusTracker status={status} />
            )}

            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Please review all information before proceeding</span>
              </div>
              <div className="flex space-x-4">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                {currentStep < steps.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Next
                  </button>
                )}
                {currentStep === steps.length - 2 && (
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Submit Application
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default App;
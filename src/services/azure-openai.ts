import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
const deploymentName = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;

// Validate Azure OpenAI configuration
const isConfigured = endpoint && apiKey && deploymentName;

let client: OpenAIClient | null = null;

if (isConfigured) {
  try {
    client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
  } catch (error) {
    console.error('Failed to initialize Azure OpenAI client:', error);
  }
}

interface LegalGuidance {
  explanation: string;
  requirements: string[];
  suggestions: string[];
}

export const analyzeCaseDescription = async (description: string): Promise<LegalGuidance> => {
  if (!isConfigured || !client) {
    return {
      explanation: 'AI analysis is currently unavailable. Please proceed with your application.',
      requirements: [],
      suggestions: []
    };
  }

  try {
    const messages = [
      { role: 'system', content: 'You are a legal assistant helping to analyze case descriptions and provide guidance.' },
      { role: 'user', content: `Please analyze this legal case description and provide guidance: ${description}` }
    ];

    const response = await client.getChatCompletions(deploymentName, messages, {
      temperature: 0.7,
      maxTokens: 800,
    });

    const guidance = response.choices[0]?.message?.content;
    if (!guidance) {
      throw new Error('No guidance received from Azure OpenAI');
    }

    // Parse the guidance into structured format
    const parsedGuidance: LegalGuidance = {
      explanation: '',
      requirements: [],
      suggestions: []
    };

    try {
      const guidanceObj = JSON.parse(guidance);
      return {
        explanation: guidanceObj.explanation || '',
        requirements: guidanceObj.requirements || [],
        suggestions: guidanceObj.suggestions || []
      };
    } catch {
      // If not JSON, provide basic structure
      return {
        explanation: guidance,
        requirements: [],
        suggestions: []
      };
    }
  } catch (error) {
    console.error('Azure OpenAI Error:', error);
    return {
      explanation: 'Unable to analyze the case at this moment. Please continue with your application.',
      requirements: [],
      suggestions: []
    };
  }
};

export const improveTranslation = async (
  originalText: string,
  translatedText: string,
  context: string
): Promise<string> => {
  if (!isConfigured || !client) {
    return translatedText;
  }

  try {
    const messages = [
      { 
        role: 'system', 
        content: 'You are a legal translation expert. Improve the machine translation while maintaining legal accuracy.' 
      },
      { 
        role: 'user', 
        content: `Original text: ${originalText}\nMachine translation: ${translatedText}\nContext: ${context}\nPlease improve this translation.` 
      }
    ];

    const response = await client.getChatCompletions(deploymentName, messages, {
      temperature: 0.3,
      maxTokens: 500,
    });

    return response.choices[0]?.message?.content || translatedText;
  } catch (error) {
    console.error('Azure OpenAI Translation Error:', error);
    return translatedText;
  }
};

export const validateLegalDocument = async (documentText: string): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}> => {
  if (!isConfigured || !client) {
    return {
      isValid: true,
      issues: [],
      suggestions: ['Document validation is currently unavailable.']
    };
  }

  try {
    const messages = [
      { 
        role: 'system', 
        content: 'You are a legal document validator. Check the document for completeness and legal requirements.' 
      },
      { 
        role: 'user', 
        content: `Please validate this legal document: ${documentText}` 
      }
    ];

    const response = await client.getChatCompletions(deploymentName, messages, {
      temperature: 0.2,
      maxTokens: 1000,
    });

    const validation = response.choices[0]?.message?.content;
    if (!validation) {
      throw new Error('No validation response received');
    }

    try {
      return JSON.parse(validation);
    } catch {
      return {
        isValid: true,
        issues: [],
        suggestions: [validation]
      };
    }
  } catch (error) {
    console.error('Azure OpenAI Validation Error:', error);
    return {
      isValid: false,
      issues: ['Failed to validate document'],
      suggestions: ['Please try again later or proceed with manual validation.']
    };
  }
};
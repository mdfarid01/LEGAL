import axios from 'axios';

const BHASHINI_API_KEY = 'your-api-key'; // Replace with actual API key
const BHASHINI_API_URL = 'https://bhashini.gov.in/api/v1';

interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export const translateText = async (
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResponse> => {
  try {
    const response = await axios.post(`${BHASHINI_API_URL}/translate`, {
      text,
      sourceLanguage,
      targetLanguage,
    }, {
      headers: {
        'Authorization': `Bearer ${BHASHINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Bhashini API Error:', error);
    throw new Error('Translation failed');
  }
};

export const detectLanguage = async (text: string): Promise<string> => {
  try {
    const response = await axios.post(`${BHASHINI_API_URL}/detect`, {
      text,
    }, {
      headers: {
        'Authorization': `Bearer ${BHASHINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.language;
  } catch (error) {
    console.error('Bhashini API Error:', error);
    throw new Error('Language detection failed');
  }
};
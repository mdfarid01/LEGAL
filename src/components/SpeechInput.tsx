import React, { useEffect, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { translateText } from '../services/bhashini';

interface SpeechInputProps {
  onTranscript: (text: string) => void;
}

export const SpeechInput: React.FC<SpeechInputProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (window.webkitSpeechRecognition) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onresult = async (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');

        setIsTranslating(true);
        try {
          // Translate to English for processing
          const translatedResult = await translateText(
            transcript,
            selectedLanguage.split('-')[0],
            'en'
          );
          onTranscript(translatedResult.translatedText);
        } catch (error) {
          console.error('Translation error:', error);
          // Fallback to original transcript if translation fails
          onTranscript(transcript);
        } finally {
          setIsTranslating(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, [onTranscript, selectedLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
    setIsListening(!isListening);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    }
    if (recognition) {
      recognition.lang = language;
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <LanguageSelector
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
      />
      <button
        onClick={toggleListening}
        disabled={isTranslating}
        className={`p-3 rounded-full ${
          isListening ? 'bg-red-500' : 'bg-blue-500'
        } text-white hover:opacity-90 transition-opacity flex items-center space-x-2 ${
          isTranslating ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>
      {isTranslating && (
        <span className="text-sm text-gray-600">Translating...</span>
      )}
    </div>
  );
};
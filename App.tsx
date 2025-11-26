import React, { useState, useRef, useEffect } from 'react';
import { AppState, AnalysisResult, HAIR_STYLE_TEMPLATES, Language } from './types';
import { analyzeScalpImage, generateRestorationPreview } from './services/geminiService';
import AnalysisDashboard from './components/AnalysisDashboard';
import SimulationPreview from './components/SimulationPreview';
import { getTranslation } from './translations';

const App: React.FC = () => {
  // Start with Arabic as requested
  const [language, setLanguage] = useState<Language>('ar');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [image, setImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [simulationImage, setSimulationImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = getTranslation(language);

  // Handle document direction and language attributes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        startAnalysis(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // Simple implementation triggering file input with capture="user"
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const startAnalysis = async (imgData: string) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    try {
      const result = await analyzeScalpImage(imgData, language);
      setAnalysisResult(result);
      setAppState(AppState.RESULTS);
    } catch (error: any) {
      console.error(error);
      let message = language === 'ar' ? "فشل تحليل الصورة. يرجى تجربة صورة أوضح." : "Failed to analyze image. Please try a clearer photo.";
      
      // Specific check for missing API Key to help with Vercel deployment debugging
      if (error.message && (error.message.includes('API Key') || error.message.includes('403'))) {
        message = language === 'ar' 
          ? "مفتاح API مفقود. يرجى إضافته في إعدادات النشر." 
          : "API Key is missing or invalid. Please configure it in your deployment settings.";
      }
      
      setErrorMsg(message);
      setAppState(AppState.ERROR);
    }
  };

  const handleGeneratePreview = async (stylePrompt: string = HAIR_STYLE_TEMPLATES[0].prompt) => {
    if (!image) return;
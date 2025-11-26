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
    } catch (error) {
      console.error(error);
      setErrorMsg(language === 'ar' ? "فشل تحليل الصورة. يرجى تجربة صورة أوضح." : "Failed to analyze image. Please try a clearer photo.");
      setAppState(AppState.ERROR);
    }
  };

  const handleGeneratePreview = async (stylePrompt: string = HAIR_STYLE_TEMPLATES[0].prompt) => {
    if (!image) return;
    
    setAppState(AppState.GENERATING_PREVIEW);
    
    try {
      const generated = await generateRestorationPreview(image, stylePrompt);
      setSimulationImage(generated);
      setAppState(AppState.PREVIEW_READY);
    } catch (error) {
      console.error(error);
      setErrorMsg(language === 'ar' ? "فشل إنشاء المعاينة. حاول مرة أخرى." : "Failed to generate preview. Please try again.");
      setAppState(AppState.RESULTS);
      alert(language === 'ar' ? "تعذر إنشاء المحاكاة. يرجى المحاولة لاحقاً." : "Could not generate simulation. Please try again later.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setImage(null);
    setAnalysisResult(null);
    setSimulationImage(null);
    setErrorMsg(null);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 ${language === 'ar' ? 'font-sans' : ''}`}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">{t.appTitle}</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="px-3 py-1 rounded-md text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
            {appState !== AppState.IDLE && (
              <button onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-800 font-medium">
                {t.newAnalysis}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center relative">
        
        {/* IDLE STATE - HERO */}
        {appState === AppState.IDLE && (
          <div className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center text-center animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              {t.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl">
              {t.heroSubtitle}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t.uploadBtn}
                </button>

                <button
                  onClick={handleCameraCapture} 
                  className="flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-700 transition-all bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t.selfieBtn}
                </button>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
            />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 font-bold">1</div>
                  <h3 className="font-bold text-slate-800 mb-2">{t.step1Title}</h3>
                  <p className="text-sm text-slate-500">{t.step1Desc}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 font-bold">2</div>
                  <h3 className="font-bold text-slate-800 mb-2">{t.step2Title}</h3>
                  <p className="text-sm text-slate-500">{t.step2Desc}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 font-bold">3</div>
                  <h3 className="font-bold text-slate-800 mb-2">{t.step3Title}</h3>
                  <p className="text-sm text-slate-500">{t.step3Desc}</p>
               </div>
            </div>
          </div>
        )}

        {/* ANALYZING STATE */}
        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
             <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.analyzingTitle}</h2>
             <p className="text-slate-500">{t.analyzingDesc}</p>
          </div>
        )}

        {/* RESULTS STATE */}
        {appState === AppState.RESULTS && analysisResult && (
          <AnalysisDashboard 
            result={analysisResult} 
            onGeneratePreview={() => handleGeneratePreview()} 
            lang={language}
          />
        )}

        {/* GENERATING PREVIEW STATE */}
        {appState === AppState.GENERATING_PREVIEW && (
          <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
             <div className="relative w-24 h-24 mb-6">
                {/* Sparkles icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.simulatingTitle}</h2>
             <p className="text-slate-500">{t.simulatingDesc}</p>
          </div>
        )}

        {/* PREVIEW READY STATE */}
        {appState === AppState.PREVIEW_READY && image && simulationImage && (
          <SimulationPreview
            originalImage={image}
            generatedImage={simulationImage}
            onRegenerate={handleGeneratePreview}
            isRegenerating={false}
            lang={language}
          />
        )}

        {/* ERROR STATE */}
        {appState === AppState.ERROR && (
           <div className="max-w-md p-6 bg-white rounded-xl shadow-lg border border-red-100 text-center">
             <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">{t.errorTitle}</h3>
             <p className="text-slate-600 mb-6">{errorMsg || (language === 'ar' ? "حدث خطأ غير متوقع." : "An unexpected error occurred.")}</p>
             <button onClick={handleReset} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">{t.tryAgain}</button>
           </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} {t.appTitle}. {t.footerDisclaimer}
            </p>
         </div>
      </footer>
    </div>
  );
};

export default App;
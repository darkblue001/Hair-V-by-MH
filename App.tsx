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
    
    // If we are already in PREVIEW_READY, it means we are regenerating a new style
    const isRegenerating = appState === AppState.PREVIEW_READY;
    setAppState(AppState.GENERATING_PREVIEW);

    try {
      const result = await generateRestorationPreview(image, stylePrompt);
      setSimulationImage(result);
      setAppState(AppState.PREVIEW_READY);
    } catch (error) {
      console.error(error);
      if (!isRegenerating) {
        setAppState(AppState.RESULTS);
      } else {
        // If regeneration failed, go back to ready state so user can try again
        setAppState(AppState.PREVIEW_READY);
      }
      alert(language === 'ar' ? "فشل توليد المحاكاة." : "Simulation generation failed.");
    }
  };

  const handleReset = () => {
    setImage(null);
    setAnalysisResult(null);
    setSimulationImage(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
       {/* Header */}
       <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">H</div>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
               {t.appTitle}
             </h1>
           </div>
           
           <div className="flex items-center gap-4">
             {appState !== AppState.IDLE && (
               <button onClick={handleReset} className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                 {t.newAnalysis}
               </button>
             )}
             <button 
               onClick={toggleLanguage}
               className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors"
             >
               {language === 'en' ? 'العربية' : 'English'}
             </button>
           </div>
         </div>
       </header>

       <main className="pb-20">
         {appState === AppState.IDLE && (
            // Hero Section
            <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
               <div className="text-center max-w-3xl mx-auto mb-16">
                 <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                   {t.heroTitle}
                 </h2>
                 <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                   {t.heroSubtitle}
                 </p>
                 
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {t.uploadBtn}
                    </button>
                    <button 
                      onClick={handleCameraCapture}
                      className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                    >
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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
               </div>
               
               {/* Steps */}
               <div className="grid md:grid-cols-3 gap-8 mt-12">
                  {[
                    { title: t.step1Title, desc: t.step1Desc, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
                    { title: t.step2Title, desc: t.step2Desc, icon: "M9 7h6m0 3.666V19.102a2 2 0 01-2 2H3.5a2.5 2.5 0 010-5h2.5a2.5 2.5 0 010-5h.334a2 2 0 012-2H13a2 2 0 012 2zm3-5a1 1 0 11-2 0 1 1 0 012 0z" },
                    { title: t.step3Title, desc: t.step3Desc, icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }
                  ].map((step, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-slate-600">{step.desc}</p>
                    </div>
                  ))}
               </div>
            </div>
         )}

         {(appState === AppState.ANALYZING || (appState === AppState.GENERATING_PREVIEW && !simulationImage)) && (
            <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {appState === AppState.ANALYZING ? t.analyzingTitle : t.simulatingTitle}
              </h3>
              <p className="text-slate-500 animate-pulse">
                {appState === AppState.ANALYZING ? t.analyzingDesc : t.simulatingDesc}
              </p>
            </div>
         )}

         {appState === AppState.RESULTS && analysisResult && (
           <AnalysisDashboard 
             result={analysisResult} 
             onGeneratePreview={() => handleGeneratePreview()} 
             lang={language}
           />
         )}

         {(appState === AppState.PREVIEW_READY || (appState === AppState.GENERATING_PREVIEW && simulationImage)) && image && simulationImage && (
           <SimulationPreview 
             originalImage={image}
             generatedImage={simulationImage}
             onRegenerate={handleGeneratePreview}
             isRegenerating={appState === AppState.GENERATING_PREVIEW}
             lang={language}
           />
         )}

         {appState === AppState.ERROR && (
           <div className="max-w-md mx-auto mt-20 p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
             <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">{t.errorTitle}</h3>
             <p className="text-slate-600 mb-6">{errorMsg || "An unexpected error occurred."}</p>
             <button 
               onClick={handleReset}
               className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
             >
               {t.tryAgain}
             </button>
           </div>
         )}

       </main>

       {/* Footer */}
       <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
            <p>{t.footerDisclaimer}</p>
            <p className="mt-2">&copy; {new Date().getFullYear()} {t.appTitle}. All rights reserved.</p>
          </div>
       </footer>
    </div>
  );
};

export default App;
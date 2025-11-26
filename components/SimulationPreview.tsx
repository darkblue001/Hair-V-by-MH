import React, { useState } from 'react';
import { HAIR_STYLE_TEMPLATES, Language } from '../types';
import { getTranslation } from '../translations';

interface SimulationPreviewProps {
  originalImage: string;
  generatedImage: string;
  onRegenerate: (stylePrompt: string) => void;
  isRegenerating: boolean;
  lang: Language;
}

const SimulationPreview: React.FC<SimulationPreviewProps> = ({
  originalImage,
  generatedImage,
  onRegenerate,
  isRegenerating,
  lang
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(HAIR_STYLE_TEMPLATES[0].id);
  const t = getTranslation(lang);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  const handleStyleChange = (id: string, prompt: string) => {
    setSelectedStyleId(id);
    onRegenerate(prompt);
  };

  // Map translations to style IDs
  const getStyleLabel = (id: string) => {
    switch (id) {
      case 'natural': return t.style_natural;
      case 'dense': return t.style_dense;
      case 'conservative': return t.style_conservative;
      case 'buzz': return t.style_buzz;
      default: return id;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">{t.transformTitle}</h2>
        <p className="text-slate-600">{t.dragSlider}</p>
      </div>

      {/* Comparison Slider - Force LTR for slider mechanics to stay consistent */}
      <div className="relative w-full max-w-3xl mx-auto h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl mb-10 select-none" dir="ltr">
        {/* Background Image (After) */}
        <img
          src={generatedImage}
          alt="After"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />

        {/* Foreground Image (Before) - Clipped */}
        <div
          className="absolute top-0 left-0 w-full h-full overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={originalImage}
            alt="Before"
            className="absolute top-0 left-0 w-[100vw] max-w-3xl h-full object-cover"
            style={{ width: '100%', maxWidth: 'none' }} 
          />
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
          </div>
        </div>

        {/* Range Input for Interaction */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-ew-resize z-20"
        />
        
        {/* Labels - Absolute positioned, will stay Left/Right because of dir="ltr" on parent container */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium pointer-events-none">{t.before}</div>
        <div className="absolute bottom-4 right-4 bg-blue-600/80 text-white px-3 py-1 rounded-full text-sm font-medium pointer-events-none">{t.after}</div>
      </div>

      {/* Style Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-3xl mx-auto">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t.stylesTitle}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {HAIR_STYLE_TEMPLATES.map((style) => (
            <button
              key={style.id}
              onClick={() => handleStyleChange(style.id, style.prompt)}
              disabled={isRegenerating}
              className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                selectedStyleId === style.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              } ${isRegenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {getStyleLabel(style.id)}
            </button>
          ))}
        </div>
        {isRegenerating && (
          <div className="mt-4 flex items-center justify-center text-blue-600 text-sm animate-pulse">
            <svg className="animate-spin mx-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t.generating}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationPreview;
import React from 'react';
import { AnalysisResult, Language } from '../types';
import { getTranslation } from '../translations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface AnalysisDashboardProps {
  result: AnalysisResult;
  onGeneratePreview: () => void;
  lang: Language;
}

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8'];

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ result, onGeneratePreview, lang }) => {
  const t = getTranslation(lang);
  
  const costData = [
    { name: t.minEst, cost: result.estimatedCostMin },
    { name: t.maxEst, cost: result.estimatedCostMax },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{t.reportTitle}</h2>
        <p className="text-slate-600 max-w-2xl mx-auto" dir="auto">{result.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">{t.norwoodLabel}</span>
          <div className="text-5xl font-extrabold text-blue-600">{result.norwoodScale}</div>
          <span className="text-xs text-slate-400 mt-2">{t.scaleRange}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">{t.graftsLabel}</span>
          <div className="text-5xl font-extrabold text-blue-600">{result.totalGrafts.toLocaleString()}</div>
          <span className="text-xs text-slate-400 mt-2">{t.graftsEst}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">{t.costLabel}</span>
          <div className="text-3xl font-bold text-slate-800" dir="ltr">
            ${(result.estimatedCostMin / 1000).toFixed(1)}k - ${(result.estimatedCostMax / 1000).toFixed(1)}k
          </div>
          <span className="text-xs text-slate-400 mt-2">{t.costSub}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Charts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">{t.zoneDist}</h3>
          <div className="h-64" dir="ltr"> 
            {/* Charts forced LTR to keep legends correct usually, but Recharts handles some of it. Keeping LTR for charts ensures standard rendering */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={result.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {result.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">{t.costProj}</h3>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']} />
                <Bar dataKey="cost" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="text-center mt-12">
        <button
          onClick={onGeneratePreview}
          className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1"
        >
          <span>{t.visualizeBtn}</span>
          <svg className={`w-5 h-5 mx-2 transition-transform duration-200 ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        <p className="mt-4 text-sm text-slate-500">
          {t.visualizeSub}
        </p>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
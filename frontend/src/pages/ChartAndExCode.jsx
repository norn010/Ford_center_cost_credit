import { useState } from 'react';
import { Database, Zap } from 'lucide-react';
import BrandAccPage from '../components/BrandAccPage';
import ComExPage from '../components/ComExPage';

export default function ChartAndExCode() {
  const [activeTab, setActiveTab] = useState('brand');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/20 custom-scrollbar overflow-y-auto p-4 md:p-8 lg:p-12">
      <div className="max-w-[1700px] mx-auto w-full space-y-8 pb-20">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Database className="w-10 h-10 text-indigo-600" />
              ผังบัญชีและEX code
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              จัดการข้อมูลผังบัญชีแต่ละแบรนด์และรหัส Express Code
            </p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveTab('brand')}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'brand'
                  ? 'bg-white text-indigo-600 shadow-md scale-105'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Database size={18} />
              Brand Account
            </button>
            <button
              onClick={() => setActiveTab('comex')}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'comex'
                  ? 'bg-white text-indigo-600 shadow-md scale-105'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Zap size={18} />
              Express Code
            </button>
          </div>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {activeTab === 'brand' ? <BrandAccPage /> : <ComExPage />}
        </div>
      </div>
    </div>
  );
}

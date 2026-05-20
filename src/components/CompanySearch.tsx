import React from 'react';
import { 
  Search, 
  Building2, 
  MapPin, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  Layers,
  Zap
} from 'lucide-react';

const CompanySearch: React.FC = () => {
  const [query, setQuery] = React.useState('');
  
  const results = [
    { id: 1, name: 'TECHNOVA s.r.o.', ico: '36123456', address: 'Mlynské nivy 12, Bratislava', status: 'Aktívna', type: 'S.R.O.' },
    { id: 2, name: 'BUILD-UP a.s.', ico: '44123789', address: 'Letná 45, Košice', status: 'V likvidácii', type: 'A.S.' },
    { id: 3, name: 'GREEN-SOLUTIONS', ico: '50987654', address: 'Hlavná 1, Žilina', status: 'Aktívna', type: 'Živnosť' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Inteligentný vyhľadávač firiem</h1>
        <p className="text-slate-400">Nájdite svojich partnerov a overte ich údaje v reálnom čase pomocou AI.</p>
      </header>

      {/* Main Search Area */}
      <div className="relative mb-12 group">
        <div className="absolute inset-0 bg-[#00f2ff]/5 blur-[40px] rounded-[32px] group-hover:bg-[#00f2ff]/10 transition-all"></div>
        <div className="relative p-8 rounded-[40px] bg-[#111928]/60 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00f2ff]" size={28} />
            <input 
              type="text" 
              placeholder="Zadajte názov firmy, IČO alebo adresu..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-xl focus:border-[#00f2ff]/50 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <button className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-2">
              <Filter size={14} /> Filtrovať podľa lokality
            </button>
            <button className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-2">
              <Layers size={14} /> Právna forma
            </button>
            <button className="px-5 py-2 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/20 text-xs font-bold text-[#00f2ff] hover:bg-[#00f2ff]/20 transition-all flex items-center gap-2 ml-auto">
              <Zap size={14} /> AI Inteligentné hľadanie
            </button>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((company, i) => (
          <div key={i} className="p-8 rounded-[32px] bg-[#111928]/40 border border-white/5 hover:border-[#00f2ff]/30 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[#00f2ff] group-hover:scale-110 transition-all">
                <Building2 size={28} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                company.status === 'Aktívna' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {company.status}
              </span>
            </div>
            
            <h3 className="text-xl font-bold mb-1">{company.name}</h3>
            <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-wider">{company.type} • IČO: {company.ico}</p>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin size={16} className="text-slate-600" />
                <span className="truncate">{company.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Globe size={16} className="text-slate-600" />
                <span className="hover:text-[#00f2ff] cursor-pointer transition-colors">www.{company.name.toLowerCase().split(' ')[0]}.sk</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                Detail firmy
              </button>
              <button className="w-12 h-12 bg-[#00f2ff] rounded-xl flex items-center justify-center text-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                <Plus size={20} />
              </button>
            </div>

            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {company.status === 'Aktívna' ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-red-500" />}
            </div>
          </div>
        ))}
        
        {/* Placeholder for more results */}
        <div className="p-8 rounded-[32px] border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-600 group hover:border-[#00f2ff]/30 hover:text-slate-400 transition-all cursor-pointer">
          <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center mb-4">
            <Plus size={24} />
          </div>
          <p className="text-sm font-bold">Zobraziť ďalšie výsledky</p>
        </div>
      </div>
    </div>
  );
};

const Plus: React.FC<{ size: number, className?: string }> = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default CompanySearch;

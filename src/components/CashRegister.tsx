import React from 'react';
import { 
  Receipt, 
  ArrowUpRight, 
  Plus, 
  Filter,
  BarChart3,
  TrendingUp,
  Package,
  Calendar,
  FileText
} from 'lucide-react';
import { useDocuments } from '../contexts/DocumentContext';

const CashRegister: React.FC = () => {
  const { documents } = useDocuments();
  const receipts = documents.filter(doc => doc.type === 'Bloček');
  const totalAmount = receipts.reduce((sum, doc) => sum + (doc.amount || 0), 0);

  const stats = [
    { title: 'Celkové výdavky (Bločky)', value: `${totalAmount.toFixed(2)} €`, change: receipts.length > 0 ? '+12%' : '0%', positive: false, icon: Receipt },
    { title: 'Spotreba materiálu', value: '2,840.00 €', change: '-5%', positive: true, icon: Package },
    { title: 'Zostávajúci rozpočet', value: '1,250.00 €', change: '+2%', positive: true, icon: TrendingUp },
  ];



  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold mb-2">Pokladňa</h1>
          <p className="text-slate-400">Analýza nákladov a správa bločkov</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2">
            <Filter size={18} /> Filtre
          </button>
          <button className="bg-[#00f2ff] text-black px-6 py-2.5 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all flex items-center gap-2 group">
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Nahrať bloček
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="p-8 rounded-[32px] bg-[#111928]/40 border border-white/5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00f2ff]/10 flex items-center justify-center text-[#00f2ff]">
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">{stat.title}</p>
            <h3 className="text-3xl font-black">{stat.value}</h3>
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f2ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Material Consumption Chart */}
        <div className="lg:col-span-2 p-8 rounded-[32px] bg-[#111928]/40 border border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 size={20} className="text-[#00f2ff]" /> Spotreba materiálu
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar size={14} /> Posledných 7 dní
            </div>
          </div>
          
          <div className="h-64 flex items-end gap-3 px-4">
            {[35, 65, 45, 90, 55, 75, 40].map((h, i) => (
              <div key={i} className="flex-1 relative group">
                <div 
                  className="w-full bg-gradient-to-t from-[#00f2ff]/20 to-[#00f2ff] rounded-t-xl transition-all duration-500 group-hover:opacity-80"
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#111928] border border-white/10 px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {h * 10}€
                  </div>
                </div>
                <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase text-center">Deň {i+1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="p-8 rounded-[32px] bg-[#111928]/40 border border-white/5">
          <h3 className="text-lg font-bold mb-8">Posledné bločky</h3>
          <div className="space-y-4">
            {receipts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm font-medium">Zatiaľ neboli nahraté žiadne bločky.</div>
            ) : (
              receipts.map((receipt) => (
                <div key={receipt.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00f2ff]/30 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-[#00f2ff] transition-colors">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold truncate w-32">{receipt.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{receipt.category || 'Nezaradené'}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black">{(receipt.amount || 0).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                    <span>{receipt.date}</span>
                    <ArrowUpRight size={14} className="group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))
            )}
            {receipts.length > 0 && (
              <button className="w-full py-3 text-sm font-bold text-slate-500 hover:text-white transition-colors border border-dashed border-white/10 rounded-2xl mt-4">
                Zobraziť všetky transakcie
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Material categories summary */}
      <div className="mt-8 p-8 rounded-[32px] bg-[#111928]/40 border border-white/5">
        <h3 className="text-lg font-bold mb-6">Rozdelenie nákladov</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Betón & Cement', value: '45%', color: '#00f2ff' },
            { label: 'Izolácie', value: '25%', color: '#a855f7' },
            { label: 'Doprava', value: '20%', color: '#f59e0b' },
            { label: 'Ostatné', value: '10%', color: '#64748b' }
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: item.value, backgroundColor: item.color }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CashRegister;

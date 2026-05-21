import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet, Play } from 'lucide-react';
import { useDocuments } from '../contexts/DocumentContext';

interface AccountingCheckProps {
  onBack: () => void;
  activeCompany: string;
}

const AccountingCheck: React.FC<AccountingCheckProps> = ({ onBack, activeCompany }) => {
  const { documents } = useDocuments();
  const [pastedData, setPastedData] = useState('');
  const [hasRun, setHasRun] = useState(false);

  const [results, setResults] = useState<{
    matched: any[];
    missingInAccounting: any[];
    missingInDocuvia: any[];
    mismatchedAmount: any[];
  }>({ matched: [], missingInAccounting: [], missingInDocuvia: [], mismatchedAmount: [] });

  const handleRunCheck = () => {
    // 1. Získať dokumenty aktuálnej firmy
    const norm = (s: string) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = norm(activeCompany);
    const companyDocs = documents.filter(doc => {
      const s = norm(doc.supplier || '');
      const c = norm(doc.customer || '');
      if (!s && !c) return true;
      return s === a || c === a;
    });

    // 2. Parse pasted data
    // Očakávame formát napr z Excelu (číslo faktúry \t suma)
    const lines = pastedData.split('\n').filter(l => l.trim() !== '');
    const accRecords = lines.map(line => {
      // Skúsime tab alebo bodkočiarku alebo len medzery
      const parts = line.split(/\t|;/);
      if (parts.length >= 2) {
        // prvé je číslo, posledné/druhé je suma
        const name = parts[0].trim();
        const rawAmount = parts[parts.length - 1].replace(',', '.').replace(/[^0-9.-]/g, '');
        const amount = parseFloat(rawAmount);
        return { name, amount: isNaN(amount) ? 0 : amount, original: line };
      }
      
      // Fallback: ak to skopírovali bez tabu, len medzery
      const spaceParts = line.split(/\s+/);
      const name = spaceParts[0];
      const rawAmount = spaceParts[spaceParts.length - 1].replace(',', '.').replace(/[^0-9.-]/g, '');
      const amount = parseFloat(rawAmount);
      return { name, amount: isNaN(amount) ? 0 : amount, original: line };
    }).filter(r => r.name);

    // 3. Porovnanie
    const matched: any[] = [];
    const missingInAccounting: any[] = [];
    const mismatchedAmount: any[] = [];

    // Kópia účtovných záznamov, aby sme vedeli, čo zvýšilo
    let remainingAcc = [...accRecords];

    companyDocs.forEach(doc => {
      if ((doc as any).classification?.documentType !== 'faktúra' && doc.type !== 'Faktúra') {
         // Kontrolujeme len faktúry? Môžeme všetko, ale faktúry sú hlavné
      }

      const docNameNorm = (doc.name || '').toLowerCase().trim();
      
      // Hľadáme zhodu v účtovníctve
      const accIndex = remainingAcc.findIndex(acc => 
        acc.name.toLowerCase().trim() === docNameNorm || 
        docNameNorm.includes(acc.name.toLowerCase().trim()) ||
        acc.name.toLowerCase().trim().includes(docNameNorm)
      );

      if (accIndex !== -1) {
        const accRecord = remainingAcc[accIndex];
        const docAmount = doc.amount || 0;
        
        // Zhoduje sa aj suma? (tolerancia 1 cent kvoli zaokruhlovaniu)
        if (Math.abs(docAmount - accRecord.amount) < 0.02) {
          matched.push({ doc, accRecord });
        } else {
          mismatchedAmount.push({ doc, accRecord });
        }
        
        remainingAcc.splice(accIndex, 1);
      } else {
        missingInAccounting.push({ doc });
      }
    });

    const missingInDocuvia = remainingAcc;

    setResults({ matched, missingInAccounting, missingInDocuvia, mismatchedAmount });
    setHasRun(true);
  };

  return (
    <div className="min-h-screen bg-[#0b111a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} /> Späť na dokumenty
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#00f2ff] to-[#00d1ff] rounded-2xl flex items-center justify-center text-black shadow-[0_0_30px_rgba(0,242,255,0.3)]">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kontrola s účtovníctvom</h1>
            <p className="text-slate-400">Porovnajte export z vášho účtovného programu so záznamami v DocuVia pre firmu {activeCompany}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-[#111928] border border-white/10 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f2ff]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                1. Vložte dáta
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Skopírujte stĺpce z Excelu (Číslo faktúry a Suma) a vložte ich sem. 
              </p>
              <textarea 
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="Príklad:&#10;FA-2023-001    1540.00&#10;FA-2023-002    45.50"
                className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-[#00f2ff]/50 transition-colors mb-4 custom-scrollbar"
              />
              <button 
                onClick={handleRunCheck}
                disabled={!pastedData.trim()}
                className="w-full bg-[#00f2ff] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#00d1ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,242,255,0.2)]"
              >
                <Play size={18} /> Spustiť kontrolu
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {hasRun ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {/* Spárované */}
                <div className="bg-[#111928] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-green-400 flex items-center gap-2 mb-4">
                    <CheckCircle2 size={20} /> Všetko sedí ({results.matched.length})
                  </h3>
                  {results.matched.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                      {results.matched.map((m, i) => (
                        <div key={i} className="flex justify-between items-center text-sm bg-white/5 p-2 rounded-lg">
                          <span className="font-medium text-slate-300">{m.doc.name}</span>
                          <span className="font-bold">{m.doc.amount?.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Žiadne spárované doklady.</p>
                  )}
                </div>

                {/* Nesúlad súm */}
                {results.mismatchedAmount.length > 0 && (
                  <div className="bg-[#111928] border border-orange-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2 mb-4">
                      <AlertTriangle size={20} /> Nesúlad v sume ({results.mismatchedAmount.length})
                    </h3>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                      {results.mismatchedAmount.map((m, i) => (
                        <div key={i} className="flex justify-between items-center text-sm bg-orange-500/10 p-2 rounded-lg border border-orange-500/20">
                          <span className="font-medium">{m.doc.name}</span>
                          <div className="flex gap-4">
                            <span className="text-slate-400">Účt.: <strong className="text-white">{m.accRecord.amount.toFixed(2)} €</strong></span>
                            <span className="text-slate-400">DocuVia: <strong className="text-white">{m.doc.amount?.toFixed(2)} €</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chýba v Účtovníctve */}
                <div className="bg-[#111928] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4">
                    <XCircle size={20} /> Chýba v účtovníctve ({results.missingInAccounting.length})
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Tieto doklady sú v DocuVia, ale nenašli sa vo vloženom zozname.</p>
                  {results.missingInAccounting.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                      {results.missingInAccounting.map((m, i) => (
                        <div key={i} className="flex justify-between items-center text-sm bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                          <span className="font-medium text-red-200">{m.doc.name}</span>
                          <span className="font-bold text-red-200">{m.doc.amount?.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Všetky doklady z DocuVia sú zaevidované.</p>
                  )}
                </div>

                {/* Chýba v DocuVia */}
                <div className="bg-[#111928] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2 mb-4">
                    <AlertTriangle size={20} /> Chýba v DocuVia ({results.missingInDocuvia.length})
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Tieto doklady má účtovníčka zaevidované, ale fyzicky nie sú nahraté v DocuVia.</p>
                  {results.missingInDocuvia.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                      {results.missingInDocuvia.map((m, i) => (
                        <div key={i} className="flex justify-between items-center text-sm bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                          <span className="font-medium text-yellow-200">{m.name}</span>
                          <span className="font-bold text-yellow-200">{m.amount.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Žiadne chýbajúce doklady.</p>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full bg-[#111928]/50 border border-white/5 rounded-[32px] border-dashed flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-500 mb-6">
                  <FileSpreadsheet size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Čakám na dáta</h3>
                <p className="text-slate-400 max-w-md">
                  Po vložení záznamov a spustení kontroly sa tu zobrazí detailné porovnanie. Systém inteligentne spáruje faktúry a odhalí akékoľvek nezrovnalosti.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingCheck;

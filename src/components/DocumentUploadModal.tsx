import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { useDocuments } from '../contexts/DocumentContext';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile: File | null;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, initialFile }) => {
  const { addDocument } = useDocuments();
  
  const [step, setStep] = useState<'analyzing' | 'success'>('analyzing');


  useEffect(() => {
    if (isOpen && initialFile) {
      setStep('analyzing');
      const timer = setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        
        const generatedName = `FA-${Math.floor(1000 + Math.random() * 9000)}`;
        const typeStr = initialFile.name.toLowerCase().includes('blocek') || initialFile.name.toLowerCase().includes('receipt') ? 'Bloček' : 'Faktúra';
        const generatedAmount = parseFloat((Math.random() * 500 + 10).toFixed(2));

        const newDoc = {
          id: Date.now(),
          name: generatedName,
          type: typeStr,
          date: today,
          status: 'Spracované' as const,
          size: initialFile ? `${(initialFile.size / 1024 / 1024).toFixed(2)} MB` : '1.2 MB',
          supplier: 'TechCorp s.r.o.',
          customer: 'Naša Firma a.s.',
          amount: generatedAmount
        };
        
        addDocument(newDoc);
        setStep('success');
        
        setTimeout(() => {
          handleClose();
        }, 1500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, initialFile]);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('analyzing');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b111a]/80 backdrop-blur-sm" onClick={step !== 'analyzing' ? handleClose : undefined}></div>
      
      <div className="relative w-full max-w-xl bg-[#111928] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {step === 'analyzing' && <><Sparkles className="text-[#00f2ff]" size={20} /> AI Analýza dokumentu</>}
            {step === 'success' && 'Úspešne spracované'}
          </h2>
          {step !== 'analyzing' && (
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'analyzing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#00f2ff] rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText size={32} className="text-[#00f2ff]" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">DocuVia AI spracováva dáta...</h3>
              <p className="text-sm text-slate-400">
                Extrahujem informácie o dodávateľovi, sume a dátume dodania zo súboru <br/> 
                <strong className="text-white mt-1 block">{initialFile?.name}</strong>
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in">
              <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2">Dokument bol úspešne uložený!</h3>
              <p className="text-sm text-slate-400">
                Nájdete ho v zozname dokumentov.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;

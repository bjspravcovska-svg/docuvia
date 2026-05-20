import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Document {
  id: number;
  name: string;
  type: string;
  date: string;
  status: 'Spracované' | 'Čaká' | 'Chyba';
  size: string;
  supplier?: string;
  customer?: string;
  amount?: number;
  category?: string;
  fileUrl?: string;
  fileType?: string;
  supplierIco?: string;
  supplierDic?: string;
  supplierIcDph?: string;
  customerIco?: string;
  customerDic?: string;
  customerIcDph?: string;
  dueDate?: string;
  deliveryDate?: string;
  fullData?: { key: string; value: string }[];
}

interface DocumentContextType {
  documents: Document[];
  addDocument: (doc: Document) => void;
  removeDocument: (id: number) => void;
  updateDocument: (id: number, updatedFields: Partial<Document>) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: ReactNode; userEmail: string; companyName: string }> = ({ children, userEmail, companyName }) => {
  const storageKey = `docuvia_docs_${userEmail}_${companyName}`;
  
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);
    
    // Defaultné dáta len pre testovací účet, aby nevyzeral prázdny
    if (userEmail === 'test@docuvia.sk') {
      return [
        { id: 1, name: 'FA-2023-001', type: 'Faktúra', date: '2023-10-25', status: 'Spracované', size: '2.4 MB', supplier: 'TechCorp s.r.o.', customer: 'Naša Firma a.s.', amount: 1540.00 },
        { id: 2, name: 'Bloček OMV', type: 'Bloček', date: '2023-10-24', status: 'Spracované', size: '0.8 MB', supplier: 'OMV Slovensko', amount: 45.50 }
      ];
    }
    return [];
  });

  // Uloženie pri každej zmene
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(documents));
  }, [documents, storageKey]);

  // Ak sa zmení používateľ (bez tvrdého refresnu), načítame jeho dáta
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setDocuments(JSON.parse(saved));
    } else if (userEmail === 'test@docuvia.sk' && companyName === 'Testovacia Firma s.r.o.') {
      setDocuments([
        { id: 1, name: 'FA-2023-001', type: 'Faktúra', date: '2023-10-25', status: 'Spracované', size: '2.4 MB', supplier: 'TechCorp s.r.o.', customer: 'Naša Firma a.s.', amount: 1540.00 },
        { id: 2, name: 'Bloček OMV', type: 'Bloček', date: '2023-10-24', status: 'Spracované', size: '0.8 MB', supplier: 'OMV Slovensko', amount: 45.50 }
      ]);
    } else {
      setDocuments([]);
    }
  }, [userEmail, companyName, storageKey]);

  const addDocument = (doc: Document) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const removeDocument = (id: number) => {
    setDocuments((prev) => prev.filter(doc => doc.id !== id));
  };

  const updateDocument = (id: number, updatedFields: Partial<Document>) => {
    setDocuments((prev) => prev.map(doc => doc.id === id ? { ...doc, ...updatedFields } : doc));
  };

  return (
    <DocumentContext.Provider value={{ documents, addDocument, removeDocument, updateDocument }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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
  supplierRaw?: string;
  customerRaw?: string;
  paymentRaw?: string;
  itemsRaw?: string;
  otherRaw?: string;
  isPaid?: boolean;
  isChecked?: boolean;
}

interface DocumentContextType {
  documents: Document[];
  addDocument: (doc: Omit<Document, 'id'>) => Promise<Document>;
  removeDocument: (id: number) => Promise<void>;
  updateDocument: (id: number, updatedFields: Partial<Document>) => Promise<void>;
  isLoading: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: ReactNode; userEmail: string; companyName: string }> = ({ children, userEmail, companyName }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Načítanie dát zo Supabase
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('userEmail', userEmail);
          
        if (error) {
          console.error("Chyba pri načítavaní zo Supabase:", error);
          return;
        }
        
        if (data) {
          setDocuments(data as Document[]);
        }
      } catch (err) {
        console.error("Chyba pripojenia k Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [userEmail]); // Obnovíme len keď sa zmení používateľ

  const addDocument = async (doc: Omit<Document, 'id'>) => {
    // Deduplikácia
    const isDuplicate = documents.some(d => 
      d.name === doc.name && 
      d.date === doc.date && 
      d.amount === doc.amount &&
      d.supplier === doc.supplier
    );
    
    if (isDuplicate) {
      // Vrátime prvý nájdený duplikát
      return documents.find(d => d.name === doc.name)!;
    }

    const newDocToInsert = {
      ...doc,
      userEmail,
      companyName
    };

    const { data, error } = await supabase
      .from('documents')
      .insert([newDocToInsert])
      .select();

    if (error) {
      console.error("Chyba pri zápise do Supabase:", error);
      throw error;
    }

    if (data && data.length > 0) {
      const insertedDoc = data[0] as Document;
      setDocuments(prev => [...prev, insertedDoc]);
      return insertedDoc;
    }
    
    throw new Error("Nepodarilo sa získať uložené dáta");
  };

  const removeDocument = async (id: number) => {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Chyba pri mazaní zo Supabase:", error);
      throw error;
    }

    setDocuments((prev) => prev.filter(doc => doc.id !== id));
  };

  const updateDocument = async (id: number, updatedFields: Partial<Document>) => {
    const { error } = await supabase
      .from('documents')
      .update(updatedFields)
      .eq('id', id);

    if (error) {
      console.error("Chyba pri úprave v Supabase:", error);
      throw error;
    }

    setDocuments((prev) => prev.map(doc => doc.id === id ? { ...doc, ...updatedFields } : doc));
  };

  return (
    <DocumentContext.Provider value={{ documents, addDocument, removeDocument, updateDocument, isLoading }}>
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

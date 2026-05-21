import type { Document } from '../contexts/DocumentContext';

export interface DocumentClassification {
  category: string;
  isDomestic: boolean;
  direction: 'prijatá' | 'vystavená' | 'interná' | 'neznáme';
  documentType: 'faktúra' | 'bloček' | 'zmluva' | 'výpis' | 'ostatné';
}

export function classifyDocument(doc: Document, activeCompany: string, userCompanies: string[] = []): DocumentClassification {
  // 1. Zistiť základný typ dokumentu
  let docType: DocumentClassification['documentType'] = 'ostatné';
  const typeStr = (doc.type || '').toLowerCase();
  
  if (typeStr.includes('faktúra') || typeStr.includes('faktura')) docType = 'faktúra';
  else if (typeStr.includes('bloček') || typeStr.includes('blok')) docType = 'bloček';
  else if (typeStr.includes('zmluva')) docType = 'zmluva';
  else if (typeStr.includes('výpis') || typeStr.includes('vypis')) docType = 'výpis';

  const supplier = (doc.supplier || '').trim();
  const customer = (doc.customer || '').trim();
  
  // 2. Smer: Prijatá vs Vystavená
  let direction: DocumentClassification['direction'] = 'neznáme';
  
  // Normalize names for comparison
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const activeNorm = norm(activeCompany);
  const userCompsNorm = userCompanies.map(norm);
  const supNorm = norm(supplier);
  const cusNorm = norm(customer);
  
  const isSupplierOurs = userCompsNorm.includes(supNorm) || supNorm === activeNorm;
  const isCustomerOurs = userCompsNorm.includes(cusNorm) || cusNorm === activeNorm;
  
  if (isSupplierOurs && isCustomerOurs) {
    if (activeNorm === supNorm) direction = 'vystavená';
    else if (activeNorm === cusNorm) direction = 'prijatá';
    else direction = 'interná';
  } else if (isSupplierOurs) {
    direction = 'vystavená';
  } else if (isCustomerOurs) {
    direction = 'prijatá';
  } else {
    // Fallback: ak náhodou nesedí presný názov
    direction = 'prijatá';
  }

  if (docType === 'bloček') direction = 'prijatá';

  // 3. Tuzemská vs Zahraničná (Domestic vs Foreign)
  let partnerIco = direction === 'prijatá' ? (doc.supplierIco || '') : (doc.customerIco || '');
  let partnerIcDph = direction === 'prijatá' ? (doc.supplierIcDph || '') : (doc.customerIcDph || '');
  let partnerName = direction === 'prijatá' ? supplier : customer;
  
  let isDomestic = true; // default
  
  partnerIcDph = partnerIcDph.trim().toUpperCase();
  
  if (partnerIcDph) {
    if (partnerIcDph.startsWith('SK')) isDomestic = true;
    else if (/^[A-Z]{2}/.test(partnerIcDph)) isDomestic = false; 
  } else {
    const nameLower = partnerName.toLowerCase();
    if (nameLower.includes('s.r.o.') || nameLower.includes('a.s.') || nameLower.includes('slovensko') || nameLower.includes('slovakia')) {
      isDomestic = true;
    } else if (nameLower.includes('gmbh') || nameLower.includes('ltd') || nameLower.includes('cz') || nameLower.includes('sp. z o.o.')) {
      isDomestic = false;
    }
  }

  // 4. Vytvoriť kategóriu
  let category = doc.type || 'Neznáme';
  
  if (docType === 'faktúra') {
    const dirStr = direction === 'prijatá' ? 'prijatá' : direction === 'vystavená' ? 'vystavená' : 'interná';
    const domStr = isDomestic ? 'tuzemská' : 'zahraničná';
    category = `Faktúra ${dirStr} - ${domStr}`;
  } else if (docType === 'bloček') {
    category = 'Bloček';
  } else if (docType === 'zmluva') {
    category = 'Zmluva';
  } else if (docType === 'výpis') {
    category = 'Výpis';
  } else {
    category = 'Ostatné';
  }

  return {
    category,
    isDomestic,
    direction,
    documentType: docType
  };
}

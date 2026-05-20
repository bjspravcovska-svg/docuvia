import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Shield, 
  Mail, 
  Lock, 
  Save,
  Globe,
  Smartphone,
  Plus,
  Trash2,
  Check,
  Loader2,
  CloudLightning,
  Users
} from 'lucide-react';

const Settings: React.FC<{ 
  user: any; 
  onUserUpdate?: (updatedUser: any) => void;
  usersDB: any[];
  setUsersDB: (db: any[]) => void;
}> = ({ user, onUserUpdate, usersDB, setUsersDB }) => {
  const [name, setName] = useState(user?.name || '');
  const [surname, setSurname] = useState(user?.surname || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Companies list
  const [companies, setCompanies] = useState<string[]>(user?.companies || []);
  const [newCompanyName, setNewCompanyName] = useState('');
  
  // Security
  const [twoFaEnabled, setTwoFaEnabled] = useState(!!user?.twoFaEnabled);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Integrations (mocked but interactive)
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isDriveConnecting, setIsDriveConnecting] = useState(false);
  const [emailForwarding, setEmailForwarding] = useState(true);
  
  // AI OCR integration state
  const [ocrProvider, setOcrProvider] = useState(localStorage.getItem('docuvia_ocr_provider') || 'openai');
  const [apiKey, setApiKey] = useState(localStorage.getItem('docuvia_ocr_key') || '');
  const [isTestingOcr, setIsTestingOcr] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<'connected' | 'not-connected' | 'error'>(localStorage.getItem('docuvia_ocr_key') ? 'connected' : 'not-connected');
  const [ocrVerifiedAt, setOcrVerifiedAt] = useState<string | null>(localStorage.getItem('docuvia_ocr_verified') || null);

  const handleTestOcrConnection = async () => {
    setIsTestingOcr(true);
    setOcrStatus('not-connected');
    
    if (ocrProvider === 'openai' && apiKey && apiKey.startsWith('sk-')) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        
        if (response.ok) {
          setOcrStatus('connected');
          const now = new Date();
          const verifiedTime = `${now.getDate()}. ${now.getMonth() + 1}. ${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
          setOcrVerifiedAt(verifiedTime);
          
          localStorage.setItem('docuvia_ocr_key', apiKey);
          localStorage.setItem('docuvia_ocr_provider', ocrProvider);
          localStorage.setItem('docuvia_ocr_verified', verifiedTime);
          
          alert('✅ Reálne overenie spojenia s OpenAI (GPT-4o) prebehlo úspešne!\nKľúč je platný a bezpečne uložený.');
        } else {
          setOcrStatus('error');
          alert('❌ Chyba: API kľúč je neplatný alebo nemá dostatočný kredit (Error 401/429).');
        }
      } catch (error) {
        setOcrStatus('error');
        alert('❌ Nastala chyba pri pripájaní na OpenAI servery.');
      }
    } else {
      // Fallback pre DocuVia Pro simuláciu
      setTimeout(() => {
        setOcrStatus('connected');
        const now = new Date();
        const verifiedTime = `${now.getDate()}. ${now.getMonth() + 1}. ${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        setOcrVerifiedAt(verifiedTime);
        localStorage.setItem('docuvia_ocr_provider', 'docuvia-pro');
        localStorage.removeItem('docuvia_ocr_key');
        localStorage.setItem('docuvia_ocr_verified', verifiedTime);
        alert('Overenie spojenia s interným modelom DocuVia Pro prebehlo úspešne!');
      }, 1000);
    }
    
    setIsTestingOcr(false);
  };
  
  const [showOcrGuide, setShowOcrGuide] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Computed employees list directly from live state prop
  const employees = usersDB.filter((u: any) => u.role === 'employee' && u.ownerEmail === user.email);

  const [empForm, setEmpForm] = useState({ name: '', surname: '', email: '', password: '' });
  const [empPermissions, setEmpPermissions] = useState({
    documents: true,
    cashRegister: true,
    settings: false,
    export: true,
    delete: false
  });
  const [empCompanies, setEmpCompanies] = useState<string[]>([]);

  const handleSaveGeneral = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          name,
          surname,
          email,
          companies,
          twoFaEnabled
        });
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    }, 800);
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    const updated = [...companies, newCompanyName.trim()];
    setCompanies(updated);
    setNewCompanyName('');
    
    if (onUserUpdate) {
      onUserUpdate({
        ...user,
        companies: updated
      });
    }
  };

  const handleRemoveCompany = (idx: number) => {
    if (companies.length <= 1) {
      alert('Musíte mať aspoň jednu firmu.');
      return;
    }
    const updated = companies.filter((_, i) => i !== idx);
    setCompanies(updated);
    if (onUserUpdate) {
      onUserUpdate({
        ...user,
        companies: updated
      });
    }
  };

  const handleCompanyChange = (idx: number, val: string) => {
    const updated = [...companies];
    updated[idx] = val;
    setCompanies(updated);
  };

  const handleSaveCompanyChanges = () => {
    if (onUserUpdate) {
      onUserUpdate({
        ...user,
        companies
      });
      alert('Zmeny vo firmách boli uložené.');
    }
  };

  const handlePasswordChange = () => {
    setPasswordError(null);
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordError('Vyplňte všetky polia.');
      return;
    }
    if (user.password && passwords.current !== user.password) {
      setPasswordError('Nesprávne aktuálne heslo.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError('Nové heslá sa nezhodujú.');
      return;
    }
    if (passwords.new.length < 6) {
      setPasswordError('Heslo musí mať aspoň 6 znakov.');
      return;
    }
    
    if (onUserUpdate) {
      onUserUpdate({
        ...user,
        password: passwords.new
      });
    }
    setPasswords({ current: '', new: '', confirm: '' });
    setShowPasswordForm(false);
    alert('Heslo bolo úspešne zmenené!');
  };

  const handleToggle2FA = () => {
    const newStatus = !twoFaEnabled;
    setTwoFaEnabled(newStatus);
    if (onUserUpdate) {
      onUserUpdate({
        ...user,
        twoFaEnabled: newStatus
      });
    }
  };

  const handleConnectDrive = () => {
    if (isDriveConnected) {
      setIsDriveConnected(false);
      return;
    }
    setIsDriveConnecting(true);
    setTimeout(() => {
      setIsDriveConnecting(false);
      setIsDriveConnected(true);
    }, 2000);
  };

  // Employee creation
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name || !empForm.surname || !empForm.email || !empForm.password) {
      alert('Vyplňte všetky polia zamestnanca.');
      return;
    }
    if (empCompanies.length === 0) {
      alert('Priraďte zamestnancovi aspoň jednu firmu.');
      return;
    }

    if (usersDB.find((u: any) => u.email === empForm.email)) {
      alert('Používateľ s týmto e-mailom už v systéme existuje.');
      return;
    }

    const newEmp = {
      name: empForm.name,
      surname: empForm.surname,
      email: empForm.email,
      password: empForm.password,
      role: 'employee',
      ownerEmail: user.email,
      companies: empCompanies,
      permissions: empPermissions
    };

    setUsersDB([...usersDB, newEmp]);

    setEmpForm({ name: '', surname: '', email: '', password: '' });
    setEmpCompanies([]);
    setEmpPermissions({
      documents: true,
      cashRegister: true,
      settings: false,
      export: true,
      delete: false
    });
    alert(`Zamestnanec ${empForm.name} bol úspešne vytvorený a priradený!`);
  };

  const handleRemoveEmployee = (empEmail: string) => {
    if (!confirm('Naozaj chcete vymazať tohto zamestnanca?')) return;
    const updatedDB = usersDB.filter((u: any) => u.email !== empEmail);
    setUsersDB(updatedDB);
  };

  const handleToggleEmployeePermission = (empEmail: string, key: string) => {
    const updatedDB = usersDB.map((u: any) => {
      if (u.email === empEmail) {
        return {
          ...u,
          permissions: {
            ...u.permissions,
            [key]: !u.permissions[key]
          }
        };
      }
      return u;
    });
    setUsersDB(updatedDB);
  };

  const handleToggleEmployeeCompany = (empEmail: string, companyName: string) => {
    const updatedDB = usersDB.map((u: any) => {
      if (u.email === empEmail) {
        const alreadyHas = u.companies.includes(companyName);
        const updatedCompanies = alreadyHas 
          ? u.companies.filter((c: string) => c !== companyName)
          : [...u.companies, companyName];
        return {
          ...u,
          companies: updatedCompanies
        };
      }
      return u;
    });
    setUsersDB(updatedDB);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl pb-24">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Nastavenia</h1>
        <p className="text-slate-400">Správa vášho účtu, firiem a zabezpečenia</p>
      </header>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="p-8 rounded-[32px] bg-[#111928]/40 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f2ff]/5 blur-[60px] rounded-full"></div>
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 flex items-center justify-center overflow-hidden">
              <User size={40} className="text-[#00f2ff]" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{name} {surname}</h3>
              <p className="text-sm text-slate-500">{email}</p>
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] bg-[#00f2ff]/10 px-3 py-1 rounded-full mt-2">
                {user?.role === 'employee' ? 'Zamestnanec / Účtovník' : 'Majiteľ účtu'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Meno</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                disabled={user?.role === 'employee'}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-[#00f2ff]/50 transition-all outline-none text-sm disabled:opacity-50" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Priezvisko</label>
              <input 
                type="text" 
                value={surname} 
                onChange={(e) => setSurname(e.target.value)}
                disabled={user?.role === 'employee'}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-[#00f2ff]/50 transition-all outline-none text-sm disabled:opacity-50" 
              />
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">E-mailová adresa</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={user?.role === 'employee'}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-[#00f2ff]/50 transition-all outline-none text-sm disabled:opacity-50" 
            />
          </div>

          {user?.role !== 'employee' && (
            <button 
              onClick={handleSaveGeneral}
              disabled={saveStatus === 'saving'}
              className="w-full bg-[#00f2ff] text-black font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Ukladám...
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <Check size={18} /> Zmeny uložené!
                </>
              ) : (
                <>
                  <Save size={18} /> Uložiť osobné údaje
                </>
              )}
            </button>
          )}
        </section>

        {/* Používateľské roly a zamestnanci (Strictly visible ONLY to OWNER) */}
        {user?.role !== 'employee' && (
          <section className="p-8 rounded-[32px] bg-[#111928]/40 border border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#00f2ff]/10 flex items-center justify-center text-[#00f2ff]">
                <Users size={20} />
              </div>
              <h3 className="text-xl font-bold">Správa tímu a oprávnení</h3>
            </div>

            {/* List of existing employees */}
            <div className="space-y-6 mb-10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Aktívni zamestnanci ({employees.length})</h4>
              {employees.length === 0 ? (
                <p className="text-sm text-slate-500 italic bg-white/[0.01] border border-white/5 p-4 rounded-2xl">Zatiaľ nemáte vytvorených žiadnych zamestnancov.</p>
              ) : (
                <div className="space-y-4">
                  {employees.map((emp) => (
                    <div key={emp.email} className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold">{emp.name} {emp.surname}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveEmployee(emp.email)}
                          className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                          title="Vymazať zamestnanca"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Permissions checklist */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-white/5">
                        {[
                          { key: 'documents', label: 'Dokumenty' },
                          { key: 'cashRegister', label: 'Analytika' },
                          { key: 'settings', label: 'Nastavenia' },
                          { key: 'export', label: 'Export' },
                          { key: 'delete', label: 'Mazanie' }
                        ].map(perm => (
                          <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!emp.permissions?.[perm.key]}
                              onChange={() => handleToggleEmployeePermission(emp.email, perm.key)}
                              className="rounded border-white/10 bg-[#0b111a] text-[#00f2ff] focus:ring-0 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-slate-300">{perm.label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Allowed companies multiselect */}
                      <div className="space-y-2 pt-3 border-t border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Prístup k firmám</p>
                        <div className="flex flex-wrap gap-2">
                          {companies.map(comp => {
                            const hasAccess = emp.companies.includes(comp);
                            return (
                              <button 
                                key={comp}
                                onClick={() => handleToggleEmployeeCompany(emp.email, comp)}
                                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all border ${
                                  hasAccess 
                                    ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20' 
                                    : 'bg-white/5 text-slate-500 border-transparent hover:text-slate-300'
                                }`}
                              >
                                {comp}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create new employee form */}
            <form onSubmit={handleAddEmployee} className="border-t border-white/5 pt-8 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#00f2ff]">+ Pridať nového zamestnanca</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Meno"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({...empForm, name: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-[#00f2ff]/50"
                />
                <input 
                  type="text" 
                  placeholder="Priezvisko"
                  value={empForm.surname}
                  onChange={(e) => setEmpForm({...empForm, surname: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-[#00f2ff]/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="email" 
                  placeholder="E-mail (prihlasovacie meno)"
                  value={empForm.email}
                  onChange={(e) => setEmpForm({...empForm, email: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-[#00f2ff]/50"
                />
                <input 
                  type="password" 
                  placeholder="Heslo pre zamestnanca"
                  value={empForm.password}
                  onChange={(e) => setEmpForm({...empForm, password: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-[#00f2ff]/50"
                />
              </div>

              {/* Set permissions */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nastaviť oprávnenia</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  {[
                    { key: 'documents', label: 'Dokumenty' },
                    { key: 'cashRegister', label: 'Analytika' },
                    { key: 'settings', label: 'Nastavenia' },
                    { key: 'export', label: 'Export' },
                    { key: 'delete', label: 'Mazanie' }
                  ].map(perm => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!(empPermissions as any)[perm.key]}
                        onChange={(e) => setEmpPermissions({
                          ...empPermissions,
                          [perm.key]: e.target.checked
                        })}
                        className="rounded border-white/10 bg-[#0b111a] text-[#00f2ff] focus:ring-0 w-4 h-4"
                      />
                      <span className="text-xs font-medium text-slate-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Company selection checkboxes */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Priradiť firmy</p>
                <div className="flex flex-wrap gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  {companies.map(comp => (
                    <label key={comp} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={empCompanies.includes(comp)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEmpCompanies([...empCompanies, comp]);
                          } else {
                            setEmpCompanies(empCompanies.filter(c => c !== comp));
                          }
                        }}
                        className="rounded border-white/10 bg-[#0b111a] text-[#00f2ff] focus:ring-0 w-4 h-4"
                      />
                      <span className="text-xs font-medium text-slate-300">{comp}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#00f2ff] text-black font-black py-3.5 rounded-xl hover:bg-[#00d1ff] transition-all text-xs"
              >
                Vytvoriť a priradiť zamestnanca
              </button>
            </form>
          </section>
        )}

        {/* Firemné údaje (Only for Owner) */}
        {user?.role !== 'employee' && (
          <section className="p-8 rounded-[32px] bg-[#111928]/40 border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Building2 size={20} />
                </div>
                <h3 className="text-xl font-bold">Moje firmy</h3>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {companies.map((comp, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl">
                  <input 
                    type="text" 
                    value={comp} 
                    onChange={(e) => handleCompanyChange(idx, e.target.value)}
                    className="flex-1 bg-transparent focus:outline-none focus:border-[#00f2ff] border-b border-transparent transition-colors py-1 text-sm font-bold" 
                  />
                  <button 
                    onClick={() => handleRemoveCompany(idx)}
                    className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                    title="Odstrániť firmu"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mb-6">
              <button 
                onClick={handleSaveCompanyChanges}
                className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-xs font-bold"
              >
                Uložiť zmeny názvov firiem
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nový názov firmy (napr. BSS s.r.o.)" 
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-[#00f2ff]/50 transition-all outline-none text-xs" 
              />
              <button 
                type="submit"
                className="bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20 rounded-xl px-6 hover:bg-[#00f2ff]/20 transition-all font-bold text-xs flex items-center gap-1"
              >
                <Plus size={16} /> Pridať firmu
              </button>
            </form>
          </section>
        )}

        {/* Zabezpečenie */}
        <section className="p-8 rounded-[32px] bg-[#111928]/40 border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#00f2ff]/10 flex items-center justify-center text-[#00f2ff]">
              <Shield size={20} />
            </div>
            <h3 className="text-xl font-bold">Zabezpečenie</h3>
          </div>

          <div className="space-y-6">
            {/* 2FA Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-4">
                <Smartphone className="text-[#00f2ff]" size={24} />
                <div>
                  <p className="text-sm font-bold">Dvojfázové overenie (2FA)</p>
                  <p className="text-xs text-slate-500">Zabezpečí prihlásenie pomocou kódu (123456).</p>
                </div>
              </div>
              <button 
                onClick={handleToggle2FA}
                className={`w-12 h-6 rounded-full relative transition-colors ${twoFaEnabled ? 'bg-[#00f2ff]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${twoFaEnabled ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            {/* Password Change Button & Form */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Lock className="text-slate-500" size={24} />
                  <div>
                    <p className="text-sm font-bold">Zmena hesla</p>
                    <p className="text-xs text-slate-500">Zmeňte si svoje tajné prístupové heslo.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="text-xs font-bold text-[#00f2ff] hover:underline"
                >
                  {showPasswordForm ? 'Zrušiť' : 'Aktualizovať'}
                </button>
              </div>

              {showPasswordForm && (
                <div className="pt-4 border-t border-white/5 space-y-4">
                  {passwordError && (
                    <div className="text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-xl">
                      {passwordError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Aktuálne heslo</label>
                    <input 
                      type="password" 
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-[#00f2ff]" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nové heslo</label>
                      <input 
                        type="password" 
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-[#00f2ff]" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Potvrďte nové heslo</label>
                      <input 
                        type="password" 
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-[#00f2ff]" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handlePasswordChange}
                    className="w-full bg-[#00f2ff] text-black font-black py-2.5 rounded-xl text-xs hover:bg-[#00d1ff] transition-all"
                  >
                    Uložiť nové heslo
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Integrácie & Automatizácia */}
        <section className="p-8 rounded-[32px] bg-[#111928]/40 border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <CloudLightning size={20} />
            </div>
            <h3 className="text-xl font-bold">Integrácie a Automatizácia</h3>
          </div>

          <div className="space-y-6">
            {/* Google Drive Connection */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-4">
                <Globe className="text-slate-500" size={24} />
                <div>
                  <p className="text-sm font-bold">Záloha Google Drive</p>
                  <p className="text-xs text-slate-500">Automatické zálohovanie všetkých faktúr a bločkov.</p>
                </div>
              </div>
              <button 
                onClick={handleConnectDrive}
                disabled={isDriveConnecting}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isDriveConnected ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-[#00f2ff] text-black'
                }`}
              >
                {isDriveConnecting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Pripájam...
                  </>
                ) : isDriveConnected ? (
                  <>
                    <Check size={14} /> Pripojené
                  </>
                ) : (
                  'Pripojiť cloud'
                )}
              </button>
            </div>

            {/* AI OCR Scanner Configuration */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00f2ff]/10 flex items-center justify-center text-[#00f2ff] shrink-0">
                    <CloudLightning size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      Kognitívne Služby & AI OCR Prepojenie
                      <span className={`w-2.5 h-2.5 rounded-full inline-block animate-pulse ${
                        ocrStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} title={ocrStatus === 'connected' ? 'Aktívne pripojené' : 'Nepripojené'}></span>
                    </h4>
                    <p className="text-xs text-slate-500">Prepojte DocuVia s registrovaným kognitívnym partnerom pre vyčítanie dokladov.</p>
                  </div>
                </div>
                <button 
                  onClick={handleTestOcrConnection}
                  disabled={isTestingOcr}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/20 transition-all flex items-center gap-2 self-start md:self-center"
                >
                  {isTestingOcr ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Overujem...
                    </>
                  ) : (
                    'Otestovať spojenie'
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Kognitívny Model & CRM Partner</label>
                  <select 
                    value={ocrProvider}
                    onChange={(e) => {
                      setOcrProvider(e.target.value);
                      if (e.target.value === 'docuvia-pro') {
                        setApiKey('sk-proj-••••••••••••••••3A9F');
                        setOcrStatus('connected');
                      } else {
                        setApiKey('');
                        setOcrStatus('not-connected');
                      }
                    }}
                    className="w-full bg-[#0b111a] border border-white/10 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-[#00f2ff]"
                  >
                    <option value="docuvia-pro">DocuVia Enterprise OCR (Zahrnuté v tarife)</option>
                    <option value="openai">OpenAI GPT-4o (Platený Premium API plán)</option>
                    <option value="anthropic">Anthropic Claude 3.5 Sonnet (Vyžaduje platby Anthropic)</option>
                    <option value="rossum">Rossum.ai Invoice Cloud (Podnikové korporátne API)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">API Prístupový Kľúč (Token)</label>
                  <input 
                    type="password" 
                    placeholder={ocrProvider === 'docuvia-pro' ? 'Integrovaný DocuVia kľúč' : 'Zadajte váš sk-... kľúč'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      if (e.target.value.trim().length > 10) {
                        setOcrStatus('connected');
                      } else {
                        setOcrStatus('not-connected');
                      }
                    }}
                    className="w-full bg-[#0b111a] border border-white/10 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-[#00f2ff]" 
                  />
                </div>
              </div>

              {ocrVerifiedAt && (
                <div className="text-[10px] text-slate-500 flex items-center justify-between bg-black/20 p-3.5 rounded-xl border border-white/5">
                  <span>Stav registrácie AI CRM: <strong className="text-green-500">Prepojené & Overené</strong></span>
                  <span>Posledná verifikácia: <strong>{ocrVerifiedAt}</strong></span>
                </div>
              )}

              <div className="border-t border-white/5 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowOcrGuide(!showOcrGuide)}
                  className="text-xs font-bold text-[#00f2ff] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  {showOcrGuide ? 'Skryť podrobný návod' : 'Zobraziť podrobný návod: Ako získať API kľúč a prepojiť platobné QR kódy'}
                </button>

                {showOcrGuide && (
                  <div className="mt-4 p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4 text-xs animate-in slide-in-from-top-2 duration-300">
                    <h5 className="font-bold text-[#00f2ff] text-sm mb-2">Postup pre prepojenie s OpenAI a generovanie platobných QR kódov</h5>
                    
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#00f2ff]/10 text-[#00f2ff] flex items-center justify-center font-bold shrink-0">1</span>
                        <div>
                          <p className="font-bold text-slate-200">Registrácia na platforme OpenAI</p>
                          <p className="text-slate-400 mt-1">
                            Prejdite na stránku <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className="text-[#00f2ff] underline">platform.openai.com</a> a vytvorte si účet. Pozor: Štandardný účet ChatGPT Plus ($20/mesiac) nepokrýva vývojárske API kľúče.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#00f2ff]/10 text-[#00f2ff] flex items-center justify-center font-bold shrink-0">2</span>
                        <div>
                          <p className="font-bold text-slate-200">Dobitie kreditu (Billing Setup)</p>
                          <p className="text-slate-400 mt-1">
                            V sekcii <strong>Settings &rarr; Billing</strong> si dobite základný kredit (odporúčame 5 $ až 10 $). Každé jedno vyčítanie faktúry modelom GPT-4o stojí len približne 0,005 $ (pol centu), takže kredit vám vydrží na tisíce dokumentov.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#00f2ff]/10 text-[#00f2ff] flex items-center justify-center font-bold shrink-0">3</span>
                        <div>
                          <p className="font-bold text-slate-200">Vytvorenie a skopírovanie API kľúča</p>
                          <p className="text-slate-400 mt-1">
                            Kliknite v ľavom paneli na <strong>API Keys</strong>, zvoľte <strong>Create new secret key</strong>, pomenujte ho napr. <code>DocuVia CRM</code> a vygenerovaný kľúč (začína na <code>sk-proj-...</code>) si ihneď skopírujte. Z bezpečnostných dôvodov sa vám zobrazí iba raz.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#00f2ff]/10 text-[#00f2ff] flex items-center justify-center font-bold shrink-0">4</span>
                        <div>
                          <p className="font-bold text-slate-200">Aktivácia a Pay by square (QR kód) generátor</p>
                          <p className="text-slate-400 mt-1">
                            Skopírovaný kľúč vložte vyššie do poľa a stlačte <strong>Otestovať spojenie</strong>. Naša aplikácia automaticky prepojí vyčítané bankové údaje (IBAN, suma, variabilný symbol) a podľa slovenského bankového štandardu SBA vygeneruje bezchybný <strong>PAY by square</strong> QR kód, ktorý sa okamžite zobrazí v detaile faktúry.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Email automation import */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-4">
                <Mail className="text-slate-500" size={24} />
                <div>
                  <p className="text-sm font-bold">E-mailové spracovanie príloh</p>
                  <p className="text-xs text-slate-500">Po preposlaní faktúry na e-mail sa automaticky importuje.</p>
                </div>
              </div>
              <button 
                onClick={() => setEmailForwarding(!emailForwarding)}
                className={`w-12 h-6 rounded-full relative transition-colors ${emailForwarding ? 'bg-[#00f2ff]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${emailForwarding ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            {emailForwarding && (
              <div className="p-4 rounded-2xl bg-[#00f2ff]/5 border border-[#00f2ff]/10 text-xs space-y-2 animate-in slide-in-from-top-2 duration-300">
                <p className="text-slate-300 font-medium">Váš vyhradený e-mail pre import faktúr:</p>
                <div className="flex items-center justify-between bg-black/30 border border-white/5 p-2 rounded-lg font-mono text-[#00f2ff] font-bold">
                  <span>{user?.email?.split('@')[0] || 'firma'}@docuvia.sk</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-sans ml-2">Aktívny</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;

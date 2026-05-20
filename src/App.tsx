import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, Zap, Layout, X, Mail, Lock, User, Check } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import Dashboard from './components/Dashboard';
import { DocumentProvider } from './contexts/DocumentContext';
import './index.css';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'forgot-password'>('landing');
  const [registrationStep, setRegistrationStep] = useState<'details' | '2fa' | 'companies'>('details');
  const [notification, setNotification] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<string | null>(null);

  // Automatické presmerovanie zo starých portov (napr. 5175) na správny port 5173
  useEffect(() => {
    if (window.location.hostname === 'localhost' && window.location.port && window.location.port !== '5173') {
      window.location.href = 'http://localhost:5173/';
    }
  }, []);

  // Akonáhle sa prihlási používateľ, nastav mu prvú firmu ako aktívnu
  useEffect(() => {
    if (user) {
      if (user.companies && user.companies.length > 0) {
        setActiveCompany(user.companies[0]);
      } else {
        // Fallback pre staršie účty, ktoré sa registrovali pred pridaním tejto funkcionality
        setActiveCompany('Predvolená firma');
        // Pre istotu pridáme predvolenú firmu aj priamo do objektu používateľa v pamäti (aby fungoval dropdown)
        user.companies = ['Predvolená firma'];
      }
    }
  }, [user]);

  // Mock DB & Auth States
  const [usersDB, setUsersDB] = useState<any[]>(() => {
    const saved = localStorage.getItem('docuvia_users');
    if (saved) {
      let parsed = JSON.parse(saved);
      // Premazanie starých účtov, aby si mohla ísť naisto nanovo
      parsed = parsed.filter((u: any) => u.email !== 'ema.palfyova2@gmail.com' && u.email !== 'bss-spravcovska');
      return parsed;
    }
    return [{ name: 'Admin', surname: 'Test', email: 'test@docuvia.sk', password: 'Heslo123', companies: ['Testovacia Firma s.r.o.'] }];
  });

  useEffect(() => {
    localStorage.setItem('docuvia_users', JSON.stringify(usersDB));
  }, [usersDB]);
  const [authForm, setAuthForm] = useState({ name: '', surname: '', email: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);

  const [pendingUser, setPendingUser] = useState<any>(null);
  const [companyInputs, setCompanyInputs] = useState([{ name: '', ico: '' }]);

  const [loginPendingUser, setLoginPendingUser] = useState<any>(null);
  const [isLoginTwoFaActive, setIsLoginTwoFaActive] = useState(false);

  const [twoFaCode, setTwoFaCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
    const updatedDB = usersDB.map((u: any) => u.email === updatedUser.email ? updatedUser : u);
    setUsersDB(updatedDB);
    localStorage.setItem('docuvia_users', JSON.stringify(updatedDB));
  };

  const handle2FAChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newCode = [...twoFaCode];
    newCode[index] = value;
    setTwoFaCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handle2FAKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !twoFaCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse: any) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        
        const currentType = view === 'login' ? 'login' : 'register';
        const googleEmail = (userInfo.email || 'google@docuvia.sk').toLowerCase();
        const mockGoogleUser = { 
          name: userInfo.given_name || 'Google', 
          surname: userInfo.family_name || 'Používateľ', 
          email: googleEmail, 
          password: '' 
        };

        const currentDB = JSON.parse(localStorage.getItem('docuvia_users') || '[]');

        if (currentType === 'register') {
          const exists = currentDB.find((u: any) => u.email.toLowerCase() === mockGoogleUser.email);
          if (exists) {
             setAuthError('Tento účet už existuje. Prihláste sa.');
             return;
          }
          setPendingUser(mockGoogleUser);
          setRegistrationStep('companies');
        } else {
          const exists = currentDB.find((u: any) => u.email.toLowerCase() === mockGoogleUser.email);
          if (!exists) {
             setAuthError('Účet neexistuje. Najprv sa musíte zaregistrovať.');
             return;
          }
          setUser(exists);
          setView('landing');
        }
      } catch (err) {
        console.error('Failed to fetch user info', err);
        setAuthError('Nepodarilo sa načítať údaje z Google.');
      }
    },
    onError: (error: any) => console.log('Login Failed:', error)
  });

  const renderForm = (type: 'login' | 'register') => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b111a]/95 backdrop-blur-md"
    >
      <div className="w-full max-w-md p-8 rounded-[32px] bg-[#111928]/80 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f2ff]/10 blur-[60px] rounded-full"></div>
        
        <button 
          onClick={() => { 
            setView('landing'); 
            setRegistrationStep('details'); 
            setAuthError(null);
            setAuthForm({ name: '', surname: '', email: '', password: '' });
            setCompanyInputs([{ name: '', ico: '' }]);
            setPendingUser(null);
            setIsLoginTwoFaActive(false);
            setLoginPendingUser(null);
          }}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold mb-2">{type === 'login' ? 'Vitajte späť' : 'Vytvoriť účet'}</h2>
        <p className="text-slate-400 mb-6">{type === 'login' ? 'Prihláste sa do svojho účtu DocuVia' : 'Začnite s digitalizáciou ešte dnes'}</p>

        <AnimatePresence>
          {authError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-bold mb-6 flex items-center gap-2"
            >
              <Shield size={16} /> {authError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <button 
            onClick={() => googleLogin()}
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all mb-6 cursor-pointer"
          >
            Pokračovať cez Google
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <span className="relative bg-[#111928] px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Alebo e-mailom</span>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {type === 'register' && registrationStep === 'details' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Meno</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Meno" 
                      value={authForm.name}
                      onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-[#00f2ff]/50 transition-all outline-none text-sm" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Priezvisko</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Priezvisko" 
                      value={authForm.surname}
                      onChange={(e) => setAuthForm({...authForm, surname: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-[#00f2ff]/50 transition-all outline-none text-sm" 
                    />
                  </div>
                </div>
              </div>
            )}

            {registrationStep === 'details' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="email" 
                      placeholder="vas@email.sk" 
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-[#00f2ff]/50 transition-all outline-none text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Heslo</label>
                    {type === 'login' && (
                      <button onClick={() => setView('forgot-password')} className="text-[10px] font-bold text-[#00f2ff] hover:underline">Zabudli ste heslo?</button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-[#00f2ff]/50 transition-all outline-none text-sm" 
                    />
                  </div>
                </div>
              </>
            )}

            {type === 'login' && isLoginTwoFaActive ? (
              <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-[#00f2ff]/10 rounded-2xl flex items-center justify-center text-[#00f2ff] mx-auto mb-4">
                    <Shield size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Dvojfázové overenie</h3>
                  <p className="text-sm text-slate-400">Zadajte kód pre prihlásenie (2FA).</p>
                </div>
                <div className="flex justify-between gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input 
                      key={i} 
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text" 
                      maxLength={1} 
                      value={twoFaCode[i]}
                      onChange={(e) => handle2FAChange(i, e.target.value)}
                      onKeyDown={(e) => handle2FAKeyDown(i, e)}
                      className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-[#00f2ff] outline-none transition-all" 
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-slate-500 mt-2">Zadajte testovací kód: 123456</p>
                <button 
                  onClick={() => { 
                    const code = twoFaCode.join('');
                    if (code === '123456') {
                      setUser(loginPendingUser); 
                      setView('landing'); 
                      setIsLoginTwoFaActive(false);
                      setLoginPendingUser(null);
                      setTwoFaCode(['', '', '', '', '', '']);
                      setAuthError(null);
                    } else {
                      setAuthError('Nesprávny overovací kód.');
                    }
                  }}
                  className="w-full bg-[#00f2ff] text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all mt-4"
                >
                  Overiť a prihlásiť
                </button>
              </div>
            ) : type === 'register' && registrationStep === 'companies' ? (
              <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2 mb-6">
                  <div className="w-16 h-16 bg-[#00f2ff]/10 rounded-2xl flex items-center justify-center text-[#00f2ff] mx-auto mb-4">
                    <Layout size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Nastavenie firiem</h3>
                  <p className="text-sm text-slate-400">Pod akými firmami budete evidovať doklady?</p>
                </div>
                
                <div className="max-h-[200px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {companyInputs.map((comp, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Firma {idx + 1}</label>
                        {companyInputs.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => setCompanyInputs(companyInputs.filter((_, i) => i !== idx))}
                            className="text-red-500 text-xs hover:underline"
                          >
                            Odstrániť
                          </button>
                        )}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Názov spoločnosti (napr. Kaviareň s.r.o.)" 
                        value={comp.name}
                        onChange={(e) => {
                          const newC = [...companyInputs];
                          newC[idx].name = e.target.value;
                          setCompanyInputs(newC);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00f2ff] transition-colors"
                      />
                    </div>
                  ))}
                </div>

                <button 
                  type="button"
                  onClick={() => setCompanyInputs([...companyInputs, { name: '', ico: '' }])}
                  className="w-full text-sm text-[#00f2ff] font-bold py-3 border border-dashed border-[#00f2ff]/30 rounded-xl hover:bg-[#00f2ff]/10 transition-colors"
                >
                  + Pridať ďalšiu firmu
                </button>

                <button 
                  onClick={() => { 
                    const validCompanies = companyInputs.filter(c => c.name.trim() !== '').map(c => c.name.trim());
                    if (validCompanies.length === 0) {
                      setAuthError('Zadajte názov aspoň jednej firmy.');
                      return;
                    }
                    const currentDB = JSON.parse(localStorage.getItem('docuvia_users') || '[]');
                    const finalUser = { ...pendingUser, companies: validCompanies };
                    const updatedDB = [...currentDB, finalUser];
                    setUsersDB(updatedDB);
                    localStorage.setItem('docuvia_users', JSON.stringify(updatedDB));
                    setUser(finalUser); 
                    setView('landing'); 
                    setAuthError(null);
                  }}
                  className="w-full bg-[#00f2ff] text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all mt-4"
                >
                  Dokončiť registráciu a vstúpiť
                </button>
              </div>
            ) : type === 'register' && registrationStep === '2fa' ? (
              <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-[#00f2ff]/10 rounded-2xl flex items-center justify-center text-[#00f2ff] mx-auto mb-4">
                    <Shield size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Overenie identity</h3>
                  <p className="text-sm text-slate-400">Zadajte 6-miestny kód, ktorý sme vám poslali.</p>
                </div>
                <div className="flex justify-between gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input 
                      key={i} 
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text" 
                      maxLength={1} 
                      value={twoFaCode[i]}
                      onChange={(e) => handle2FAChange(i, e.target.value)}
                      onKeyDown={(e) => handle2FAKeyDown(i, e)}
                      className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-[#00f2ff] outline-none transition-all" 
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-slate-500 mt-2">Kód bol odoslaný na váš e-mail. Pre test zadajte: 123456</p>
                <button 
                  onClick={() => { 
                    const code = twoFaCode.join('');
                    if (code === '123456') {
                      const newUser = { ...authForm, email: authForm.email.toLowerCase() };
                      setPendingUser(newUser);
                      setRegistrationStep('companies');
                      setTwoFaCode(['', '', '', '', '', '']);
                      setAuthError(null);
                    } else {
                      setAuthError('Nesprávny overovací kód.');
                    }
                  }}
                  className="w-full bg-[#00f2ff] text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all mt-4"
                >
                  Overiť a dokončiť
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthError(null);
                  
                  if (type === 'register') {
                    if (!authForm.email || !authForm.password || !authForm.name || !authForm.surname) {
                      setAuthError('Prosím, vyplňte všetky údaje.');
                      return;
                    }
                    const emailLower = authForm.email.toLowerCase();
                    const exists = usersDB.find(u => u.email.toLowerCase() === emailLower);
                    if (exists) {
                      setAuthError('Tento účet už existuje. Prihláste sa.');
                      return;
                    }
                    setRegistrationStep('2fa');
                  } else {
                    if (!authForm.email || !authForm.password) {
                      setAuthError('Prosím, zadajte e-mail a heslo.');
                      return;
                    }
                    const emailLower = authForm.email.toLowerCase();
                    const existingUser = usersDB.find(u => u.email.toLowerCase() === emailLower);
                    if (!existingUser) {
                      setAuthError('Účet neexistuje. Najprv sa musíte zaregistrovať.');
                      return;
                    }
                    if (existingUser.password !== authForm.password) {
                      setAuthError('Nesprávne heslo.');
                      return;
                    }
                    if (existingUser.twoFaEnabled) {
                      setLoginPendingUser(existingUser);
                      setIsLoginTwoFaActive(true);
                      setTwoFaCode(['', '', '', '', '', '']);
                      setAuthError(null);
                    } else {
                      setUser(existingUser);
                      setView('landing');
                    }
                  }
                }}
                className="w-full bg-[#00f2ff] text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all mt-4 transform active:scale-[0.98]"
              >
                {type === 'login' ? 'Prihlásiť sa' : 'Vytvoriť účet'}
              </button>
            )}

            <p className="text-center text-sm text-slate-500 mt-6">
              {type === 'login' ? 'Ešte nemáte účet?' : 'Už máte účet?'} 
              <button 
                onClick={() => { 
                  setView(type === 'login' ? 'register' : 'login'); 
                  setRegistrationStep('details'); 
                  setAuthError(null);
                  setAuthForm({ name: '', surname: '', email: '', password: '' });
                  setCompanyInputs([{ name: '', ico: '' }]);
                  setPendingUser(null);
                }}
                className="text-[#00f2ff] ml-2 font-bold hover:underline"
              >
                {type === 'login' ? 'Zaregistrujte sa' : 'Prihláste sa'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </motion.div>
  );

  const renderForgotPassword = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b111a]/95 backdrop-blur-md"
    >
      <div className="w-full max-w-md p-8 rounded-[32px] bg-[#111928]/80 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f2ff]/10 blur-[60px] rounded-full"></div>
        <button onClick={() => setView('login')} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2"><X size={24} /></button>
        <h2 className="text-3xl font-bold mb-2">Obnova hesla</h2>
        <p className="text-slate-400 mb-8">Zadajte svoj e-mail a my vám pošleme inštrukcie na zmenu hesla.</p>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="email" placeholder="vas@email.sk" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:border-[#00f2ff]/50 transition-all outline-none text-base" />
            </div>
          </div>
          <button 
            onClick={() => {
              setNotification('Inštrukcie boli odoslané na váš e-mail.');
              setTimeout(() => setNotification(null), 5000);
              setView('login');
            }}
            className="w-full bg-[#00f2ff] text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all transform active:scale-[0.98]"
          >
            Odoslať inštrukcie
          </button>
          <button onClick={() => setView('login')} className="w-full text-sm font-bold text-slate-500 hover:text-white transition-colors">
            Späť na prihlásenie
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (user && activeCompany) {
    const docUserEmail = user.role === 'employee' ? user.ownerEmail : user.email;
    return (
      <DocumentProvider userEmail={docUserEmail} companyName={activeCompany}>
        <Dashboard 
          user={user} 
          activeCompany={activeCompany} 
          setActiveCompany={setActiveCompany} 
          onUserUpdate={handleUserUpdate} 
          usersDB={usersDB}
          setUsersDB={setUsersDB}
        />
      </DocumentProvider>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b111a] text-white selection:bg-[#00f2ff]/30 font-sans">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-[#00f2ff] text-black px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3"
          >
            <Check size={20} />
            {notification}
          </motion.div>
        )}
        {view === 'login' && renderForm('login')}
        {view === 'register' && renderForm('register')}
        {view === 'forgot-password' && renderForgotPassword()}
      </AnimatePresence>

      <nav className="fixed top-0 w-full z-50 px-12 py-8 flex justify-between items-center bg-[#0b111a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
          <div className="w-10 h-10 bg-gradient-to-br from-[#00f2ff] to-[#00d1ff] rounded-xl flex items-center justify-center font-bold text-black text-base">
            do
          </div>
          <span className="text-2xl font-bold tracking-tight">DocuVia</span>
        </div>
        
        <div className="hidden md:flex items-center gap-12 text-base font-semibold text-slate-400">
          <a href="#" className="hover:text-[#00f2ff] transition-colors">Produkt</a>
          <a href="#" className="hover:text-[#00f2ff] transition-colors">Cenník</a>
          <a href="#" className="hover:text-[#00f2ff] transition-colors">Prečo my</a>
          <a href="#" className="hover:text-[#00f2ff] transition-colors">Kontakt</a>
        </div>

        <div className="flex items-center gap-8">
          <button onClick={() => setView('login')} className="text-base font-medium text-slate-400 hover:text-white transition-colors">
            Prihlásiť sa
          </button>
          <button onClick={() => setView('register')} className="bg-[#00f2ff] text-black px-8 py-3 rounded-full text-base font-bold shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all transform hover:-translate-y-0.5">
            Vyskúšať zadarmo
          </button>
        </div>
      </nav>

      <main className="relative pt-48 pb-32 px-8 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-[#00f2ff]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-[#00d1ff]/5 blur-[120px] rounded-full"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="flex-1 text-left">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/20 text-[#00f2ff] text-xs font-bold tracking-widest uppercase mb-8">
              Digitálna revolúcia v účtovníctve
            </span>
            <h1 className="text-8xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85]">
              Účtovníctvo <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ff] to-[#00d1ff]">
                budúcnosti.
              </span>
            </h1>
            <p className="text-2xl text-slate-400 max-w-2xl mb-12 leading-relaxed opacity-80">
              Zmeňte svoje bločky a faktúry na dáta v priebehu sekúnd. Rýchlo, bezpečne a 100 % digitálne.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <button onClick={() => setView('register')} className="w-full sm:w-auto bg-white text-black px-12 py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-[#00f2ff] transition-all group shadow-[0_20px_40px_rgba(255,255,255,0.1)]">
                Začať 30 dní zadarmo
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-12 py-6 rounded-2xl border border-white/10 bg-white/5 font-bold text-xl hover:bg-white/10 transition-all">
                Dohodnúť konzultáciu
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex-1 w-full max-w-[700px]">
            <img src="/hero-visual.png" alt="DocuVia Visual" className="w-full h-auto drop-shadow-[0_0_80px_rgba(0,242,255,0.3)] rounded-[40px] transform hover:scale-[1.02] transition-transform duration-500" />
          </motion.div>
        </div>
      </main>

      <section className="py-32 px-8 bg-black/20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: Layout, title: 'Intuitívne prostredie', desc: 'Navrhnuté pre maximálnu efektivitu bez zbytočností.' },
            { icon: Zap, title: 'Bleskové spracovanie', desc: 'Až 300 dokladov spracovaných v priebehu 30 sekúnd.' },
            { icon: Shield, title: 'Maximálna bezpečnosť', desc: 'Vaše dáta sú u nás v bezpečí pod špičkovým šifrovaním.' }
          ].map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-[#00f2ff]/30 transition-all group">
              <div className="w-16 h-16 rounded-[24px] bg-[#00f2ff]/10 flex items-center justify-center text-[#00f2ff] mb-8 group-hover:scale-110 transition-transform">
                <feature.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-5">{feature.title}</h3>
              <p className="text-lg text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-center gap-20 opacity-30 grayscale items-center">
          <span className="text-3xl font-black">LOGOBANK</span>
          <span className="text-3xl font-black">FINTECH</span>
          <span className="text-3xl font-black">DOCU-SAFE</span>
          <span className="text-3xl font-black">AI-TAX</span>
        </div>
      </section>
    </div>
  );
};

export default App;

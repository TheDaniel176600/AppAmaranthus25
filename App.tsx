
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, DollarSign, CalendarCheck, ShieldCheck,
  Menu, X, LogOut, Wind, Sparkles, GlassWater, Building2, Lock,
  UserPlus, CheckSquare, ShieldAlert, Key, Loader2, Save, Smartphone,
  MessageSquareWarning, AlertOctagon
} from 'lucide-react';
import { ModuleType, Resident, UserRole, Task, Occurrence, Reservation, SaunaSession } from './types';
import ClientDashboard from './views/ClientDashboard';
import ResidentsView from './views/ResidentsView';
import FinancialView from './views/FinancialView';
import SaunaView from './views/SaunaView';
import ConfraternizationView from './views/ConfraternizationView';
import ReservationsView from './views/ReservationsView';
import CleaningView from './views/CleaningView';
import LoginView from './views/LoginView';
import AccessControlView from './views/AccessControlView';
import TasksView from './views/TasksView';
import UsersManagementView from './views/UsersManagementView';
import OccurrencesView from './views/OccurrencesView';
import { db, collection, query, where, onSnapshot, doc, updateDoc } from './services/firebaseConfig';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [view, setView] = useState<'LOGIN' | 'APP'>('LOGIN');
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [saunaSessions, setSaunaSessions] = useState<SaunaSession[]>([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const CONDOMINIO_ID = "VeMhb3zf9qLPQpVLeXp4";
  const CONDOMINIO_NOME = "Edifício Amaranthus";

  useEffect(() => {
    const saved = localStorage.getItem('amaranthus_session');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      if (user.senha === '0000') setIsChangingPassword(true);
      setView('APP');
    }
  }, []);

  useEffect(() => {
    if (view === 'APP') {
      // Residents Sync
      const qRes = query(collection(db, 'moradores'), where('condominioId', '==', CONDOMINIO_ID));
      const unsubRes = onSnapshot(qRes, (snapshot) => {
        const data: Resident[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() } as Resident);
        });
        setResidents(data);
      });

      // Tasks Sync
      const qTasks = query(collection(db, 'tarefas'), where('condominioId', '==', CONDOMINIO_ID));
      const unsubTasks = onSnapshot(qTasks, (snapshot) => {
        const data: Task[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() } as Task);
        });
        setTasks(data);
      });

      // Occurrences Sync
      const qOcc = query(collection(db, 'ocorrencias'), where('condominioId', '==', CONDOMINIO_ID));
      const unsubOcc = onSnapshot(qOcc, (snapshot) => {
        const data: Occurrence[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() } as Occurrence);
        });
        setOccurrences(data);
      });

      // Reservations Sync
      const qReservations = query(collection(db, 'agendamentos'), where('condominioId', '==', CONDOMINIO_ID));
      const unsubResv = onSnapshot(qReservations, (snapshot) => {
        const data: Reservation[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() } as Reservation);
        });
        setReservations(data);
      });

      // Sauna Sessions Sync
      const qSauna = query(collection(db, 'sauna_uso'), where('condominioId', '==', CONDOMINIO_ID));
      const unsubSauna = onSnapshot(qSauna, (snapshot) => {
        const data: SaunaSession[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() } as SaunaSession);
        });
        setSaunaSessions(data);
      });

      return () => {
        unsubRes();
        unsubTasks();
        unsubOcc();
        unsubResv();
        unsubSauna();
      };
    }
  }, [view]);

  const handleLoginSuccess = (userData: any) => {
    setCurrentUser(userData);
    localStorage.setItem('amaranthus_session', JSON.stringify(userData));
    if (userData.senha === '0000') setIsChangingPassword(true);
    setView('APP');
  };

  const handleLogout = () => {
    localStorage.removeItem('amaranthus_session');
    setCurrentUser(null);
    setIsChangingPassword(false);
    setView('LOGIN');
    setActiveModule(ModuleType.DASHBOARD);
  };

  const handlePasswordUpdate = async (newPassword: string) => {
    if (!currentUser?.id) return;
    try {
      await updateDoc(doc(db, 'usuarios', currentUser.id), { senha: newPassword });
      const updatedUser = { ...currentUser, senha: newPassword };
      setCurrentUser(updatedUser);
      localStorage.setItem('amaranthus_session', JSON.stringify(updatedUser));
      setIsChangingPassword(false);
    } catch (err) {
      alert("Erro ao atualizar senha.");
    }
  };

  if (view === 'LOGIN') return <LoginView onLoginSuccess={handleLoginSuccess} />;

  const getNormalizedRole = (user: any): UserRole => {
    const raw = user?.tipo || user?.role || user?.funcao || 'MORADOR';
    const normalized = String(raw).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (normalized.includes("SINDICO") && !normalized.includes("SUB")) return UserRole.SINDICO;
    if (normalized.includes("SUBSINDICO")) return UserRole.SUBSINDICO;
    if (normalized.includes("DONO") || normalized.includes("OWNER")) return UserRole.OWNER;
    if (normalized.includes("ZELADOR")) return UserRole.ZELADOR;
    if (normalized.includes("MORADOR")) return UserRole.MORADOR;
    if (normalized.includes("PRESTADOR")) return UserRole.PRESTADOR;
    return UserRole.MORADOR;
  };

  const userRole = getNormalizedRole(currentUser);
  const ALL_ACCESS = [UserRole.SINDICO, UserRole.SUBSINDICO, UserRole.OWNER];

  const modules = [
    { type: ModuleType.DASHBOARD, icon: LayoutDashboard, roles: [...ALL_ACCESS, UserRole.ZELADOR, UserRole.MORADOR] },
    { type: ModuleType.USERS, icon: UserPlus, roles: [...ALL_ACCESS] },
    { type: ModuleType.RESIDENTS, icon: Users, roles: [...ALL_ACCESS, UserRole.ZELADOR] },
    { type: ModuleType.TASKS, icon: CheckSquare, roles: [...ALL_ACCESS, UserRole.ZELADOR] },
    { type: ModuleType.OCCURRENCES, icon: AlertOctagon, roles: [...ALL_ACCESS, UserRole.ZELADOR, UserRole.MORADOR] },
    { type: ModuleType.RESERVATIONS, icon: CalendarCheck, roles: [...ALL_ACCESS, UserRole.ZELADOR, UserRole.MORADOR] },
    { type: ModuleType.CLEANING, icon: Sparkles, roles: [...ALL_ACCESS, UserRole.ZELADOR] },
    { type: ModuleType.SAUNA, icon: Wind, roles: [...ALL_ACCESS, UserRole.ZELADOR, UserRole.MORADOR] },
    { type: ModuleType.FINANCIAL, icon: DollarSign, roles: [...ALL_ACCESS] },
    { type: ModuleType.CONFRATERNIZATION, icon: GlassWater, roles: [...ALL_ACCESS, UserRole.MORADOR] },
    { type: ModuleType.ACCESS_CONTROL, icon: Lock, roles: [...ALL_ACCESS] },
  ];

  const visibleModules = modules.filter(m => m.roles.includes(userRole));

  if (isChangingPassword) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">Primeiro Acesso</h2>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-10">Configure sua senha de 6 dígitos</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          const pass = (e.currentTarget.elements.namedItem('newPass') as HTMLInputElement).value;
          if (pass.length === 6 && /^\d+$/.test(pass)) handlePasswordUpdate(pass);
          else alert("A senha deve conter 6 números.");
        }} className="space-y-8 text-left">
          <input name="newPass" required type="password" maxLength={6} inputMode="numeric" pattern="\d{6}" placeholder="000000" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-xl font-black tracking-[0.8em] outline-none" />
          <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest">Ativar Acesso</button>
        </form>
      </div>
    </div>
  );

  const renderContent = () => {
    const isAllowed = visibleModules.find(m => m.type === activeModule);
    if (!isAllowed) return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-red-400 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-red-100 mx-4">
        <Lock size={64} className="mb-6" />
        <h3 className="font-black uppercase tracking-[0.2em] text-lg text-red-600">Área Privada</h3>
        <button onClick={() => setActiveModule(ModuleType.DASHBOARD)} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Voltar</button>
      </div>
    );

    switch (activeModule) {
      case ModuleType.DASHBOARD: 
        return <ClientDashboard tasks={tasks} occurrences={occurrences} reservations={reservations} saunaSessions={saunaSessions} residentsCount={residents.length} onNavigate={setActiveModule} activeModules={visibleModules.map(m => m.type)} />;
      case ModuleType.USERS: return <UsersManagementView />;
      case ModuleType.RESIDENTS: return <ResidentsView currentCondominioId={CONDOMINIO_ID} userRole={userRole} />;
      case ModuleType.TASKS: return <TasksView />;
      case ModuleType.OCCURRENCES: return <OccurrencesView currentCondominioId={CONDOMINIO_ID} userRole={userRole} />;
      case ModuleType.SAUNA: return <SaunaView residents={residents} currentCondominioId={CONDOMINIO_ID} />;
      case ModuleType.RESERVATIONS: return <ReservationsView residents={residents} currentCondominioId={CONDOMINIO_ID} />;
      case ModuleType.CLEANING: return <CleaningView currentCondominioId={CONDOMINIO_ID} />;
      case ModuleType.FINANCIAL: return <FinancialView />;
      case ModuleType.CONFRATERNIZATION: return <ConfraternizationView residents={residents} />;
      case ModuleType.ACCESS_CONTROL: return <AccessControlView />;
      default: return <div className="p-20 text-center opacity-20"><Building2 size={64} className="mx-auto" /></div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-slate-900 transition-all duration-500 flex flex-col z-50 shadow-2xl`}>
        <div className="p-8 flex items-center gap-4">
          <div className="bg-emerald-500 p-2.5 rounded-2xl shrink-0"><ShieldCheck className="text-white w-7 h-7" /></div>
          {isSidebarOpen && <span className="text-white font-black text-xl tracking-tighter block leading-none">Amaranthus</span>}
        </div>
        <nav className="flex-1 mt-4 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {visibleModules.map((mod) => (
            <button key={mod.type} onClick={() => setActiveModule(mod.type)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeModule === mod.type ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
              <mod.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{mod.type}</span>}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 overflow-hidden">
                {currentUser?.foto ? <img src={currentUser.foto} className="w-full h-full object-cover" /> : <span className="text-emerald-500 font-black uppercase">{currentUser?.nome?.charAt(0)}</span>}
             </div>
             {isSidebarOpen && <div className="max-w-[150px]"><p className="text-xs font-black text-white truncate">{currentUser?.nome}</p><p className="text-[9px] text-emerald-500 uppercase font-black tracking-widest">{userRole}</p></div>}
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-red-400/70 hover:text-red-400 rounded-2xl"><LogOut className="w-5 h-5 shrink-0" /><span className="font-bold text-sm">Sair</span></button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-3 hover:bg-slate-100 rounded-xl text-slate-500">{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
            <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter">{activeModule}</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-50/50 custom-scrollbar"><div className="max-w-7xl mx-auto">{renderContent()}</div></div>
      </main>
    </div>
  );
};

export default App;

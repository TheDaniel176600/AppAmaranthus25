
import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  Droplets, 
  Plus, 
  Clock, 
  X, 
  Play, 
  Square, 
  History, 
  User, 
  Building2,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronRight,
  Loader2,
  Database
} from 'lucide-react';
import { SaunaSession, SaunaType, Resident } from '../types';
import { db, collection, query, where, onSnapshot, doc, addDoc, updateDoc, serverTimestamp } from '../services/firebaseConfig';

interface SaunaViewProps {
  residents: Resident[];
  currentCondominioId: string;
}

const SaunaView: React.FC<SaunaViewProps> = ({ residents, currentCondominioId }) => {
  const [activeSessions, setActiveSessions] = useState<SaunaSession[]>([]);
  const [history, setHistory] = useState<SaunaSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [residentSearch, setResidentSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [newSession, setNewSession] = useState<{ 
    saunaType: SaunaType; 
    name: string; 
    unit: string;
    residentId: string | null;
  }>({
    saunaType: 'Seca',
    name: '',
    unit: '',
    residentId: null
  });

  // Escutar sessões do Firestore em tempo real
  useEffect(() => {
    setLoading(true);
    const saunaRef = collection(db, 'sauna_uso');
    const q = query(saunaRef, where('condominioId', '==', currentCondominioId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all: SaunaSession[] = [];
      snapshot.forEach((docSnap) => {
        all.push({ id: docSnap.id, ...docSnap.data() } as SaunaSession);
      });
      
      // Separar Ativas de Concluídas
      const active = all.filter(s => s.status === 'Ativa');
      const finished = all.filter(s => s.status === 'Concluída')
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 10); // Últimas 10

      setActiveSessions(active);
      setHistory(finished);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentCondominioId]);

  const getActiveSessionFor = (type: SaunaType) => activeSessions.find(s => s.saunaType === type);

  const calculateDuration = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / 60000);
    return diff < 0 ? '0 min' : `${diff} min`;
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (getActiveSessionFor(newSession.saunaType)) {
      alert(`A Sauna ${newSession.saunaType} já está em uso!`);
      return;
    }

    try {
      await addDoc(collection(db, 'sauna_uso'), {
        condominioId: currentCondominioId,
        saunaType: newSession.saunaType,
        residentName: newSession.name,
        unit: newSession.unit,
        startTime: new Date().toISOString(),
        status: 'Ativa',
        criadoEm: serverTimestamp()
      });
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert('Erro ao iniciar sessão no banco de dados.');
    }
  };

  const handleFinishSession = async (id: string) => {
    try {
      const sessionRef = doc(db, 'sauna_uso', id);
      await updateDoc(sessionRef, {
        endTime: new Date().toISOString(),
        status: 'Concluída'
      });
    } catch (err) {
      alert('Erro ao finalizar sessão.');
    }
  };

  const resetForm = () => {
    setNewSession({ saunaType: 'Seca', name: '', unit: '', residentId: null });
    setResidentSearch('');
    setShowDropdown(false);
  };

  // Filtra moradores da lista oficial passada pelo App.tsx
  const filteredResidents = residents.filter(r => 
    r.nome.toLowerCase().includes(residentSearch.toLowerCase()) || 
    r.apto.toLowerCase().includes(residentSearch.toLowerCase())
  );

  const selectResident = (r: Resident) => {
    setNewSession({
      ...newSession,
      name: r.nome,
      unit: r.apto,
      residentId: r.id
    });
    setResidentSearch(r.nome);
    setShowDropdown(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-emerald-600 gap-5">
      <Loader2 className="animate-spin" size={64} strokeWidth={1.5} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Sincronizando Saunas Amaranthus...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Gestão de Saunas</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Controle em tempo real • Edifício Amaranthus</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
        >
          <Plus size={20} /> Nova Sessão
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(['Seca', 'Úmida'] as SaunaType[]).map((type) => {
          const session = getActiveSessionFor(type);
          const isBusy = !!session;
          const Icon = type === 'Seca' ? Wind : Droplets;

          return (
            <div key={type} className={`bg-white rounded-[2.5rem] border shadow-2xl transition-all overflow-hidden ${isBusy ? 'border-orange-500 ring-8 ring-orange-50' : 'border-slate-100'}`}>
              <div className={`p-8 flex items-center justify-between ${isBusy ? 'bg-orange-50/50' : 'bg-slate-50/30'}`}>
                <div className="flex items-center gap-6">
                  <div className={`p-5 rounded-[1.5rem] ${isBusy ? 'bg-orange-500 text-white shadow-xl shadow-orange-200' : 'bg-white text-slate-400 border border-slate-200'}`}>
                    <Icon size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Sauna {type}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${isBusy ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isBusy ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {isBusy ? 'OCUPADO AGORA' : 'DISPONÍVEL'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10">
                {isBusy ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Usuário</span>
                        <p className="font-black text-slate-800 text-lg flex items-center gap-3">
                          <User size={18} className="text-emerald-500" />
                          {session.residentName}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Unidade</span>
                        <p className="font-black text-slate-800 text-lg flex items-center gap-3">
                          <Building2 size={18} className="text-emerald-500" />
                          Apto {session.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-orange-500 rounded-[2rem] text-white shadow-xl shadow-orange-100">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                          <Clock size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Tempo de Uso</p>
                          <p className="text-2xl font-black">{calculateDuration(session.startTime)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleFinishSession(session.id)}
                        className="bg-white text-orange-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-lg"
                      >
                        <Square size={16} className="inline mr-2 fill-current" /> Finalizar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                    <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200">
                      <CheckCircle2 size={48} strokeWidth={1} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-600 uppercase tracking-tight">Área Liberada</p>
                      <p className="text-xs text-slate-400 font-bold max-w-[250px] mx-auto uppercase mt-2">Inicie uma nova sessão vinculando um morador do Amaranthus.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Histórico Recente */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-100">
              <History size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Histórico de Uso</h3>
          </div>
          <span className="text-[10px] font-black text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100 uppercase tracking-widest">Últimos 10 registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Morador / Apto</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Início</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Término</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Duração</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      {h.saunaType === 'Seca' ? <Wind size={16} className="text-emerald-500" /> : <Droplets size={16} className="text-blue-500" />}
                      <span className="font-black text-slate-700 uppercase text-xs">{h.saunaType}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <span className="font-black text-slate-800 block text-sm">{h.residentName}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Apto {h.unit}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center text-xs font-bold text-slate-500">
                    {new Date(h.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-8 py-6 text-center text-xs font-bold text-slate-500">
                    {h.endTime ? new Date(h.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg uppercase">
                      {h.endTime ? calculateDuration(h.startTime).replace(' min', 'm') : '—'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase border border-emerald-100">Concluído</span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Nenhum histórico disponível na coleção sauna_uso</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nova Sessão */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-200">
                  <Play size={24} className="fill-current" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Iniciar Sauna</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Vincular Morador do Amaranthus</p>
                </div>
              </div>
              <button 
                onClick={resetForm}
                className="p-4 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleStartSession} className="p-10 space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Sauna</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['Seca', 'Úmida'] as SaunaType[]).map(type => (
                    <label 
                      key={type}
                      className={`flex flex-col items-center justify-center p-8 border-2 rounded-[2rem] cursor-pointer transition-all ${
                        newSession.saunaType === type 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-lg' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-400'
                      }`}
                    >
                      <input 
                        type="radio" 
                        className="hidden" 
                        name="saunaType" 
                        checked={newSession.saunaType === type}
                        onChange={() => setNewSession({...newSession, saunaType: type})}
                      />
                      {type === 'Seca' ? <Wind size={32} className="mb-3" /> : <Droplets size={32} className="mb-3" />}
                      <span className="font-black uppercase tracking-widest text-xs">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecionar Morador (Coleção Amaranthus)</label>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      required
                      type="text" 
                      placeholder="Pesquise nome ou apartamento..."
                      value={residentSearch}
                      onFocus={() => setShowDropdown(true)}
                      onChange={(e) => {
                        setResidentSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all uppercase"
                    />
                  </div>

                  {showDropdown && residentSearch && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                      {filteredResidents.map(r => (
                        <div 
                          key={r.id}
                          onClick={() => selectResident(r)}
                          className="p-5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black">
                                {r.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 uppercase leading-none">{r.nome}</p>
                              <p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest mt-1.5">Unidade {r.apto}</p>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-slate-300" />
                        </div>
                      ))}
                      {filteredResidents.length === 0 && (
                        <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase italic">
                          Morador não encontrado no sistema.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {newSession.unit && (
                  <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-xl">
                        <Building2 size={20} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vínculo Confirmado</p>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{newSession.name} • APTO {newSession.unit}</p>
                      </div>
                    </div>
                    <CheckCircle2 size={24} className="text-emerald-400" />
                  </div>
                )}
              </div>

              <div className="bg-amber-50 p-5 rounded-[1.5rem] border border-amber-100 flex gap-4">
                <AlertCircle className="text-amber-500 shrink-0" size={24} />
                <p className="text-[10px] text-amber-800 leading-relaxed font-black uppercase tracking-wider">
                  Certifique-se de que a temperatura da sauna {newSession.saunaType} está adequada e o morador conhece as normas de segurança.
                </p>
              </div>

              <button 
                type="submit"
                disabled={!newSession.residentId}
                className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-lg hover:bg-emerald-700 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                <Play size={24} className="fill-current" />
                ATIVAR SAUNA AGORA
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaunaView;

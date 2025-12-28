
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Building2, 
  Loader2, 
  Search,
  AlertCircle,
  History,
  Info,
  User,
  MessageSquare,
  Timer,
  ChevronRight,
  ChevronLeft,
  FileText,
  BarChart3,
  X,
  ShieldCheck,
  Check
} from 'lucide-react';
import { CleaningTask } from '../types';
import { db, collection, query, where, onSnapshot, doc, updateDoc } from '../services/firebaseConfig';

interface CleaningViewProps {
  currentCondominioId: string;
}

const CleaningView: React.FC<CleaningViewProps> = ({ currentCondominioId }) => {
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'operacional' | 'historico'>('operacional');
  
  // Estados para Finalização
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [taskToFinish, setTaskToFinish] = useState<CleaningTask | null>(null);
  
  // Estados para Histórico
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(new Date());

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'limpeza'), where('condominioId', '==', currentCondominioId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: CleaningTask[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as CleaningTask);
      });
      
      data.sort((a, b) => new Date(b.dataLimpeza).getTime() - new Date(a.dataLimpeza).getTime());
      setTasks(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentCondominioId]);

  const last12Months = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d);
    }
    return months;
  }, []);

  const handleFinishClick = (task: CleaningTask) => {
    setTaskToFinish(task);
    setShowConfirmModal(true);
  };

  const confirmFinishCleaning = async () => {
    if (!taskToFinish) return;
    try {
      await updateDoc(doc(db, 'limpeza', taskToFinish.id), {
        status: 'realizada',
        finalizadoEm: new Date().toISOString(),
        finalizadoPor: "Equipe de Higiene Amaranthus"
      });
      setShowConfirmModal(false);
      setTaskToFinish(null);
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  const operationalTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'pendente' && 
      (t.espaco.toLowerCase().includes(searchQuery.toLowerCase()) || 
       t.responsavelLimpeza?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tasks, searchQuery]);

  const historyTasks = useMemo(() => {
    const month = selectedHistoryMonth.getMonth();
    const year = selectedHistoryMonth.getFullYear();
    
    return tasks.filter(t => {
      const taskDate = new Date(t.dataLimpeza + 'T12:00:00');
      return t.status === 'realizada' && 
             taskDate.getMonth() === month && 
             taskDate.getFullYear() === year &&
             (t.espaco.toLowerCase().includes(searchQuery.toLowerCase()) || 
              t.responsavelLimpeza?.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [tasks, selectedHistoryMonth, searchQuery]);

  const stats = useMemo(() => {
    const total = historyTasks.length;
    const spaces = historyTasks.reduce((acc: any, curr) => {
      acc[curr.espaco] = (acc[curr.espaco] || 0) + 1;
      return acc;
    }, {});
    const mostUsed = Object.entries(spaces).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '—';
    
    return { total, mostUsed };
  }, [historyTasks]);

  const getSpaceColor = (space: string) => {
    switch (space.toLowerCase()) {
      case 'churrasqueira': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'social': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'quiosque': return 'text-violet-600 bg-violet-50 border-violet-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-emerald-600 gap-5">
      <Loader2 className="animate-spin" size={64} strokeWidth={1.5} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Consultando Registros de Higiene...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Gestão Operacional de Limpeza</h2>
          <div className="flex items-center gap-6 mt-4">
            <button 
              onClick={() => setActiveTab('operacional')}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-all ${activeTab === 'operacional' ? 'border-emerald-600 text-emerald-600 font-black' : 'border-transparent text-slate-400 font-bold hover:text-slate-600'}`}
            >
              <Sparkles size={18} />
              <span className="text-[10px] uppercase tracking-widest">Painel de Pendências</span>
            </button>
            <button 
              onClick={() => setActiveTab('historico')}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-all ${activeTab === 'historico' ? 'border-emerald-600 text-emerald-600 font-black' : 'border-transparent text-slate-400 font-bold hover:text-slate-600'}`}
            >
              <History size={18} />
              <span className="text-[10px] uppercase tracking-widest">Consulta Mensal (12 Meses)</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar espaço ou equipe..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      {activeTab === 'operacional' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {operationalTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-[2.5rem] border border-orange-100 hover:border-orange-300 shadow-2xl shadow-orange-900/5 transition-all overflow-hidden flex flex-col">
              <div className="p-6 flex items-center justify-between bg-orange-50/30 border-b border-slate-50">
                <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getSpaceColor(task.espaco)}`}>
                  {task.espaco}
                </div>
                <div className="flex items-center gap-1.5 text-orange-600 text-[10px] font-black uppercase">
                  <Clock size={12} />
                  Aguardando
                </div>
              </div>

              <div className="p-8 space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Data Programada</p>
                      <p className="text-xs font-black text-slate-800">{new Date(task.dataLimpeza + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl">
                      <Timer size={18} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Janela</p>
                      <p className="text-xs font-black text-slate-800">{task.horaInicio} - {task.horaFim}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={14} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Equipe Responsável</span>
                  </div>
                  <p className="text-xs font-black text-white uppercase tracking-tight">{task.responsavelLimpeza}</p>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <History size={14} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Evento de Origem</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-orange-500" />
                    <div>
                      <p className="text-[10px] font-black text-slate-700 uppercase leading-none">{task.responsavelReserva}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Unidade {task.unidadeReserva}</p>
                    </div>
                  </div>
                </div>

                {task.observacoes && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                    <MessageSquare size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-blue-800 font-bold uppercase leading-relaxed italic">"{task.observacoes}"</p>
                  </div>
                )}
              </div>

              <div className="p-8 pt-0">
                <button 
                  onClick={() => handleFinishClick(task)}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  <Sparkles size={16} /> Finalizar Higienização
                </button>
              </div>
            </div>
          ))}

          {operationalTasks.length === 0 && (
            <div className="col-span-full py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="p-8 bg-slate-50 rounded-full mb-4">
                <CheckCircle2 size={56} className="text-emerald-500" strokeWidth={1} />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tudo em conformidade</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto font-medium">Nenhuma ordem de higienização pendente no momento para o condomínio.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Dashboard Histórico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Calendar size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-emerald-500 font-black text-[9px] uppercase tracking-[0.3em] mb-4">Selecione o Período</h3>
                <div className="flex items-center gap-4">
                   <select 
                    value={selectedHistoryMonth.toISOString()} 
                    onChange={(e) => setSelectedHistoryMonth(new Date(e.target.value))}
                    className="bg-transparent text-2xl font-black uppercase tracking-tighter outline-none cursor-pointer hover:text-emerald-400 transition-colors"
                   >
                     {last12Months.map(m => (
                       <option key={m.toISOString()} value={m.toISOString()} className="bg-slate-800 text-white">
                         {m.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                       </option>
                     ))}
                   </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] mb-4">Total Realizado</h3>
                <p className="text-4xl font-black text-slate-800">{stats.total}</p>
              </div>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-emerald-600 uppercase">
                <Check size={14} /> Higienizações Concluídas
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] mb-4">Espaço Mais Limpo</h3>
                <p className="text-4xl font-black text-slate-800 truncate">{stats.mostUsed}</p>
              </div>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-blue-600 uppercase">
                <BarChart3 size={14} /> Fluxo do Mês
              </div>
            </div>
          </div>

          {/* Lista do Histórico */}
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-4">
                 <FileText className="text-slate-400" size={24} />
                 <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Relatório Detalhado de Higiene</h4>
               </div>
               <div className="text-[10px] font-black text-slate-400 uppercase">Período: {selectedHistoryMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50/50">
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Limpeza</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Espaço</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipe Responsável</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Finalizado em</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {historyTasks.map(task => (
                     <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-8 py-6 font-black text-slate-800 text-xs">
                         {new Date(task.dataLimpeza + 'T12:00:00').toLocaleDateString('pt-BR')}
                       </td>
                       <td className="px-8 py-6">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getSpaceColor(task.espaco)}`}>
                           {task.espaco}
                         </span>
                       </td>
                       <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                           <User size={12} className="text-slate-400" />
                           <span className="text-xs font-bold text-slate-600 uppercase">{task.responsavelLimpeza}</span>
                         </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase">
                           {task.finalizadoEm ? new Date(task.finalizadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                         </span>
                       </td>
                       <td className="px-8 py-6 text-right">
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase border border-emerald-200 shadow-sm">
                           <Check size={10} /> Concluído
                         </div>
                       </td>
                     </tr>
                   ))}
                   {historyTasks.length === 0 && (
                     <tr>
                       <td colSpan={5} className="py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em]">Nenhum registro encontrado para este mês</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação Customizado */}
      {showConfirmModal && taskToFinish && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 text-center">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
               <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ShieldCheck size={44} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Confirmar Higienização?</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 px-6">
                Espaço: <span className="text-slate-900">{taskToFinish.espaco.toUpperCase()}</span>
              </p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed px-4">
                Ao confirmar, você atesta que todos os protocolos de higiene do Amaranthus foram rigorosamente seguidos.
              </p>
            </div>

            <div className="p-8 space-y-3">
              <button 
                onClick={confirmFinishCleaning}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10 active:scale-95 flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={18} /> Sim, Protocolo Finalizado
              </button>
              <button 
                onClick={() => { setShowConfirmModal(false); setTaskToFinish(null); }}
                className="w-full py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Voltar e Revisar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningView;

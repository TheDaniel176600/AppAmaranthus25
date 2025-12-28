
import React, { useMemo } from 'react';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Wind,
  CheckSquare,
  ShieldCheck,
  ChevronRight,
  Flame,
  BrainCircuit,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  AlertOctagon,
  MessageSquareWarning,
  GlassWater,
  Droplets,
  Timer
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ModuleType, Task, TaskHistory, Occurrence, Reservation, SaunaSession, SpaceType } from '../types';
import { db, doc, updateDoc } from '../services/firebaseConfig';

const chartData = [
  { name: 'Jan', revenue: 45000, expenses: 32000 },
  { name: 'Fev', revenue: 52000, expenses: 35000 },
  { name: 'Mar', revenue: 48000, expenses: 41000 },
  { name: 'Abr', revenue: 61000, expenses: 38000 },
  { name: 'Mai', revenue: 55000, expenses: 42000 },
  { name: 'Jun', revenue: 67000, expenses: 39000 },
];

interface DashboardProps {
  onNavigate: (module: ModuleType) => void;
  activeModules: ModuleType[];
  tasks: Task[];
  occurrences: Occurrence[];
  reservations: Reservation[];
  saunaSessions: SaunaSession[];
  residentsCount: number;
}

const ClientDashboard: React.FC<DashboardProps> = ({ 
  onNavigate, 
  activeModules, 
  tasks, 
  occurrences, 
  reservations,
  saunaSessions,
  residentsCount 
}) => {
  const currentUser = JSON.parse(localStorage.getItem('amaranthus_session') || '{}');
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentDay = now.getDay();

  // Helpers para lógica de espaços
  const getSpaceStatus = (space: SpaceType) => {
    const spaceRes = reservations.filter(r => r.espaco === space && r.data === todayStr && r.status !== 'cancelado');
    
    // Encontrar agendamento atual
    const current = spaceRes.find(r => {
      const start = new Date(`${todayStr}T${r.horaInicio}:00`);
      const end = new Date(`${todayStr}T${r.horaFim}:00`);
      return now >= start && now <= end;
    });

    if (current) return { status: 'EM USO', data: current };

    // Encontrar próximo agendamento (dentro de 2h para "Em Preparação")
    const future = spaceRes
      .filter(r => new Date(`${todayStr}T${r.horaInicio}:00`) > now)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))[0];

    if (future) {
      const startTime = new Date(`${todayStr}T${future.horaInicio}:00`);
      const diffMs = startTime.getTime() - now.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      
      if (diffHrs <= 2) return { status: 'EM PREPARAÇÃO', data: future };
      return { status: 'LIVRE', next: future };
    }

    return { status: 'LIVRE' };
  };

  const getPreviousReservation = (space: SpaceType) => {
    return reservations
      .filter(r => r.espaco === space && (r.data < todayStr || (r.data === todayStr && new Date(`${todayStr}T${r.horaFim}:00`) < now)))
      .sort((a, b) => {
        const dateA = new Date(`${a.data}T${a.horaFim}:00`).getTime();
        const dateB = new Date(`${b.data}T${b.horaFim}:00`).getTime();
        return dateB - dateA;
      })[0];
  };

  const getNextReservation = (space: SpaceType) => {
    return reservations
      .filter(r => r.espaco === space && (r.data > todayStr || (r.data === todayStr && new Date(`${todayStr}T${r.horaInicio}:00`) > now)))
      .sort((a, b) => {
        const dateA = new Date(`${a.data}T${a.horaInicio}:00`).getTime();
        const dateB = new Date(`${b.data}T${b.horaInicio}:00`).getTime();
        return dateA - dateB;
      })[0];
  };

  const spacesConfig = [
    { key: 'churrasqueira' as SpaceType, label: 'Churrasqueira', icon: Flame, color: 'emerald' },
    { key: 'social' as SpaceType, label: 'Salão Social', icon: GlassWater, color: 'blue' },
    { key: 'quiosque' as SpaceType, label: 'Quiosque', icon: Sun, color: 'orange' },
    { key: 'sauna_seca' as SpaceType, label: 'Sauna Seca', icon: Wind, color: 'rose' },
    { key: 'sauna_umida' as SpaceType, label: 'Sauna Úmida', icon: Droplets, color: 'cyan' },
  ];

  const tasksForToday = useMemo(() => {
    return tasks
      .filter(task => {
        if (!task.ativo) return false;
        if (task.tipo === 'unica') return task.dataUnica === todayStr;
        return task.diasSemana?.includes(currentDay);
      })
      .sort((a, b) => {
        const aDone = a.historicoConclusao.some(h => h.dataBase === todayStr);
        const bDone = b.historicoConclusao.some(h => h.dataBase === todayStr);
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
      });
  }, [tasks, todayStr, currentDay]);

  const openOccurrences = useMemo(() => {
    return occurrences.filter(occ => occ.status === 'aberto' || occ.status === 'em_andamento')
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [occurrences]);

  const handleToggleTask = async (task: Task) => {
    const isDoneToday = task.historicoConclusao.some(h => h.dataBase === todayStr);
    let newHistory = [...task.historicoConclusao];
    if (isDoneToday) newHistory = newHistory.filter(h => h.dataBase !== todayStr);
    else {
      newHistory = [{
        concluidoPor: currentUser.id || 'unknown',
        concluidoPorNome: currentUser.nome || 'Sistema',
        dataConclusao: new Date().toISOString(),
        dataBase: todayStr
      }, ...newHistory];
    }
    try {
      await updateDoc(doc(db, 'tarefas', task.id), { historicoConclusao: newHistory });
    } catch (err) {}
  };

  const pendingCount = tasksForToday.filter(t => !t.historicoConclusao.some(h => h.dataBase === todayStr)).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Grade de Espaços Amaranthus */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Timeline de Uso • Áreas Comuns</h3>
          <button onClick={() => onNavigate(ModuleType.RESERVATIONS)} className="text-emerald-600 font-black text-[9px] uppercase tracking-widest hover:underline flex items-center gap-1">Ver Agenda <ChevronRight size={12} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {spacesConfig.map((space) => {
            const { status, data: activeRes } = getSpaceStatus(space.key);
            const prev = getPreviousReservation(space.key);
            const next = getNextReservation(space.key);
            const Icon = space.icon;

            return (
              <div key={space.key} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col group hover:border-emerald-500 transition-all">
                <div className="p-6 pb-4 border-b border-slate-50 flex items-center justify-between">
                  <div className={`p-3 rounded-2xl bg-${space.color}-50 text-${space.color}-600`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${
                    status === 'EM USO' ? 'bg-blue-100 text-blue-700 animate-pulse' : 
                    status === 'EM PREPARAÇÃO' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {status}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">{space.label}</h4>
                    {status !== 'LIVRE' && activeRes && (
                      <div className="mt-3">
                        <p className="text-[10px] font-black text-slate-900 truncate uppercase">{activeRes.responsavel}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Apto {activeRes.unidade} • {activeRes.horaInicio} - {activeRes.horaFim}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Bloco Anterior */}
                    <div className="opacity-50">
                       <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Anterior</p>
                       {prev ? (
                         <div className="flex items-center justify-between text-[9px] font-bold text-slate-600">
                           <span className="truncate max-w-[60px] uppercase">{prev.responsavel.split(' ')[0]}</span>
                           <span className="shrink-0">{prev.data === todayStr ? prev.horaFim : new Date(prev.data).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</span>
                         </div>
                       ) : <span className="text-[8px] font-bold text-slate-300">Nenhum</span>}
                    </div>

                    {/* Bloco Próximo */}
                    <div>
                       <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximo</p>
                       {next ? (
                         <div className="flex items-center justify-between text-[9px] font-black text-slate-800">
                           <span className="truncate max-w-[60px] uppercase">{next.responsavel.split(' ')[0]}</span>
                           <span className="shrink-0 text-emerald-600">{next.data === todayStr ? next.horaInicio : new Date(next.data).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</span>
                         </div>
                       ) : <span className="text-[8px] font-bold text-slate-300">Nenhum</span>}
                    </div>
                  </div>
                </div>

                <div className={`h-1.5 w-full bg-slate-100`}>
                  <div className={`h-full bg-${space.color}-500 transition-all duration-1000 ${status === 'EM USO' ? 'w-full' : status === 'EM PREPARAÇÃO' ? 'w-1/2' : 'w-0'}`}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* IA Smart Amaranthus - Posição de Destaque */}
        <div className="bg-emerald-600 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute -top-10 -right-10 p-12 opacity-10 transition-transform group-hover:scale-110">
            <BrainCircuit size={300} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <BrainCircuit size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-2xl tracking-tighter leading-none uppercase">Assistente Gemini</h3>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Insight Operacional Real-Time</span>
              </div>
            </div>
            <div className="bg-white/10 p-6 rounded-[2rem] border border-white/20 backdrop-blur-md">
              <p className="text-sm text-emerald-50 leading-relaxed italic font-medium">
                "{openOccurrences.length > 0 
                  ? `Análise: Temos ${openOccurrences.length} chamados ativos. Notei que 2 são sobre manutenção na garagem, o que sugere uma vistoria preventiva no local.` 
                  : 'Status: Operação impecável. Sugiro utilizar a baixa movimentação de hoje para antecipar a limpeza do Salão Social.'}"
              </p>
            </div>
          </div>
          <button className="relative z-10 mt-10 w-full py-5 bg-white text-emerald-700 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-xl active:scale-95">
            Gerar Relatório de Eficiência
          </button>
        </div>

        {/* Quadro de Tarefas do Turno */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col h-[450px]">
           <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Checklist Diário</h3>
                <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">Tarefas Operacionais</p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${pendingCount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {pendingCount > 0 ? `${pendingCount} Pendentes` : 'Finalizado'}
              </div>
           </div>
           <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {tasksForToday.map(task => {
                const isDone = task.historicoConclusao.some(h => h.dataBase === todayStr);
                return (
                  <div key={task.id} onClick={() => handleToggleTask(task)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${isDone ? 'border-emerald-100 bg-emerald-50/30 text-emerald-700 opacity-60' : 'border-slate-100 hover:border-emerald-200'}`}>
                    <div className="flex items-center gap-4 truncate">
                       <div className={`p-2 rounded-xl shrink-0 ${isDone ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                          {isDone ? <CheckCircle2 size={16} /> : (task.turno === 'diurno' ? <Sun size={16} /> : <Moon size={16} />)}
                       </div>
                       <div className="truncate">
                          <p className={`text-xs font-black uppercase tracking-tight truncate ${isDone ? 'line-through opacity-40' : ''}`}>{task.titulo}</p>
                          <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">{task.turno} • {task.tipo}</p>
                       </div>
                    </div>
                    {isDone ? <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0"><CheckCircle2 size={12} /></div> : <div className="w-5 h-5 border-2 border-slate-200 rounded-full shrink-0 group-hover:bg-emerald-100 transition-colors"></div>}
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      {/* Cards de Métricas e Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Moradores', value: residentsCount.toString(), change: '+2', icon: Users, color: 'blue', module: ModuleType.RESIDENTS },
              { title: 'Ocorrências', value: openOccurrences.length.toString(), change: openOccurrences.length > 0 ? 'ALTA' : 'OK', icon: AlertOctagon, color: 'rose', module: ModuleType.OCCURRENCES },
              { title: 'Financeiro', value: 'R$ 87k', change: '+5.4%', icon: DollarSign, color: 'emerald', module: ModuleType.FINANCIAL },
            ].filter(card => activeModules.includes(card.module)).map((card, i) => (
              <button key={i} onClick={() => onNavigate(card.module)} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-${card.color}-50 text-${card.color}-600`}><card.icon size={20} /></div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-full ${card.change === 'OK' || card.change.includes('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{card.change}</span>
                </div>
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{card.title}</h3>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{card.value}</p>
              </button>
            ))}
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Financeiro Consolidado</h3>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-2 text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Receita</span>
                <span className="flex items-center gap-2 text-red-500"><div className="w-2 h-2 rounded-full bg-red-500"></div> Despesa</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="transparent" strokeWidth={4} strokeDasharray="8 8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chamados Recentes */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Ocorrências Ativas</h3>
              <AlertOctagon size={24} className="text-slate-300" />
           </div>
           <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {openOccurrences.slice(0, 5).map(occ => (
                <div key={occ.id} onClick={() => onNavigate(ModuleType.OCCURRENCES)} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group cursor-pointer hover:border-emerald-200 transition-all">
                  <p className="text-[10px] font-black text-slate-900 uppercase truncate mb-1">{occ.titulo}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Unidade {occ.unidade}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${occ.prioridade === 'alta' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{occ.prioridade}</span>
                  </div>
                </div>
              ))}
              {openOccurrences.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                  <CheckCircle2 size={48} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sem ocorrências ativas</p>
                </div>
              )}
           </div>
           <button onClick={() => onNavigate(ModuleType.OCCURRENCES)} className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all">Ver Painel Completo</button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;


import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  AlertCircle,
  Sun,
  Moon,
  X,
  Save,
  Loader2,
  Calendar,
  Filter,
  Edit2,
  ShieldAlert,
  AlertOctagon,
  AlertTriangle
} from 'lucide-react';
import { Task, UserRole, TaskHistory } from '../types';
import { db, collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from '../services/firebaseConfig';

const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'HOJE' | 'CONFIG'>('HOJE');

  const CONDOMINIO_ID = "VeMhb3zf9qLPQpVLeXp4";
  const currentUser = JSON.parse(localStorage.getItem('amaranthus_session') || '{}');

  // Form State
  const initialForm = {
    titulo: '',
    descricao: '',
    tipo: 'recorrente' as 'recorrente' | 'unica',
    turno: 'diurno' as 'diurno' | 'noturno',
    diasSemana: [] as number[],
    dataUnica: '',
    ativo: true
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'tarefas'), where('condominioId', '==', CONDOMINIO_ID));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Task[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Task);
      });
      setTasks(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const todayStr = now.toISOString().split('T')[0];
  const currentShift = (currentHour >= 7 && currentHour < 19) ? 'diurno' : 'noturno';

  const tasksForToday = useMemo(() => {
    return tasks.filter(task => {
      if (!task.ativo) return false;
      if (task.tipo === 'unica') {
        return task.dataUnica === todayStr;
      } else {
        return task.diasSemana?.includes(currentDay);
      }
    });
  }, [tasks, currentDay, todayStr]);

  const executeSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        titulo: formData.titulo.toUpperCase(),
        descricao: formData.descricao,
        tipo: formData.tipo,
        turno: formData.turno,
        diasSemana: formData.tipo === 'recorrente' ? formData.diasSemana : [],
        dataUnica: formData.tipo === 'unica' ? formData.dataUnica : '',
        ativo: formData.ativo,
        condominioId: CONDOMINIO_ID,
        modificadoEm: new Date().toISOString()
      };

      if (editingId) {
        const currentTask = tasks.find(t => t.id === editingId);
        await updateDoc(doc(db, 'tarefas', editingId), {
          ...payload,
          historicoConclusao: currentTask?.historicoConclusao || []
        });
      } else {
        await addDoc(collection(db, 'tarefas'), {
          ...payload,
          historicoConclusao: [],
          criadoEm: new Date().toISOString()
        });
      }
      
      setIsModalOpen(false);
      setShowUpdateConfirm(false);
      setEditingId(null);
      setFormData(initialForm);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setShowUpdateConfirm(true);
    } else {
      executeSave();
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const isDoneToday = task.historicoConclusao.some(h => h.dataBase === todayStr);
    let newHistory = [...task.historicoConclusao];

    if (isDoneToday) {
      newHistory = newHistory.filter(h => h.dataBase !== todayStr);
    } else {
      const completion: TaskHistory = {
        concluidoPor: currentUser.id || 'unknown',
        concluidoPorNome: currentUser.nome || 'Sistema',
        dataConclusao: new Date().toISOString(),
        dataBase: todayStr
      };
      newHistory = [completion, ...newHistory];
    }

    try {
      await updateDoc(doc(db, 'tarefas', task.id), {
        historicoConclusao: newHistory
      });
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  const executeDelete = async () => {
    if (!taskToDelete) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, 'tarefas', taskToDelete.id));
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    } catch (err) {
      alert('Erro ao excluir tarefa.');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerDelete = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setFormData({
      titulo: task.titulo,
      descricao: task.descricao,
      tipo: task.tipo,
      turno: task.turno,
      diasSemana: task.diasSemana || [],
      dataUnica: task.dataUnica || '',
      ativo: task.ativo
    });
    setIsModalOpen(true);
  };

  if (loading && tasks.length === 0) return (
    <div className="flex flex-col items-center justify-center h-96 text-emerald-600 gap-5">
      <Loader2 className="animate-spin" size={64} strokeWidth={1.5} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Sincronizando Quadro Operacional...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Gestão de Rotinas</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${currentShift === 'diurno' ? 'bg-amber-100 text-amber-600' : 'bg-slate-900 text-white shadow-lg'}`}>
              {currentShift === 'diurno' ? <Sun size={12} /> : <Moon size={12} />}
              Turno Atual: {currentShift} (07h-19h)
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex shadow-sm">
             <button 
              onClick={() => setActiveTab('HOJE')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HOJE' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
             >
               Hoje
             </button>
             <button 
              onClick={() => setActiveTab('CONFIG')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CONFIG' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
             >
               Configuração
             </button>
          </div>
          <button 
            onClick={() => { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); }}
            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl active:scale-95 flex items-center gap-3"
          >
            <Plus size={18} /> Nova Tarefa
          </button>
        </div>
      </div>

      {activeTab === 'HOJE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Filter size={14} className="text-emerald-500" /> Fila do Turno ({currentShift})
              </h3>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">Sincronizado</span>
            </div>
            
            <div className="space-y-4">
              {tasksForToday.filter(t => t.turno === currentShift).map(task => {
                const isDone = task.historicoConclusao.some(h => h.dataBase === todayStr);
                return (
                  <div key={task.id} className={`bg-white p-8 rounded-[2.5rem] border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${isDone ? 'opacity-50 border-emerald-100 bg-emerald-50/20' : 'border-slate-100 shadow-xl shadow-slate-200/50 hover:border-emerald-200'}`}>
                    <div className="flex items-start gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {isDone ? <CheckCircle2 size={28} /> : (task.turno === 'diurno' ? <Sun size={28} /> : <Moon size={28} />)}
                      </div>
                      <div>
                        <h4 className={`text-lg font-black text-slate-800 tracking-tight uppercase ${isDone ? 'line-through decoration-emerald-500 decoration-2' : ''}`}>
                          {task.titulo}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">{task.descricao}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleComplete(task)}
                      className={`w-full sm:w-auto px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isDone ? 'bg-white border-2 border-emerald-500 text-emerald-600' : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-lg active:scale-95'}`}
                    >
                      {isDone ? 'Desfazer' : 'Concluir'}
                    </button>
                  </div>
                );
              })}
              {tasksForToday.filter(t => t.turno === currentShift).length === 0 && (
                <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <CheckSquare size={48} className="mx-auto text-slate-300 mb-4 opacity-20" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhuma tarefa pendente.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 flex items-center gap-2">
              <Clock size={14} className="text-slate-300" /> Outros Horários do Dia
            </h3>
            <div className="space-y-4">
              {tasksForToday.filter(t => t.turno !== currentShift).map(task => {
                const isDone = task.historicoConclusao.some(h => h.dataBase === todayStr);
                return (
                  <div key={task.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 opacity-60 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                         {task.turno === 'diurno' ? <Sun size={18} /> : <Moon size={18} />}
                       </div>
                       <div>
                         <p className="text-sm font-black text-slate-600 uppercase tracking-tight">{task.titulo}</p>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Turno {task.turno}</p>
                       </div>
                    </div>
                    {isDone && <CheckCircle2 size={20} className="text-emerald-500" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100">
                  <CheckSquare size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Matriz de Rotinas Amaranthus</h4>
               </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarefa</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Turno</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{task.titulo}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{task.descricao}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1">
                        {task.tipo === 'unica' ? (
                          <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">
                            {task.dataUnica ? new Date(task.dataUnica + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem Data'}
                          </span>
                        ) : (
                          ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                            <span key={idx} className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${task.diasSemana?.includes(idx) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                              {day}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${task.turno === 'diurno' ? 'text-amber-600' : 'text-slate-900'}`}>
                        {task.turno}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(task)} className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-emerald-600 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => triggerDelete(task)} className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-200">
                  {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{editingId ? 'Editar Rotina' : 'Nova Rotina Operacional'}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Configuração Amaranthus</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Tarefa</label>
                  <input 
                    required 
                    placeholder="EX: LIMPEZA DO HALL" 
                    value={formData.titulo} 
                    onChange={e => setFormData({...formData, titulo: e.target.value.toUpperCase()})} 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turno de Execução</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'diurno', label: 'Manhã', icon: Sun },
                      { id: 'noturno', label: 'Noite', icon: Moon }
                    ].map(t => (
                      <button 
                        key={t.id} 
                        type="button"
                        onClick={() => setFormData({...formData, turno: t.id as any})}
                        className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 border-2 transition-all ${formData.turno === t.id ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        <t.icon size={14} /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Detalhada</label>
                <textarea rows={2} value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-emerald-500 resize-none" placeholder="O que deve ser feito?"></textarea>
              </div>

              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Agendamento</label>
                   <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" checked={formData.tipo === 'recorrente'} onChange={() => setFormData({...formData, tipo: 'recorrente'})} className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-emerald-600">Recorrente</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" checked={formData.tipo === 'unica'} onChange={() => setFormData({...formData, tipo: 'unica'})} className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-emerald-600">Única</span>
                      </label>
                   </div>
                </div>

                {formData.tipo === 'recorrente' ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Selecione os dias da semana:</p>
                    <div className="grid grid-cols-7 gap-2">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const newDays = formData.diasSemana.includes(idx) 
                              ? formData.diasSemana.filter(d => d !== idx)
                              : [...formData.diasSemana, idx];
                            setFormData({...formData, diasSemana: newDays});
                          }}
                          className={`h-12 rounded-xl font-black transition-all border-2 ${formData.diasSemana.includes(idx) ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data da Execução</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required={formData.tipo === 'unica'}
                        type="date" 
                        value={formData.dataUnica} 
                        onChange={e => setFormData({...formData, dataUnica: e.target.value})} 
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 shrink-0 bg-slate-50/50 flex gap-4 mt-auto">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 border-2 border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all"
                >
                  Descartar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {editingId ? 'Atualizar Rotina' : 'Salvar no Quadro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Atualização */}
      {showUpdateConfirm && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 text-center">
            <div className="p-10 border-b border-slate-50 bg-slate-50/50">
              <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-amber-50">
                <AlertOctagon size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3">Confirmar Atualização?</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed px-6">
                Você está prestes a alterar uma rotina operacional do Edifício Amaranthus. Esta mudança afetará o quadro de hoje imediatamente.
              </p>
            </div>
            
            <div className="p-10 flex flex-col gap-3">
              <button 
                onClick={() => executeSave()}
                disabled={isSaving}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <ShieldAlert size={18} />
                )}
                {isSaving ? 'Salvando...' : 'Sim, Confirmar Alterações'}
              </button>
              <button 
                onClick={() => setShowUpdateConfirm(false)}
                disabled={isSaving}
                className="w-full py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Voltar e Revisar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && taskToDelete && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 text-center">
            <div className="p-10 border-b border-slate-50 bg-red-50/50">
              <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-red-50">
                <AlertTriangle size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3">Excluir Rotina?</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed px-6 mb-2">
                Você está prestes a remover permanentemente a tarefa:
              </p>
              <span className="inline-block px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">
                {taskToDelete.titulo}
              </span>
            </div>
            
            <div className="p-10 flex flex-col gap-3">
              <button 
                onClick={executeDelete}
                disabled={isSaving}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl shadow-red-100 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Trash2 size={18} />
                )}
                {isSaving ? 'Excluindo...' : 'Sim, Excluir Permanentemente'}
              </button>
              <button 
                onClick={() => { setShowDeleteConfirm(false); setTaskToDelete(null); }}
                disabled={isSaving}
                className="w-full py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancelar Operação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;

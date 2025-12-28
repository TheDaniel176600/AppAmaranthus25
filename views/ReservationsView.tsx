
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  X, 
  User, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Search,
  AlertTriangle,
  Loader2,
  Trash2,
  Clock,
  MessageSquare,
  Info,
  Lock,
  Edit3,
  AlertOctagon,
  Sparkles,
  ClipboardCheck,
  ShieldCheck,
  Wind,
  Droplets,
  Flame,
  Sun,
  GlassWater
} from 'lucide-react';
import { Resident, Reservation, SpaceType } from '../types';
import { db, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from '../services/firebaseConfig';

interface ReservationsViewProps {
  residents: Resident[];
  currentCondominioId: string;
}

const ReservationsView: React.FC<ReservationsViewProps> = ({ residents, currentCondominioId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [reservationToFinalize, setReservationToFinalize] = useState<Reservation | null>(null);
  const [cleaningData, setCleaningData] = useState({
    responsavel: '',
    horaInicio: '08:00',
    horaFim: '10:00',
    observacoes: ''
  });
  
  const currentUser = JSON.parse(localStorage.getItem('amaranthus_session') || '{}');

  const [residentSearch, setResidentSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    responsavel: '',
    unidade: '',
    espaco: 'churrasqueira' as SpaceType,
    horaInicio: '08:00',
    horaFim: '22:00',
    observacoes: '',
    residentId: ''
  });

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'agendamentos'), where('condominioId', '==', currentCondominioId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Reservation[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Reservation);
      });
      setReservations(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentCondominioId]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const formatDate = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const getReservationsForDate = (dateStr: string) => reservations.filter(r => r.data === dateStr);

  const handleDateClick = (day: number) => {
    const dateStr = formatDate(day);
    setSelectedDate(dateStr);
    setEditingId(null);
    setFormData({ 
      espaco: 'churrasqueira',
      responsavel: '',
      unidade: '',
      residentId: '',
      observacoes: '',
      horaInicio: '08:00',
      horaFim: '22:00'
    });
    setResidentSearch('');
    setIsModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, res: Reservation) => {
    e.stopPropagation();
    setSelectedDate(res.data);
    setEditingId(res.id);
    setFormData({
      espaco: res.espaco,
      responsavel: res.responsavel,
      unidade: res.unidade,
      horaInicio: res.horaInicio,
      horaFim: res.horaFim,
      observacoes: res.observacoes,
      residentId: ''
    });
    setResidentSearch(res.responsavel);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.responsavel) return;

    try {
      const payload = {
        condominioId: currentCondominioId,
        data: selectedDate,
        espaco: formData.espaco,
        horaInicio: formData.horaInicio,
        horaFim: formData.horaFim,
        observacoes: formData.observacoes,
        responsavel: formData.responsavel,
        unidade: formData.unidade,
        status: editingId ? (reservations.find(r=>r.id===editingId)?.status || 'liberado') : 'liberado',
        modificadoEm: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'agendamentos', editingId), payload);
      } else {
        await addDoc(collection(db, 'agendamentos'), {
          ...payload,
          criadoEm: new Date().toISOString(),
          criadoPor: currentUser.id || "admin"
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert('Erro ao salvar agendamento.');
    }
  };

  const handleOpenFinalize = (id: string) => {
    const res = reservations.find(r => r.id === id);
    if (res) {
      setReservationToFinalize(res);
      setCleaningData({ responsavel: '', horaInicio: '08:00', horaFim: '10:00', observacoes: '' });
      setShowFinalizeModal(true);
    }
  };

  const confirmFinalizeAndScheduleCleaning = async () => {
    if (!reservationToFinalize || !cleaningData.responsavel) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'agendamentos', reservationToFinalize.id), {
        status: 'concluido',
        finalizadoEm: new Date().toISOString()
      });
      const eventDate = new Date(reservationToFinalize.data + 'T12:00:00');
      eventDate.setDate(eventDate.getDate() + 1);
      const cleaningDate = eventDate.toISOString().split('T')[0];
      await addDoc(collection(db, 'limpeza'), {
        condominioId: currentCondominioId,
        espaco: reservationToFinalize.espaco,
        dataOriginalReserva: reservationToFinalize.data,
        dataLimpeza: cleaningDate,
        status: 'pendente',
        responsavelReserva: reservationToFinalize.responsavel,
        unidadeReserva: reservationToFinalize.unidade,
        responsavelLimpeza: cleaningData.responsavel,
        horaInicio: cleaningData.horaInicio,
        horaFim: cleaningData.horaFim,
        observacoes: cleaningData.observacoes,
        criadoEm: new Date().toISOString()
      });
      setShowFinalizeModal(false);
      setReservationToFinalize(null);
      if (isModalOpen) setIsModalOpen(false);
    } catch (err) {
      alert('Erro ao finalizar evento.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (id: string) => {
    const res = reservations.find(r => r.id === id);
    if (res) {
      setReservationToDelete(res);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (!reservationToDelete) return;
    try {
      await deleteDoc(doc(db, 'agendamentos', reservationToDelete.id));
      setShowDeleteConfirm(false);
      setReservationToDelete(null);
      if (isModalOpen) setIsModalOpen(false);
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  const resetForm = () => {
    setFormData({ responsavel: '', unidade: '', espaco: 'churrasqueira', horaInicio: '08:00', horaFim: '22:00', observacoes: '', residentId: '' });
    setResidentSearch('');
    setSelectedDate(null);
    setEditingId(null);
  };

  const filteredResidents = residents.filter(r => r.nome.toLowerCase().includes(residentSearch.toLowerCase()) || r.apto.toLowerCase().includes(residentSearch.toLowerCase()));

  const selectResident = (r: Resident) => {
    setFormData({ ...formData, responsavel: r.nome, unidade: r.apto, residentId: r.id });
    setResidentSearch(r.nome);
    setShowDropdown(false);
  };

  const spaceConfigs = {
    churrasqueira: { label: 'Churrasqueira', color: 'emerald', icon: Flame },
    social: { label: 'Salão Social', color: 'blue', icon: GlassWater },
    quiosque: { label: 'Quiosque', color: 'amber', icon: Sun },
    sauna_seca: { label: 'Sauna Seca', color: 'rose', icon: Wind },
    sauna_umida: { label: 'Sauna Úmida', color: 'cyan', icon: Droplets }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const cells = [];
    const today = new Date().toISOString().split('T')[0];

    // Células vazias do início do mês
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[140px] bg-slate-50/50"></div>);
    }

    // Dias do mês
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = formatDate(day);
      const dayRes = getReservationsForDate(dateStr);
      const isToday = today === dateStr;

      cells.push(
        <div 
          key={day} 
          onClick={() => handleDateClick(day)} 
          className={`min-h-[140px] p-3 transition-all cursor-pointer relative group bg-white hover:bg-slate-50 flex flex-col`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-xs font-black tracking-tighter w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
              isToday ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 group-hover:text-slate-800'
            }`}>
              {day}
            </span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar pb-6">
            {dayRes.map((res) => (
              <div 
                key={res.id} 
                onClick={(e) => handleEditClick(e, res)} 
                className={`flex items-center gap-2 p-1.5 rounded-lg bg-${spaceConfigs[res.espaco]?.color || 'slate'}-50 border border-${spaceConfigs[res.espaco]?.color || 'slate'}-100 hover:bg-white hover:shadow-sm transition-all`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center bg-${spaceConfigs[res.espaco]?.color || 'slate'}-500 text-white`}>
                  {React.createElement(spaceConfigs[res.espaco]?.icon || CalendarIcon, { size: 8 })}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black text-slate-800 uppercase truncate leading-none">{res.unidade} • {res.responsavel.split(' ')[0]}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus size={14} className="text-emerald-500" />
          </div>
          {isToday && (
            <div className="absolute inset-0 border-2 border-emerald-500/20 pointer-events-none"></div>
          )}
        </div>
      );
    }
    return cells;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[600px] text-emerald-600 gap-5">
      <Loader2 className="animate-spin" size={64} strokeWidth={1.5} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Sincronizando Agenda Premium Amaranthus...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1400px] mx-auto">
      {/* Header Premium */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Mapa de Áreas Comuns</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Controle Central Amaranthus</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(spaceConfigs).map(([key, cfg]) => (
              <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-${cfg.color}-100 bg-${cfg.color}-50`}>
                <cfg.icon size={12} className={`text-${cfg.color}-600`} />
                <span className={`text-[9px] font-black uppercase text-${cfg.color}-700 tracking-tighter`}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200">
            <button onClick={handlePrevMonth} className="p-3 hover:bg-white hover:shadow-sm rounded-[1.2rem] text-slate-400 hover:text-slate-800 transition-all"><ChevronLeft size={20} /></button>
            <div className="text-center min-w-[180px]">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            <button onClick={handleNextMonth} className="p-3 hover:bg-white hover:shadow-sm rounded-[1.2rem] text-slate-400 hover:text-slate-800 transition-all"><ChevronRight size={20} /></button>
          </div>
          <button 
            onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setIsModalOpen(true); }}
            className="bg-slate-900 text-white px-6 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} /> Nova Reserva
          </button>
        </div>
      </div>

      {/* Calendário com Grid de Linhas Exatas */}
      <div className="bg-slate-200 rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden p-[1px]">
        {/* Header de Dias da Semana */}
        <div className="grid grid-cols-7 gap-[1px] border-b border-slate-200 bg-slate-100">
          {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
            <div key={day} className="bg-slate-50 py-4 text-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{day.substring(0, 3)}</span>
            </div>
          ))}
        </div>
        {/* Corpo do Calendário */}
        <div className="grid grid-cols-7 gap-[1px]">
          {renderCalendar()}
        </div>
      </div>

      {/* Modal de Agendamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 max-h-[90vh]">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div className={`p-5 ${editingId ? 'bg-blue-600' : 'bg-emerald-600'} text-white rounded-[1.5rem] shadow-xl`}>
                  {editingId ? <Edit3 size={32} /> : <CalendarIcon size={32} />}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{editingId ? 'Detalhes da Reserva' : 'Configurar Agendamento'}</h3>
                  <p className="text-xs text-slate-400 font-black uppercase mt-1 tracking-widest">
                    Data: <span className="text-emerald-600">{new Date(selectedDate! + 'T00:00:00').toLocaleDateString('pt-BR', { dateStyle: 'long' })}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-5 hover:bg-slate-100 rounded-[2rem] text-slate-400 transition-all"><X size={32} /></button>
            </div>

            <form onSubmit={handleSave} className="p-12 space-y-10 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Área de Uso</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(spaceConfigs).map(([key, cfg]) => {
                    const isTaken = !editingId && reservations.some(r => r.data === selectedDate && r.espaco === key);
                    return (
                      <label 
                        key={key} 
                        className={`flex flex-col items-center justify-center p-6 border-2 rounded-[2rem] transition-all cursor-pointer relative ${
                          isTaken 
                          ? 'opacity-20 grayscale bg-slate-50 cursor-not-allowed border-transparent' 
                          : formData.espaco === key 
                            ? `border-${cfg.color}-500 bg-${cfg.color}-50 text-${cfg.color}-700 shadow-lg` 
                            : 'border-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input type="radio" name="espaco" className="hidden" disabled={isTaken} checked={formData.espaco === key} onChange={() => setFormData({...formData, espaco: key as SpaceType})} />
                        <cfg.icon size={24} className="mb-3" />
                        <span className="font-black uppercase tracking-tighter text-[10px] text-center">{cfg.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Início</label>
                  <input type="time" value={formData.horaInicio} onChange={e => setFormData({...formData, horaInicio: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Término</label>
                  <input type="time" value={formData.horaFim} onChange={e => setFormData({...formData, horaFim: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Responsável</label>
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input required type="text" placeholder="BUSCAR MORADOR..." value={residentSearch} onFocus={() => setShowDropdown(true)} onChange={(e) => { setResidentSearch(e.target.value); setShowDropdown(true); }} className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black uppercase outline-none focus:border-emerald-500 transition-all" />
                </div>
                {showDropdown && residentSearch && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl z-[110] max-h-52 overflow-y-auto divide-y divide-slate-50 custom-scrollbar p-2">
                    {filteredResidents.map(r => (
                      <div key={r.id} onClick={() => selectResident(r)} className="p-5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between rounded-3xl transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 uppercase">{r.nome.charAt(0)}</div>
                          <div>
                            <p className="text-xs font-black text-slate-800 uppercase leading-none">{r.nome}</p>
                            <p className="text-[9px] text-emerald-600 uppercase font-black tracking-widest mt-1.5">Apto {r.apto}</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.responsavel && (
                <div className="p-8 bg-slate-900 rounded-[2.5rem] flex items-center justify-between animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-5">
                    <User size={24} className="text-emerald-500" />
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Vinculado</p>
                      <p className="text-base font-black text-white uppercase">{formData.responsavel}</p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase">Unidade {formData.unidade}</p>
                    </div>
                  </div>
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
              )}

              {editingId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <button type="button" onClick={() => handleOpenFinalize(editingId)} className="p-5 bg-emerald-50 text-emerald-600 rounded-[1.5rem] border border-emerald-100 flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest shadow-lg">Finalizar Evento</button>
                  <button type="button" onClick={() => openDeleteConfirm(editingId)} className="p-5 bg-red-50 text-red-600 rounded-[1.5rem] border border-red-100 flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest">Excluir Reserva</button>
                </div>
              )}
            </form>
            <div className="p-10 border-t border-slate-50 bg-slate-50/50 shrink-0">
              <button type="button" onClick={handleSave} disabled={!formData.responsavel} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50">
                {editingId ? 'Atualizar Reserva' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8"><AlertOctagon size={48} /></div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Excluir?</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-10 leading-relaxed px-4">Esta operação removerá os dados do cronograma.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Remover</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 bg-slate-100 text-slate-400 rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Voltar</button>
            </div>
          </div>
        </div>
      )}

      {/* Finalização com Higienização */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="p-10 border-b border-slate-50 text-center relative bg-slate-50/30">
               <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50"><Sparkles size={52} strokeWidth={1.5} /></div>
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Concluir & Higienizar</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">Protocolo Operacional Amaranthus</p>
              <button onClick={() => setShowFinalizeModal(false)} className="absolute top-10 right-10 p-3 text-slate-300 hover:text-slate-500 transition-colors"><X size={28} /></button>
            </div>
            <div className="p-12 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Equipe Responsável Limpeza</label>
                  <input required type="text" placeholder="NOME DA EQUIPE..." value={cleaningData.responsavel} onChange={e => setCleaningData({...cleaningData, responsavel: e.target.value.toUpperCase()})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black focus:border-emerald-500 outline-none uppercase" />
                </div>
            </div>
            <div className="p-10 border-t border-slate-50 bg-slate-50/50">
              <button onClick={confirmFinalizeAndScheduleCleaning} disabled={!cleaningData.responsavel} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50">Validar Encerramento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsView;

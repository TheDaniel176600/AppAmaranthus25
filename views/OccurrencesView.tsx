
import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertOctagon, Search, Plus, X, Camera, Image as ImageIcon, 
  Clock, CheckCircle2, XCircle, MoreVertical, Send, Loader2, 
  Trash2, User, Building2, Filter, ChevronRight, MessageSquare, 
  ShieldCheck, AlertTriangle, ArrowRightCircle, History, ZoomIn,
  ImagePlus
} from 'lucide-react';
import { Occurrence, OccurrenceStatus, OccurrencePriority, OccurrenceCategory, UserRole, OccurrenceUpdate } from '../types';
import { db, collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from '../services/firebaseConfig';

interface OccurrencesViewProps {
  currentCondominioId: string;
  userRole: UserRole;
}

const OccurrencesView: React.FC<OccurrencesViewProps> = ({ currentCondominioId, userRole }) => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OccurrenceStatus | 'todos'>('todos');
  const [isSaving, setIsSaving] = useState(false);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [newUpdatePhotos, setNewUpdatePhotos] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('amaranthus_session') || '{"id": "unknown", "nome": "Usuário"}');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  const initialForm = {
    titulo: '',
    descricao: '',
    prioridade: 'media' as OccurrencePriority,
    categoria: 'outros' as OccurrenceCategory,
    fotos: [] as string[]
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'ocorrencias'), where('condominioId', '==', currentCondominioId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Occurrence[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Occurrence);
      });
      data.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
      setOccurrences(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentCondominioId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'form' | 'update') => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (target === 'form') {
            setFormData(prev => ({ ...prev, fotos: [...prev.fotos, reader.result as string] }));
          } else {
            setNewUpdatePhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const occurrenceData = {
        condominioId: currentCondominioId,
        titulo: formData.titulo.toUpperCase(),
        descricao: formData.descricao,
        moradorId: currentUser.id,
        moradorNome: currentUser.nome,
        unidade: currentUser.apto || 'Administração',
        status: 'aberto' as OccurrenceStatus,
        prioridade: formData.prioridade,
        categoria: formData.categoria,
        fotos: formData.fotos,
        interacoes: [{
          usuarioId: currentUser.id,
          usuarioNome: currentUser.nome,
          texto: 'OCORRÊNCIA REGISTRADA NO SISTEMA AMARANTHUS.',
          data: new Date().toISOString()
        }],
        criadoEm: new Date().toISOString()
      };
      await addDoc(collection(db, 'ocorrencias'), occurrenceData);
      setIsFormOpen(false);
      setFormData(initialForm);
    } catch (err) {
      alert('Erro ao registrar ocorrência.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!selectedOccurrence || (!newUpdateText.trim() && newUpdatePhotos.length === 0)) return;
    setIsSaving(true);
    try {
      const newUpdate: OccurrenceUpdate = {
        usuarioId: currentUser.id,
        usuarioNome: currentUser.nome,
        texto: newUpdateText.toUpperCase(),
        data: new Date().toISOString(),
        fotos: newUpdatePhotos
      };
      const updatedInteracoes = [...selectedOccurrence.interacoes, newUpdate];
      await updateDoc(doc(db, 'ocorrencias', selectedOccurrence.id), {
        interacoes: updatedInteracoes
      });
      setSelectedOccurrence({ ...selectedOccurrence, interacoes: updatedInteracoes });
      setNewUpdateText('');
      setNewUpdatePhotos([]);
    } catch (err) {
      alert('Erro ao enviar atualização.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OccurrenceStatus) => {
    if (!selectedOccurrence) return;
    setIsSaving(true);
    try {
      const updateRecord: OccurrenceUpdate = {
        usuarioId: currentUser.id,
        usuarioNome: currentUser.nome,
        texto: `STATUS ALTERADO PARA: ${newStatus.replace('_', ' ').toUpperCase()}`,
        data: new Date().toISOString(),
        statusAnterior: selectedOccurrence.status,
        statusNovo: newStatus
      };
      const updatedData: any = {
        status: newStatus,
        interacoes: [...selectedOccurrence.interacoes, updateRecord]
      };
      if (newStatus === 'resolvido' || newStatus === 'cancelado') {
        updatedData.finalizadoEm = new Date().toISOString();
        updatedData.finalizadoPor = currentUser.nome;
      }
      await updateDoc(doc(db, 'ocorrencias', selectedOccurrence.id), updatedData);
      setSelectedOccurrence({ ...selectedOccurrence, ...updatedData });
    } catch (err) {
      alert('Erro ao atualizar status.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = occurrences.filter(occ => {
    if (userRole === UserRole.MORADOR && occ.moradorId !== currentUser.id) return false;
    const matchesSearch = occ.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          occ.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          occ.unidade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || occ.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: OccurrenceStatus) => {
    switch (status) {
      case 'aberto': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'em_andamento': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'resolvido': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'cancelado': return 'bg-slate-100 text-slate-400 border-slate-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-emerald-600 gap-5">
      <Loader2 className="animate-spin" size={64} strokeWidth={1.5} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Sincronizando Base de Ocorrências...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Gestão de Ocorrências</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
               <ShieldCheck size={12} className="text-emerald-600" />
               <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">Canal Direto Administrador</p>
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              {filtered.length} Registros encontrados
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
          >
            <Plus size={18} /> Registrar Ocorrência
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(occ => (
          <div 
            key={occ.id} 
            onClick={() => { setSelectedOccurrence(occ); setIsDetailOpen(true); }}
            className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden flex flex-col group"
          >
            <div className="p-8 space-y-6 flex-1">
              <div className="flex items-center justify-between">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(occ.status)}`}>
                  {occ.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  #{occ.id.substring(0, 5)}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-tight group-hover:text-emerald-600 transition-colors">
                  {occ.titulo}
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-2">
                  {occ.descricao}
                </p>
              </div>
              <div className="flex items-center gap-3 py-4 border-t border-slate-50">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{occ.moradorNome}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Unidade {occ.unidade}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex -space-x-2">
                  {occ.fotos.slice(0, 3).map((foto, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg border-2 border-white overflow-hidden shadow-sm">
                      <img src={foto} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {occ.fotos.length > 3 && (
                    <div className="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                      +{occ.fotos.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MessageSquare size={14} />
                  <span className="text-[10px] font-black">{occ.interacoes.length}</span>
                </div>
              </div>
            </div>
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {new Date(occ.criadoEm).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Novo Registro</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Canal de Atendimento Amaranthus</p>
                </div>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-4 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all"><X size={28} /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Ocorrência</label>
                <input required placeholder="EX: VAZAMENTO NO HALL" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value.toUpperCase()})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value as any})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:border-emerald-500">
                    <option value="manutencao">Manutenção</option>
                    <option value="seguranca">Segurança</option>
                    <option value="barulho">Barulho</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridade</label>
                  <select value={formData.prioridade} onChange={e => setFormData({...formData, prioridade: e.target.value as any})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:border-emerald-500">
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Detalhada</label>
                <textarea required rows={4} value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Descreva o ocorrido com o máximo de detalhes..." className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-emerald-500 resize-none"></textarea>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registros Fotográficos (Opcional)</label>
                <div className="flex flex-wrap gap-4">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all">
                    <Camera size={24} />
                    <span className="text-[8px] font-black uppercase">Adicionar</span>
                  </button>
                  {formData.fotos.map((foto, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg group">
                      <img src={foto} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, fotos: prev.fotos.filter((_, idx) => idx !== i) }))} className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'form')} />
              </div>
            </form>
            <div className="p-10 border-t border-slate-100 shrink-0 bg-slate-50/50 flex gap-4">
              <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-5 border-2 border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />} Confirmar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailOpen && selectedOccurrence && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden">
              <div className="p-12 space-y-8 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <div className={`px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(selectedOccurrence.status)}`}>
                    {selectedOccurrence.status.replace('_', ' ')}
                  </div>
                  <button onClick={() => setIsDetailOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl text-slate-400 lg:hidden"><X size={24} /></button>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-tight">{selectedOccurrence.titulo}</h3>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className={`w-2 h-2 rounded-full ${selectedOccurrence.prioridade === 'alta' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedOccurrence.prioridade} Prioridade</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria: {selectedOccurrence.categoria}</span>
                  </div>
                </div>
                <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{selectedOccurrence.descricao}</p>
                </div>
                
                {/* Fotos iniciais */}
                {selectedOccurrence.fotos.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Provas Fotográficas Iniciais</h5>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedOccurrence.fotos.map((foto, i) => (
                        <div key={i} onClick={() => setZoomedImage(foto)} className="aspect-video rounded-3xl overflow-hidden border-2 border-white shadow-lg hover:scale-[1.02] transition-all cursor-zoom-in relative group">
                          <img src={foto} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><ZoomIn size={32} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[2rem] text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><User size={24} className="text-emerald-500" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Solicitante Amaranthus</p>
                      <p className="font-black text-sm uppercase">{selectedOccurrence.moradorNome} • Apto {selectedOccurrence.unidade}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-12 flex flex-col h-full border-l border-slate-100">
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                    <History size={24} className="text-emerald-500" /> Histórico de Desenvolvimento
                  </h4>
                  <button onClick={() => setIsDetailOpen(false)} className="hidden lg:block p-3 hover:bg-slate-100 rounded-2xl text-slate-400"><X size={28} /></button>
                </div>
                <div className="flex-1 overflow-y-auto pr-4 space-y-8 custom-scrollbar mb-8">
                  {selectedOccurrence.interacoes.map((item, i) => (
                    <div key={i} className="relative pl-10">
                      {i !== selectedOccurrence.interacoes.length - 1 && <div className="absolute left-[11px] top-6 bottom-[-32px] w-0.5 bg-slate-100"></div>}
                      <div className={`absolute left-0 top-0 w-6 h-6 rounded-full border-4 border-white shadow-md flex items-center justify-center ${item.statusAnterior ? 'bg-orange-500' : 'bg-slate-900'}`}>
                        {item.statusAnterior ? <ArrowRightCircle size={10} className="text-white" /> : <div className="w-1 h-1 bg-white rounded-full"></div>}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{item.usuarioNome}</p>
                          <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(item.data).toLocaleDateString('pt-BR')} • {new Date(item.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`p-5 rounded-2xl text-xs leading-relaxed ${item.statusAnterior ? 'bg-orange-50 text-orange-700 font-black italic border border-orange-100' : 'bg-slate-50 text-slate-600 font-medium'}`}>
                          {item.texto}
                          {item.fotos && item.fotos.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-4">
                               {item.fotos.map((f, idx) => (
                                 <div key={idx} onClick={() => setZoomedImage(f)} className="aspect-video rounded-xl overflow-hidden cursor-zoom-in border border-white">
                                    <img src={f} className="w-full h-full object-cover" />
                                 </div>
                               ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100 shrink-0">
                  {/* Pré-visualização de fotos da atualização */}
                  {newUpdatePhotos.length > 0 && (
                    <div className="flex gap-2 p-2 bg-slate-50 rounded-2xl overflow-x-auto">
                      {newUpdatePhotos.map((p, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 group">
                           <img src={p} className="w-full h-full object-cover" />
                           <button onClick={() => setNewUpdatePhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-600/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={14} />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedOccurrence.status !== 'resolvido' && selectedOccurrence.status !== 'cancelado' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateStatus('em_andamento')} className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100">Mover para Análise</button>
                      <button onClick={() => handleUpdateStatus('resolvido')} className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100">Finalizar Resolvido</button>
                    </div>
                  )}
                  <div className="relative group">
                    <textarea rows={2} value={newUpdateText} onChange={e => setNewUpdateText(e.target.value)} placeholder="Adicione uma nota ou atualização..." className="w-full pl-6 pr-32 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium outline-none focus:border-emerald-500 transition-all resize-none"></textarea>
                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => updateFileInputRef.current?.click()}
                        className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                      >
                        <ImagePlus size={18} />
                      </button>
                      <button onClick={handleAddUpdate} disabled={isSaving || (!newUpdateText.trim() && newUpdatePhotos.length === 0)} className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-emerald-600 disabled:opacity-50 transition-all active:scale-90">
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </div>
                    <input ref={updateFileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'update')} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button onClick={() => setZoomedImage(null)} className="absolute -top-16 right-0 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"><X size={32} /></button>
            <img src={zoomedImage} className="w-full h-auto max-h-[80vh] rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border-4 border-white/10 object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OccurrencesView;

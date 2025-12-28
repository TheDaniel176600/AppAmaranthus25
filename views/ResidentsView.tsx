
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, X, Edit3, Trash2, User, Loader2, Save, Phone, Tag, Building2, AlertCircle, Database, MapPin, Lock,
  Camera, Car, CreditCard, Info, MoreHorizontal, CheckCircle2, UserPlus, Image as ImageIcon
} from 'lucide-react';
import { Resident, UserRole } from '../types';
import { db, collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from '../services/firebaseConfig';

interface ResidentsViewProps {
  currentCondominioId: string;
  userRole: UserRole;
}

const ResidentsView: React.FC<ResidentsViewProps> = ({ currentCondominioId, userRole }) => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Resident>>({
    nome: '', 
    apto: '', 
    telefone: '', 
    garagem: '', 
    vaga: '', 
    placa: '',
    foto: '',
    observacoes: ''
  });

  const canCreate = userRole === UserRole.SINDICO || userRole === UserRole.SUBSINDICO || userRole === UserRole.OWNER;
  const canEdit = userRole === UserRole.SINDICO || userRole === UserRole.SUBSINDICO || userRole === UserRole.OWNER;
  const canDelete = userRole === UserRole.SINDICO || userRole === UserRole.OWNER;

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'moradores'), where('condominioId', '==', currentCondominioId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Resident[] = [];
      snapshot.forEach((docSnap) => {
        const docData = docSnap.data();
        data.push({ id: docSnap.id, ...docData } as Resident);
      });
      
      data.sort((a, b) => a.apto.localeCompare(b.apto, undefined, {numeric: true}));
      setResidents(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentCondominioId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate && !editingId) return;

    try {
      const payload = {
        condominioId: currentCondominioId,
        condominioNome: "Edifício Amaranthus",
        nome: (formData.nome || '').toUpperCase(),
        apto: String(formData.apto || ''),
        telefone: formData.telefone || '',
        garagem: formData.garagem || '',
        vaga: (formData.vaga || '').toUpperCase(),
        placa: (formData.placa || '').toUpperCase(),
        foto: formData.foto || '',
        observacoes: formData.observacoes || '',
        ativo: true
      };

      if (editingId) {
        await updateDoc(doc(db, 'moradores', editingId), payload);
      } else {
        await addDoc(collection(db, 'moradores'), {
          ...payload,
          criadoEm: new Date().toISOString(),
          criadoPor: "Painel Admin"
        });
      }
      
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ nome: '', apto: '', telefone: '', garagem: '', vaga: '', placa: '', foto: '', observacoes: '' });
    } catch (err) {
      alert('Erro ao gravar dados.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (window.confirm('Deseja realmente remover este morador do sistema?')) {
      await deleteDoc(doc(db, 'moradores', id));
    }
  };

  const filtered = residents.filter(r => 
    r.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.apto.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.placa?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-emerald-600 gap-5">
      <Loader2 className="animate-spin" size={64} strokeWidth={1.5} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Carregando Base Amaranthus...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Gestão de Moradores</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              {residents.length} Moradores Cadastrados no Banco
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Nome, Apto ou Placa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 shadow-sm transition-all"
            />
          </div>
          {canCreate && (
            <button 
              onClick={() => { setEditingId(null); setFormData({ nome: '', apto: '', telefone: '', garagem: '', vaga: '', placa: '', foto: '', observacoes: '' }); setIsFormOpen(true); }}
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              <UserPlus size={20} /> Novo Morador
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Unidade</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logística & Veículo</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                        {r.foto ? (
                          <img src={r.foto} alt={r.nome} className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-base leading-tight uppercase">{r.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone size={10} className="text-emerald-500" />
                          <p className="text-[10px] text-slate-500 font-bold">{r.telefone || 'Sem telefone'}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-slate-900 text-white px-5 py-2 rounded-2xl font-black text-sm shadow-lg shadow-slate-200">
                      {r.apto}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Car size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                          Placa: <span className="text-emerald-600">{r.placa || 'N/A'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                          Pavimento: {r.garagem || '—'} • Vaga: {r.vaga || '—'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canEdit && (
                        <button 
                          onClick={() => { setEditingId(r.id); setFormData(r); setIsFormOpen(true); }}
                          className="p-3 bg-white border border-slate-200 hover:border-emerald-500 text-slate-400 hover:text-emerald-600 rounded-xl shadow-sm transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className="p-3 bg-white border border-slate-200 hover:border-red-500 text-slate-400 hover:text-red-600 rounded-xl shadow-sm transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <User size={64} className="mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">Nenhum morador encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                  {editingId ? <Edit3 size={28} /> : <UserPlus size={28} />}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                    {editingId ? 'Editar Cadastro' : 'Novo Cadastro'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Sincronização Amaranthus Exclusive</p>
                </div>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-4 hover:bg-slate-100 rounded-[1.5rem] text-slate-400 transition-all">
                <X size={32} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-10 overflow-y-auto custom-scrollbar flex-1 space-y-12">
              {/* Seção 1: Visual e Identificação */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-48 h-48 rounded-[3rem] bg-slate-50 border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500">
                      {formData.foto ? (
                        <img src={formData.foto} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-6">
                          <Camera size={40} className="text-slate-300 mx-auto mb-2" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enviar Foto</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-4 rounded-2xl shadow-xl group-hover:bg-emerald-600 transition-all">
                      <ImageIcon size={20} />
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center px-8 leading-relaxed">
                    A foto será utilizada para identificação biométrica e portaria.
                  </p>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Nome Completo</label>
                      <input required placeholder="EX: JOÃO DA SILVA" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-emerald-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Telefone / WhatsApp</label>
                      <input placeholder="(00) 00000-0000" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                    </div>
                  </div>
                  
                  <div className="p-8 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <Building2 className="text-emerald-600" size={24} />
                        <div>
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Unidade Residencial</p>
                          <p className="text-xs font-bold text-emerald-800 opacity-60">Vínculo obrigatório ao Edifício Amaranthus</p>
                        </div>
                     </div>
                     <input required placeholder="APTO" value={formData.apto} onChange={e => setFormData({...formData, apto: e.target.value})} className="w-32 px-6 py-4 bg-white border border-emerald-200 rounded-xl text-center font-black text-lg text-emerald-900 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                  </div>
                </div>
              </div>

              {/* Seção 2: Logística Veicular */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Logística Veicular</span>
                  <div className="h-px bg-slate-100 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Pavimento Garagem</label>
                    <div className="flex gap-2">
                      {['G1', 'G2'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData({...formData, garagem: g as any})}
                          className={`flex-1 py-4 rounded-xl font-black text-xs transition-all ${formData.garagem === g ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Nº da Vaga</label>
                    <input placeholder="EX: 12" value={formData.vaga} onChange={e => setFormData({...formData, vaga: e.target.value.toUpperCase()})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase outline-none focus:border-emerald-500" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Placa do Veículo Principal</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input placeholder="ABC-1234" value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value.toUpperCase()})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black uppercase outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Observações / Restrições</label>
                <textarea rows={3} value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-emerald-500 transition-all resize-none" placeholder="Ex: Autorizado para entregas na porta, restrição judicial, etc..."></textarea>
              </div>
            </form>

            <div className="p-10 border-t border-slate-100 shrink-0 bg-slate-50/50 flex gap-4">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="flex-1 py-5 border-2 border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all"
              >
                Cancelar Operação
              </button>
              <button 
                onClick={handleSave}
                type="button"
                className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-4 active:scale-95"
              >
                <Save size={20} /> Salvar no Banco de Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentsView;

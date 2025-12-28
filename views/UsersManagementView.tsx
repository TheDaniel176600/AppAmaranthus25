
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Search, ShieldCheck, UserCog, Loader2, CheckCircle2, X, Save, 
  Plus, Key, UserPlus, Camera, Image as ImageIcon, Trash2, Edit2, 
  RotateCcw, Calendar, Fingerprint, Mail
} from 'lucide-react';
import { UserRole } from '../types';
import { db, collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query } from '../services/firebaseConfig';

const UsersManagementView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State Amplo
  const initialForm = {
    nome: '',
    usuario: '',
    senha: '0000', // Padrão inicial
    dataNascimento: '',
    tipo: 'MORADOR',
    foto: '',
    email: ''
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    setLoading(true);
    const q = collection(db, 'usuarios');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    setIsSaving('saving');
    try {
      const payload = {
        ...formData,
        condominioId: "VeMhb3zf9qLPQpVLeXp4",
        modificadoEm: new Date().toISOString()
      };

      if (editingId) {
        const { senha, ...updateData } = payload; // Não altera senha no edit comum
        await updateDoc(doc(db, 'usuarios', editingId), updateData);
      } else {
        await addDoc(collection(db, 'usuarios'), {
          ...payload,
          criadoEm: new Date().toISOString()
        });
      }
      
      setShowToast(true);
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialForm);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert("Erro ao salvar usuário.");
    } finally {
      setIsSaving(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (window.confirm("Resetar senha para '0000'? O usuário será obrigado a trocar no próximo acesso.")) {
      setIsSaving(userId);
      await updateDoc(doc(db, 'usuarios', userId), { senha: '0000' });
      setIsSaving(null);
      alert("Senha resetada com sucesso.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Excluir este acesso permanentemente?")) {
      await deleteDoc(doc(db, 'usuarios', userId));
    }
  };

  const openEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      nome: user.nome || '',
      usuario: user.usuario || '',
      senha: user.senha || '0000',
      dataNascimento: user.dataNascimento || '',
      tipo: user.tipo || 'MORADOR',
      foto: user.foto || '',
      email: user.email || ''
    });
    setIsModalOpen(true);
  };

  const filtered = users.filter(u => 
    u.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.usuario?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roles = [
    { id: 'SINDICO', label: 'Síndico' },
    { id: 'SUBSINDICO', label: 'Subsíndico' },
    { id: 'ZELADOR', label: 'Zelador' },
    { id: 'MORADOR', label: 'Morador' },
    { id: 'PRESTADOR', label: 'Prestador' },
    { id: 'OWNER', label: 'Dono/Master' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-emerald-600 gap-5">
      <Loader2 className="animate-spin" size={64} strokeWidth={1.5} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Sincronizando Base de Acessos...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      
      {showToast && (
        <div className="fixed top-24 right-8 z-[300] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border-4 border-emerald-500/20">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="font-black text-xs uppercase tracking-widest">Usuário Sincronizado</p>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Gestão de Identidades</h2>
          <div className="flex items-center gap-2 mt-1">
            <Fingerprint size={12} className="text-emerald-500" />
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Controle Master de Credenciais Amaranthus</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" placeholder="Nome ou login..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>
          <button 
            onClick={() => { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); }}
            className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
          >
            <UserPlus size={18} /> Criar Acesso
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidade</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Login / Cargo</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nascimento</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                        {user.foto ? <img src={user.foto} className="w-full h-full object-cover" /> : <Users className="text-slate-300" size={24} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase leading-none">{user.nome}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase">UID: {user.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-600">@{user.usuario}</span>
                      <span className={`w-fit px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                        user.tipo?.includes('SINDICO') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {user.tipo}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-xs font-bold text-slate-500">
                      {user.dataNascimento ? new Date(user.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleResetPassword(user.id)} title="Resetar Senha" className="p-2.5 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-xl transition-all">
                        <RotateCcw size={16} />
                      </button>
                      <button onClick={() => openEdit(user)} title="Editar" className="p-2.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} title="Excluir" className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro Expandido */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl">
                  {editingId ? <Edit2 size={24} /> : <UserPlus size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{editingId ? 'Editar Perfil' : 'Novo Perfil Amaranthus'}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Cadastro de Identidade no Sistema</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all"><X size={28} /></button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex flex-col md:flex-row gap-10 items-start">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-emerald-500 transition-all">
                      {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" size={32} />}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-xl shadow-xl group-hover:bg-emerald-600 transition-all">
                      <ImageIcon size={16} />
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Foto de Perfil</p>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-emerald-500" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="date" value={formData.dataNascimento} onChange={e => setFormData({...formData, dataNascimento: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Role</label>
                      <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none">
                        {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login de Acesso</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required placeholder="ex: joao.amar" value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value.toLowerCase()})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail para Notificações</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="email" placeholder="ex: joao@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </div>

              {!editingId && (
                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
                  <RotateCcw className="text-amber-500 shrink-0" size={24} />
                  <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
                    A senha inicial padrão para novos cadastros é <span className="text-amber-900 font-black">0000</span>. O usuário será forçado a trocar por uma senha definitiva no primeiro login.
                  </p>
                </div>
              )}
            </form>

            <div className="p-8 border-t border-slate-100 shrink-0 bg-slate-50/50 flex gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 border-2 border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Descartar</button>
              <button onClick={handleSave} className="flex-[2] py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl flex items-center justify-center gap-4">
                {isSaving === 'saving' ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Confirmar e Ativar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagementView;

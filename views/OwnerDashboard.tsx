
import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  Package, 
  Zap, 
  Plus, 
  Search, 
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Save,
  ShieldCheck,
  AlertTriangle,
  LayoutDashboard,
  DollarSign,
  Wrench,
  CalendarCheck,
  Wind,
  MessageSquare,
  Globe
} from 'lucide-react';
// Fix: Removed missing ClientConfig from imports
import { ModuleType } from '../types';

const OwnerDashboard: React.FC = () => {
  // Estado Real dos Clientes
  const [clients, setClients] = useState<any[]>([
    { 
      id: 'c1', 
      name: 'Administradora Silva LTDA', 
      condos: 4, 
      maxCondos: 5, 
      activeModules: [ModuleType.DASHBOARD, ModuleType.RESIDENTS, ModuleType.SAUNA], 
      status: 'Ativo', 
      plan: 'Professional',
      mrr: 450.00,
      createdAt: '2023-01-15'
    },
    { 
      id: 'c2', 
      name: 'Gestão Total Rio', 
      condos: 12, 
      maxCondos: 15, 
      activeModules: Object.values(ModuleType), 
      status: 'Ativo', 
      plan: 'Enterprise',
      mrr: 1200.00,
      createdAt: '2023-05-20'
    }
  ]);

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);

  // Form State
  const initialForm = {
    name: '',
    plan: 'Basic',
    maxCondos: 1,
    activeModules: [ModuleType.DASHBOARD] as ModuleType[],
    mrr: 0
  };
  const [formData, setFormData] = useState(initialForm);

  const handleOpenForm = (client?: any) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        plan: client.plan,
        maxCondos: client.maxCondos,
        activeModules: client.activeModules,
        mrr: client.mrr
      });
    } else {
      setEditingClient(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...formData } : c));
    } else {
      const newClient = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        condos: 0,
        status: 'Ativo',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setClients([newClient, ...clients]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (clientToDelete) {
      setClients(clients.filter(c => c.id !== clientToDelete.id));
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  const toggleModule = (mod: ModuleType) => {
    setFormData(prev => ({
      ...prev,
      activeModules: prev.activeModules.includes(mod)
        ? prev.activeModules.filter(m => m !== mod)
        : [...prev.activeModules, mod]
    }));
  };

  const totalMRR = clients.reduce((acc, c) => acc + c.mrr, 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Globe size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                <Zap size={24} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Faturamento MRR</span>
            </div>
            <h3 className="text-3xl font-black">R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <p className="text-slate-400 text-sm mt-1 font-medium">Recorrência Mensal Ativa</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Building2 size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Licenças de Condos</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800">
            {clients.reduce((acc, c) => acc + c.condos, 0)} / {clients.reduce((acc, c) => acc + c.maxCondos, 0)}
          </h3>
          <p className="text-slate-500 text-sm mt-1 font-medium">Uso total da capacidade vendida</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <ShieldCheck size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Clientes</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{clients.length}</h3>
          <p className="text-slate-500 text-sm mt-1 font-medium">Administradoras na plataforma</p>
        </div>
      </div>

      {/* Client Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Gestão de Licenciamento</h3>
            <p className="text-sm text-slate-500 font-medium">Crie instâncias e controle o que cada administrador pode acessar.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar cliente ou plano..." 
                className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-80 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-emerald-100 transition-all active:scale-95 shrink-0"
            >
              <Plus size={20} />
              Criar Novo Cliente
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano & Valor</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Condomínios</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Módulos Ativos</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-lg">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">{client.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Desde {client.createdAt}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        client.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : 
                        client.plan === 'Professional' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {client.plan}
                      </span>
                      <p className="font-black text-slate-800 text-sm">R$ {client.mrr.toFixed(2)}/mês</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-full max-w-[140px]">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>{client.condos} / {client.maxCondos}</span>
                        <span>{Math.round((client.condos/client.maxCondos) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            (client.condos/client.maxCondos) > 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${(client.condos/client.maxCondos) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex -space-x-2">
                      {client.activeModules.slice(0, 4).map((m: any, i: number) => (
                        <div key={i} title={m} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-slate-400 shadow-sm">
                          <LayoutDashboard size={14} />
                        </div>
                      ))}
                      {client.activeModules.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-50 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                          +{client.activeModules.length - 4}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenForm(client)}
                        className="p-3 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => { setClientToDelete(client); setIsDeleteModalOpen(true); }}
                        className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-900 text-white rounded-2xl">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">
                    {editingClient ? 'Configurar Licença' : 'Novo Cliente'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gestão de Licenciamento SaaS</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl text-slate-500"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Administradora</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Condomínios do Futuro"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Faturamento Mensal (R$)</label>
                  <input 
                    type="number" 
                    value={formData.mrr}
                    onChange={(e) => setFormData({...formData, mrr: parseFloat(e.target.value)})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plano Base</label>
                  <select 
                    value={formData.plan}
                    onChange={(e) => setFormData({...formData, plan: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="Basic">Basic (Até 5 condos)</option>
                    <option value="Professional">Professional (Até 20 condos)</option>
                    <option value="Enterprise">Enterprise (Ilimitado)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limite de Condomínios</label>
                  <input 
                    type="number" 
                    value={formData.maxCondos}
                    onChange={(e) => setFormData({...formData, maxCondos: parseInt(e.target.value)})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Módulos do Contrato</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.values(ModuleType).map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => toggleModule(mod)}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all gap-2 ${
                        formData.activeModules.includes(mod)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                        : 'border-slate-100 text-slate-400 grayscale hover:grayscale-0'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-tighter text-center">{mod}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 border-2 border-slate-100 rounded-3xl text-slate-500 font-black hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-2 px-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                >
                  <Save size={20} />
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && clientToDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 p-10 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Suspender Cliente?</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Você está prestes a desativar a instância de <span className="font-bold text-slate-800">{clientToDelete.name}</span>. Eles perderão acesso a todos os módulos imediatamente.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-slate-500 font-black"
              >
                Voltar
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-100"
              >
                Sim, Suspender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;

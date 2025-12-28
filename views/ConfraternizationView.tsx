
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  GlassWater, 
  Users, 
  CheckCircle2, 
  XCircle, 
  DollarSign,
  Download,
  Calendar,
  MoreVertical,
  Building2,
  Trash2,
  Edit2,
  History,
  X
} from 'lucide-react';
import { Resident, Confraternization } from '../types';

interface Props {
  residents: Resident[];
}

const ConfraternizationView: React.FC<Props> = ({ residents }) => {
  const [registros, setRegistros] = useState<Confraternization[]>([
    { id: '1', morador: 'Alice Oliveira', apto: '101A', adultos: 2, criancas7a12: 1, criancasMenor6: 1, total: 200, status: 'pago' },
    { id: '2', morador: 'Bruno Santos', apto: '402B', adultos: 3, criancas7a12: 0, criancasMenor6: 0, total: 240, status: 'pendente' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    moradorId: '',
    adultos: 0,
    criancas7a12: 0,
    criancasMenor6: 0,
    status: 'pendente' as any
  });

  const totalPago = registros.filter(r => r.status === 'pago').reduce((acc, r) => acc + r.total, 0);
  const totalParticipantes = registros.reduce((acc, r) => acc + r.adultos + r.criancas7a12 + r.criancasMenor6, 0);

  const calculateTotal = (adultos: number, criancas: number) => (adultos * 80) + (criancas * 40);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const resident = residents.find(r => r.id === formData.moradorId);
    if (!resident) return;

    const newRegistro: Confraternization = {
      id: Math.random().toString(36).substr(2, 9),
      morador: resident.nome,
      // Fixed: Use 'apto' property instead of 'apartamento'
      apto: resident.apto,
      adultos: formData.adultos,
      criancas7a12: formData.criancas7a12,
      criancasMenor6: formData.criancasMenor6,
      total: calculateTotal(formData.adultos, formData.criancas7a12),
      status: formData.status
    };

    setRegistros([newRegistro, ...registros]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Confraternização Amaranthus</h2>
          <p className="text-slate-500 font-medium">Controle de inscrições e arrecadação do evento anual.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white text-slate-600 px-6 py-3 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} /> Exportar Word
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all hover:-translate-y-1 active:scale-95"
          >
            <Plus size={20} /> Nova Inscrição
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pessoas</p>
          <h3 className="text-3xl font-black text-slate-800">{totalParticipantes}</h3>
        </div>
        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrecadado</p>
          <h3 className="text-3xl font-black text-slate-800">R$ {totalPago.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <History size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendentes</p>
          <h3 className="text-3xl font-black text-slate-800">{registros.filter(r=>r.status === 'pendente').length}</h3>
        </div>
        <div className="bg-slate-900 p-7 rounded-[2rem] shadow-xl text-white">
          <div className="w-12 h-12 bg-white/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
            <GlassWater size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status do Evento</p>
          <h3 className="text-2xl font-black">Inscrições Abertas</h3>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Morador / Unidade</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Adultos</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Crianças</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registros.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-8 py-6">
                  <div>
                    <span className="font-bold text-slate-800 block">{r.morador}</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Apto {r.apto}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center font-bold text-slate-700">{r.adultos}</td>
                <td className="px-8 py-6 text-center font-bold text-slate-700">{r.criancas7a12 + r.criancasMenor6}</td>
                <td className="px-8 py-6 font-black text-slate-800">R$ {r.total.toFixed(2)}</td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    r.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {r.status === 'pago' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {r.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="flex justify-end gap-2">
                      <button className="p-2.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Inscrição Evento</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Confirmação de Participantes</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl text-slate-500"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecionar Morador</label>
                <select 
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none"
                  value={formData.moradorId}
                  onChange={e => setFormData({...formData, moradorId: e.target.value})}
                >
                  <option value="">Escolha um morador...</option>
                  {residents.map(r => (
                    // Fixed: Use 'apto' property instead of 'apartamento'
                    <option key={r.id} value={r.id}>{r.nome} - {r.apto}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adultos (R$80)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    value={formData.adultos}
                    onChange={e => setFormData({...formData, adultos: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">7 a 12 Anos (R$40)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    value={formData.criancas7a12}
                    onChange={e => setFormData({...formData, criancas7a12: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Até 6 Anos (Grátis)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    value={formData.criancasMenor6}
                    onChange={e => setFormData({...formData, criancasMenor6: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-900 rounded-[2rem] flex justify-between items-center text-white">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total a Pagar</p>
                  <h4 className="text-3xl font-black text-emerald-400">R$ {calculateTotal(formData.adultos, formData.criancas7a12).toFixed(2)}</h4>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold text-slate-400">Status do Pagamento</p>
                   <select 
                    className="bg-transparent text-white font-black text-sm uppercase tracking-widest outline-none cursor-pointer hover:text-emerald-400 transition-colors mt-1"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                   >
                     <option value="pendente" className="bg-slate-800">Pendente</option>
                     <option value="pago" className="bg-slate-800">Confirmado</option>
                   </select>
                </div>
              </div>

              <button className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-[0.98]">
                Finalizar Inscrição
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfraternizationView;

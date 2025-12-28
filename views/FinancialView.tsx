
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Receipt, AlertCircle, Calendar } from 'lucide-react';

const FinancialView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase">Receita Total</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">R$ 124.500,00</p>
          <p className="text-xs text-emerald-600 font-bold mt-2">↑ 12% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase">Despesas</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">R$ 82.300,00</p>
          <p className="text-xs text-red-600 font-bold mt-2">↓ 3% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase">Inadimplência</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">7.2%</p>
          <p className="text-xs text-amber-600 font-bold mt-2">Estável este mês</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Próximos Boletos</h3>
          <button className="text-emerald-600 text-sm font-bold hover:underline">Ver todos</button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Receipt className="text-slate-400" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Cota Condominial - Out/2023</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} /> Vencimento: 10/10/2023
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 text-lg">R$ 550,00</p>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Processado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialView;

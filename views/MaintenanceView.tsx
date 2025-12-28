
import React from 'react';
import { Wrench, Clock, CheckCircle2, AlertTriangle, Plus, BrainCircuit } from 'lucide-react';

const MaintenanceView: React.FC = () => {
  const tasks = [
    { id: 1, title: 'Limpeza das Caixas d\'Água', priority: 'Alta', status: 'Em Andamento', unit: 'Geral', date: '05 Out' },
    { id: 2, title: 'Troca de Lâmpadas - Garagem 2', priority: 'Baixa', status: 'Pendente', unit: 'Infra', date: '08 Out' },
    { id: 3, title: 'Reparo Elevador Social B', priority: 'Alta', status: 'Urgente', unit: 'Elevadores', date: 'Agora' },
    { id: 4, title: 'Revisão Portão Principal', priority: 'Média', status: 'Agendado', unit: 'Segurança', date: '12 Out' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cronograma de Manutenção</h2>
          <p className="text-slate-500">Gerencie ordens de serviço e manutenções preventivas</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
          <Plus size={20} />
          Abrir Chamado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Pendente', 'Em Andamento', 'Concluído', 'Atrasado'].map((status) => (
          <div key={status} className="bg-slate-100/50 p-4 rounded-2xl min-h-[400px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{status}</h3>
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {tasks.filter(t => status === 'Em Andamento' ? t.status === status : true).length}
              </span>
            </div>
            
            <div className="space-y-3">
              {tasks.filter(t => {
                if(status === 'Em Andamento') return t.status === 'Em Andamento';
                if(status === 'Pendente') return t.status === 'Pendente' || t.status === 'Agendado';
                if(status === 'Atrasado') return t.status === 'Urgente';
                return false;
              }).map((task) => (
                <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group hover:border-emerald-500 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      task.priority === 'Alta' ? 'bg-red-50 text-red-600' : 
                      task.priority === 'Média' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{task.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{task.title}</h4>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Wrench size={12} />
                      {task.unit}
                    </div>
                    {task.status === 'Urgente' && (
                      <div className="flex items-center gap-1 text-red-600 animate-pulse">
                        <AlertTriangle size={14} />
                        <span className="text-[10px] font-bold">CRÍTICO</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaintenanceView;

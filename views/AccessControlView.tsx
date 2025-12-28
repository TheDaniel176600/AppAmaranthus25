
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  Info, 
  Save, 
  UserCheck, 
  AlertTriangle, 
  X, 
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Database
} from 'lucide-react';
import { UserRole, ModuleType, ActionType } from '../types';
import { db, doc, setDoc, onSnapshot } from '../services/firebaseConfig';

const AccessControlView: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ZELADOR);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estado inicial padrão para garantir que o app não quebre enquanto carrega
  const [permissions, setPermissions] = useState<any>({
    [UserRole.ZELADOR]: {},
    [UserRole.MORADOR]: {},
    [UserRole.PRESTADOR]: {}
  });

  // CARREGAMENTO REAL DO FIRESTORE
  useEffect(() => {
    setLoading(true);
    const docRef = doc(db, 'configuracoes', 'matriz_permissoes');
    
    // Escuta mudanças em tempo real para que a UI esteja sempre atualizada
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setPermissions(docSnap.data());
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar permissões:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const togglePermission = (module: ModuleType, action: ActionType) => {
    // Síndico e Subsíndico são perfis mestres e não podem ser alterados para evitar bloqueio total do sistema
    if (selectedRole === UserRole.SINDICO || selectedRole === UserRole.SUBSINDICO || selectedRole === UserRole.OWNER) return;

    setPermissions((prev: any) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [module]: {
          ...prev[selectedRole]?.[module] || { view: false, create: false, edit: false, delete: false },
          [action]: !prev[selectedRole]?.[module]?.[action]
        }
      }
    }));
  };

  // SALVAMENTO REAL NO FIRESTORE
  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'configuracoes', 'matriz_permissoes');
      
      // Gravando o objeto completo de permissões no Firestore
      await setDoc(docRef, permissions);
      
      setIsSaving(false);
      setShowSaveConfirm(false);
      setShowSuccessToast(true);
      
      // Esconde o toast após 3 segundos
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar no Firestore:", error);
      alert("Erro crítico ao salvar as configurações. Verifique sua conexão.");
      setIsSaving(false);
    }
  };

  const roles = [
    { id: UserRole.SINDICO, label: 'Síndico', desc: 'Acesso total e irrestrito' },
    { id: UserRole.SUBSINDICO, label: 'Subsíndico', desc: 'Acesso total administrativo' },
    { id: UserRole.ZELADOR, label: 'Zelador', desc: 'Foco operacional e manutenção' },
    { id: UserRole.MORADOR, label: 'Morador', desc: 'Acesso a áreas comuns e reservas' },
    { id: UserRole.PRESTADOR, label: 'Prestador', desc: 'Acesso a chamados técnicos' },
  ];

  const currentRoleLabel = roles.find(r => r.id === selectedRole)?.label;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-emerald-600 gap-5">
        <Loader2 className="animate-spin" size={64} strokeWidth={1.5} />
        <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Sincronizando Matriz de Segurança...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      
      {/* Toast de Sucesso */}
      {showSuccessToast && (
        <div className="fixed top-24 right-8 z-[300] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-emerald-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border-4 border-emerald-500/20">
            <CheckCircle2 size={24} />
            <div>
              <p className="font-black text-xs uppercase tracking-widest">Gravado no Banco de Dados</p>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight">As novas regras de {currentRoleLabel} já estão ativas.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Segurança & Acessos</h2>
          <div className="flex items-center gap-2 mt-1">
            <Database size={12} className="text-emerald-500" />
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Conexão Ativa com Firestore Amaranthus</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSaveConfirm(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl active:scale-95 group"
        >
          <Save size={18} className="group-hover:rotate-12 transition-transform" /> 
          Salvar Configurações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Lista de Cargos */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-4">Selecione o Perfil</h3>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`w-full p-6 rounded-[2rem] text-left transition-all border ${
                selectedRole === role.id 
                ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200 translate-x-2' 
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-sm uppercase tracking-tight">{role.label}</span>
                {selectedRole === role.id ? <Unlock size={14} className="text-emerald-400" /> : <Lock size={14} className="opacity-20" />}
              </div>
              <p className={`text-[9px] font-bold uppercase tracking-wider leading-relaxed ${selectedRole === role.id ? 'text-slate-400' : 'text-slate-400'}`}>
                {role.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Matriz de Permissões */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <ShieldCheck className="text-emerald-600" size={24} />
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Definição de Escopo: {currentRoleLabel}</h4>
              </div>
              {(selectedRole === UserRole.SINDICO || selectedRole === UserRole.SUBSINDICO || selectedRole === UserRole.OWNER) && (
                <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase border border-emerald-200">
                  Perfil Mestre • Editável
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo do Sistema</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Visualizar</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Criar</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Editar</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Excluir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.values(ModuleType).filter(m => m !== ModuleType.ACCESS_CONTROL).map((mod) => {
                    const isGod = selectedRole === UserRole.SINDICO || selectedRole === UserRole.SUBSINDICO || selectedRole === UserRole.OWNER;
                    const perms = permissions[selectedRole]?.[mod] || { view: false, create: false, edit: false, delete: false };

                    return (
                      <tr key={mod} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{mod}</span>
                        </td>
                        {(['view', 'create', 'edit', 'delete'] as ActionType[]).map((action) => (
                          <td key={action} className="px-8 py-6 text-center">
                            <button
                              disabled={isGod}
                              onClick={() => togglePermission(mod, action)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto ${
                                isGod || perms[action]
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                                  : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {action === 'view' && <Eye size={16} />}
                              {action === 'create' && <Plus size={16} />}
                              {action === 'edit' && <Edit3 size={16} />}
                              {action === 'delete' && <Trash2 size={16} />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
            <AlertTriangle className="text-amber-500 shrink-0" size={24} />
            <div>
              <p className="text-[10px] text-amber-900 leading-relaxed font-black uppercase tracking-wider">Atenção Crítica</p>
              <p className="text-[9px] text-amber-700 uppercase font-bold mt-1 leading-relaxed">
                As alterações feitas agora são permanentes e gravadas diretamente no banco de dados. Qualquer erro aqui pode restringir o acesso de moradores ou funcionários imediatamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Salvamento */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-center">
            <div className="p-10 border-b border-slate-50 bg-slate-50/50">
              <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-amber-50">
                <ShieldAlert size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3">Persistir Mudanças?</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed px-6">
                Você está gravando a nova política de segurança para o perfil <span className="text-slate-900">[{currentRoleLabel}]</span> no banco de dados.
              </p>
            </div>
            
            <div className="p-10 space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                    Diferente de antes, esta ação agora é **REAL** e imediata. Os dados serão transmitidos para os servidores da nuvem Amaranthus.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  disabled={isSaving}
                  onClick={handleFinalSave}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Gravando no DB...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} /> Confirmar e Gravar Agora
                    </>
                  )}
                </button>
                <button 
                  disabled={isSaving}
                  onClick={() => setShowSaveConfirm(false)}
                  className="w-full py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  Cancelar e Revisar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessControlView;

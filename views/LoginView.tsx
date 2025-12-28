
import React, { useState } from 'react';
import { ShieldCheck, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { db, collection, query, where, getDocs } from '../services/firebaseConfig';

interface LoginProps {
  onLoginSuccess: (userData: any) => void;
}

const LoginView: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('usuario', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Usuário não encontrado.');
        setLoading(false);
        return;
      }

      let userFound = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.senha === password) {
          userFound = { id: doc.id, ...data };
        }
      });

      if (userFound) {
        onLoginSuccess(userFound);
      } else {
        setError('Senha incorreta.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar ao banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-10 pt-12 text-center">
          <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-3xl mb-6 shadow-lg shadow-emerald-100/50">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Amaranthus Gestão</h2>
          <p className="text-slate-500 font-medium mt-2">Acesse o painel administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="p-10 pt-0 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold text-center border border-red-100 animate-bounce">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Usuário</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                placeholder="Seu usuário"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Entrar no Sistema'}
          </button>
        </form>
        
        <div className="p-8 bg-slate-50 text-center border-t border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest">
          Amaranthus Exclusive © 2024
        </div>
      </div>
    </div>
  );
};

export default LoginView;

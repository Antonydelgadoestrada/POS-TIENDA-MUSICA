import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wallet, Plus, Minus, Lock, Unlock, History, X } from 'lucide-react';

const fmt = n => `S/ ${Number(n||0).toFixed(2)}`;

function OpenCashModal({ onClose }) {
  const { dispatch, toast, state } = useApp();
  const [amount, setAmount] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 0) return;
    dispatch({ type:'OPEN_CASH_REGISTER', payload: { initialAmount: parseFloat(amount), userId: state.currentUser.id, userName: state.currentUser.name } });
    toast('Caja abierta correctamente', 'success');
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2"><Unlock size={18} className="text-emerald-400"/>Apertura de caja</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-white"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Monto inicial ($) *</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="200.00" required autoFocus
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="bg-slate-900 rounded-xl px-4 py-3 text-sm text-slate-400 space-y-1">
            <p>Responsable: <strong className="text-white">{state.currentUser?.name}</strong></p>
            <p>Fecha/Hora: <strong className="text-white">{new Date().toLocaleString('es-PE')}</strong></p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold transition-all">Abrir Caja</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CloseCashModal({ cr, balance, onClose }) {
  const { dispatch, toast, state } = useApp();
  const [realBalance, setRealBalance] = useState('');
  const [notes, setNotes] = useState('');
  const real = parseFloat(realBalance) || 0;
  const diff = real - balance;
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type:'CLOSE_CASH_REGISTER', payload: { userId: state.currentUser.id, userName: state.currentUser.name, realBalance: real, notes } });
    toast('Caja cerrada y registrada', 'success');
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2"><Lock size={18} className="text-red-400"/>Cierre de caja</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-white"/></button>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Saldo inicial</span><span className="text-white font-semibold">{fmt(cr.initialAmount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Total ingresos</span><span className="text-emerald-400 font-semibold">{fmt(cr.movements.filter(m=>m.type==='INGRESO').reduce((s,m)=>s+m.amount,0))}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Total egresos</span><span className="text-red-400 font-semibold">{fmt(cr.movements.filter(m=>m.type==='EGRESO').reduce((s,m)=>s+m.amount,0))}</span></div>
          <div className="flex justify-between border-t border-slate-700 pt-2 mt-1"><span className="text-white font-bold">Saldo teórico</span><span className="text-violet-400 font-bold text-lg">{fmt(balance)}</span></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Saldo real contado ($) *</label>
            <input type="number" min="0" step="0.01" value={realBalance} onChange={e => setRealBalance(e.target.value)} required
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-base font-bold focus:outline-none focus:border-violet-500" />
          </div>
          {realBalance && (
            <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold flex justify-between ${diff >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
              <span>{diff >= 0 ? 'Sobrante' : 'Faltante'}</span>
              <span>{diff >= 0 ? '+' : ''}{fmt(diff)}</span>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Observaciones</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notas del cierre..."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-bold transition-all">Confirmar Cierre</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MovementModal({ type, onClose }) {
  const { dispatch, toast, state } = useApp();
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type:'CASH_MOVEMENT', payload: { type, concept, amount: parseFloat(amount), description, userId: state.currentUser.id, userName: state.currentUser.name } });
    toast(`${type === 'INGRESO' ? 'Ingreso' : 'Egreso'} registrado`, 'success');
    onClose();
  };
  const color = type === 'INGRESO' ? 'emerald' : 'red';
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">{type === 'INGRESO' ? 'Ingreso a caja' : 'Egreso de caja'}</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-white"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Concepto *</label>
            <input value={concept} onChange={e => setConcept(e.target.value)} required placeholder="Ej: Pago de servicios"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Monto ($) *</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00"
              className={`w-full bg-slate-900 border text-white rounded-xl px-3 py-2.5 text-base font-bold focus:outline-none ${color==='emerald'?'border-emerald-500/50':'border-red-500/50'}`} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cancelar</button>
            <button type="submit" className={`flex-1 text-white py-2.5 rounded-xl font-bold transition-all ${color==='emerald'?'bg-emerald-600 hover:bg-emerald-500':'bg-red-600 hover:bg-red-500'}`}>Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CashRegister() {
  const { state, cashBalance, hasPermission } = useApp();
  const { currentCashRegister, cashHistory, currentUser } = state;
  const canOpen  = hasPermission('open_cash');
  const canClose = hasPermission('close_cash');
  const canMove  = hasPermission('cash_movements');

  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showMovement, setShowMovement] = useState(null);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Status banner */}
      <div className={`rounded-2xl p-4 sm:p-5 border flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 ${
        currentCashRegister
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentCashRegister ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            <Wallet size={24} className={currentCashRegister ? 'text-emerald-400' : 'text-red-400'} />
          </div>
          <div>
            <p className={`font-bold text-lg ${currentCashRegister ? 'text-emerald-400' : 'text-red-400'}`}>
              {currentCashRegister ? '● Caja abierta' : '● Caja cerrada'}
            </p>
            {currentCashRegister ? (
              <p className="text-slate-400 text-sm">Abierta por {currentCashRegister.openedByName} · {new Date(currentCashRegister.openedAt).toLocaleString('es-PE')}</p>
            ) : (
              <p className="text-slate-400 text-sm">No hay caja activa</p>
            )}
          </div>
        </div>
        <div className="text-right">
          {currentCashRegister && <p className="text-3xl font-bold text-white">{fmt(cashBalance)}</p>}
          {currentCashRegister
            ? canClose && <button onClick={() => setShowClose(true)} className="mt-2 flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <Lock size={14}/> Cerrar caja
              </button>
            : canOpen && <button onClick={() => setShowOpen(true)} className="mt-2 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <Unlock size={14}/> Abrir caja
              </button>
          }
        </div>
      </div>

      {currentCashRegister && (
        <>
          {/* Quick actions */}
          {canMove && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowMovement('INGRESO')}
                className="flex items-center gap-3 bg-slate-800 hover:bg-emerald-600/10 border border-slate-700 hover:border-emerald-500/50 rounded-2xl p-4 transition-all group">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Plus size={20} className="text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">Ingreso a caja</p>
                  <p className="text-slate-500 text-xs">Registrar entrada de efectivo</p>
                </div>
              </button>
              <button onClick={() => setShowMovement('EGRESO')}
                className="flex items-center gap-3 bg-slate-800 hover:bg-red-600/10 border border-slate-700 hover:border-red-500/50 rounded-2xl p-4 transition-all group">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Minus size={20} className="text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">Egreso de caja</p>
                  <p className="text-slate-500 text-xs">Registrar salida de efectivo</p>
                </div>
              </button>
            </div>
          )}

          {/* Movements table */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="text-white font-bold">Movimientos de caja</h3>
              <p className="text-slate-400 text-xs mt-0.5">{currentCashRegister.movements.length} movimientos registrados</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50">
                  <tr className="text-slate-400 text-xs uppercase tracking-wide">
                    {['Hora','Tipo','Concepto','Descripción','Usuario','Monto'].map(h => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {[...currentCashRegister.movements].reverse().map(m => (
                    <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.type==='INGRESO'?'bg-emerald-500/20 text-emerald-400':'bg-red-500/20 text-red-400'}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white text-xs">{m.concept}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{m.description}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{m.userName}</td>
                      <td className={`px-4 py-3 font-bold whitespace-nowrap ${m.type==='INGRESO'?'text-emerald-400':'text-red-400'}`}>
                        {m.type==='INGRESO'?'+':'-'}{fmt(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-700 flex justify-end">
              <span className="text-white font-bold">Saldo actual: <span className="text-violet-400">{fmt(cashBalance)}</span></span>
            </div>
          </div>
        </>
      )}

      {/* History */}
      {cashHistory.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <h3 className="text-white font-bold">Historial de cierres</h3>
          </div>
          <div className="divide-y divide-slate-700/50">
            {[...cashHistory].reverse().map(cr => (
              <div key={cr.id} className="px-5 py-4 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {new Date(cr.openedAt).toLocaleDateString('es-PE')} — Cerrado {new Date(cr.closedAt).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">Abierto por {cr.openedByName} · Cerrado por {cr.closedByName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{fmt(cr.theoreticalBalance)}</p>
                    <p className={`text-xs font-semibold ${cr.difference >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {cr.difference >= 0 ? '+' : ''}{fmt(cr.difference)} diferencia
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showOpen && <OpenCashModal onClose={() => setShowOpen(false)} />}
      {showClose && <CloseCashModal cr={currentCashRegister} balance={cashBalance} onClose={() => setShowClose(false)} />}
      {showMovement && <MovementModal type={showMovement} onClose={() => setShowMovement(null)} />}
    </div>
  );
}

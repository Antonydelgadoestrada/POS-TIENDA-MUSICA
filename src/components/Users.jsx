import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PERMISSIONS, PERMISSION_GROUPS, ROLE_TEMPLATES } from '../data/permissions';
import {
  Plus, Edit2, Trash2, X, Check, Shield, ChevronDown, ChevronUp,
  Users as UsersIcon, Lock, Unlock,
} from 'lucide-react';

const ROLES = ['ADMIN','CAJERO','AUXILIAR'];
const ROLE_COLORS = {
  ADMIN:    'bg-violet-600/20 text-violet-400 border-violet-500/30',
  CAJERO:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  AUXILIAR: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};
const ROLE_BADGE_DOT = { ADMIN:'bg-violet-500', CAJERO:'bg-amber-500', AUXILIAR:'bg-emerald-500' };

// ── Editor de permisos ────────────────────────────────────────────────────────
function PermissionEditor({ permissions, onChange }) {
  const [openGroups, setOpenGroups] = useState(
    Object.fromEntries(PERMISSION_GROUPS.map(g => [g, true]))
  );

  const toggleGroup = (g) => setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));
  const toggle = (key) => {
    const next = permissions.includes(key)
      ? permissions.filter(p => p !== key)
      : [...permissions, key];
    onChange(next);
  };
  const toggleAll = (keys, grant) => {
    if (grant) {
      const next = [...new Set([...permissions, ...keys])];
      onChange(next);
    } else {
      onChange(permissions.filter(p => !keys.includes(p)));
    }
  };

  const groupPermissions = (group) =>
    Object.entries(PERMISSIONS).filter(([, v]) => v.group === group);

  return (
    <div className="space-y-2">
      {/* Plantillas rápidas */}
      <div className="flex items-center gap-2 flex-wrap pb-1">
        <span className="text-slate-500 text-xs font-medium">Plantilla:</span>
        {ROLES.map(role => (
          <button key={role} type="button"
            onClick={() => onChange([...ROLE_TEMPLATES[role]])}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${ROLE_COLORS[role]} hover:opacity-80`}>
            {role}
          </button>
        ))}
        <button type="button" onClick={() => onChange([])}
          className="px-3 py-1 rounded-lg text-xs font-semibold border border-red-500/30 bg-red-500/10 text-red-400 hover:opacity-80 transition-all">
          Sin acceso
        </button>
      </div>

      {/* Resumen */}
      <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
        <span className="font-semibold text-white">{permissions.length}</span>
        <span>de {Object.keys(PERMISSIONS).length} permisos activos</span>
        {/* mini barra de progreso */}
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${(permissions.length / Object.keys(PERMISSIONS).length) * 100}%` }} />
        </div>
      </div>

      {/* Grupos */}
      {PERMISSION_GROUPS.map(group => {
        const items = groupPermissions(group);
        const keys = items.map(([k]) => k);
        const allGranted = keys.every(k => permissions.includes(k));
        const someGranted = keys.some(k => permissions.includes(k));
        const isOpen = openGroups[group];

        return (
          <div key={group} className="border border-slate-700 rounded-xl overflow-hidden">
            {/* Cabecera del grupo */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60">
              <button type="button" onClick={() => toggleGroup(group)}
                className="flex items-center gap-2 flex-1 text-left">
                <span className="text-white text-xs font-semibold">{group}</span>
                <span className="text-slate-600 text-xs">({keys.filter(k => permissions.includes(k)).length}/{keys.length})</span>
                {isOpen ? <ChevronUp size={13} className="text-slate-500 ml-auto"/> : <ChevronDown size={13} className="text-slate-500 ml-auto"/>}
              </button>
              {/* Toggle todos del grupo */}
              <button type="button"
                onClick={() => toggleAll(keys, !allGranted)}
                className={`ml-3 shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  allGranted
                    ? 'bg-violet-500/20 text-violet-400 border-violet-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-violet-500/20 hover:text-violet-400 hover:border-violet-500/30'
                }`}>
                {allGranted ? <><X size={10}/> Quitar todos</> : <><Check size={10}/> Dar todos</>}
              </button>
            </div>

            {/* Permisos individuales */}
            {isOpen && (
              <div className="divide-y divide-slate-800">
                {items.map(([key, meta]) => {
                  const granted = permissions.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => toggle(key)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                        granted ? 'bg-violet-500/5 hover:bg-violet-500/10' : 'hover:bg-slate-800/60'
                      }`}>
                      {/* Checkbox visual */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        granted ? 'bg-violet-500 border-violet-500' : 'border-slate-600'
                      }`}>
                        {granted && <Check size={11} className="text-white"/>}
                      </div>
                      <span className={`text-xs flex-1 ${granted ? 'text-white' : 'text-slate-400'}`}>
                        {meta.label}
                      </span>
                      {/* Indicador de permiso */}
                      {granted
                        ? <span className="text-[10px] text-violet-400 font-medium shrink-0">● Activo</span>
                        : <span className="text-[10px] text-slate-600 shrink-0">○ Denegado</span>
                      }
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Modal de usuario ──────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const initialPerms = user?.permissions ?? ROLE_TEMPLATES[user?.role ?? 'CAJERO'] ?? [];
  const [form, setForm] = useState({
    name: user?.name ?? '',
    username: user?.username ?? '',
    password: '',
    role: user?.role ?? 'CAJERO',
    active: user?.active ?? true,
    permissions: [...initialPerms],
  });
  const [showPerms, setShowPerms] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRoleChange = (role) => {
    set('role', role);
    // Pregunta si resetear permisos
    setForm(f => ({ ...f, role }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl animate-slide-up max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700 shrink-0">
          <h3 className="text-white font-bold text-lg">{user ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* Datos básicos */}
          <div className="p-5 space-y-4 border-b border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre completo *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Juan Pérez"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Usuario *</label>
                <input value={form.username} onChange={e => set('username', e.target.value)} required placeholder="juanperez"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Contraseña {user && <span className="text-slate-600">(dejar vacío para mantener)</span>}
                </label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                  required={!user} placeholder={user ? '••••••••' : 'Contraseña'}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Estado</label>
                <button type="button" onClick={() => set('active', !form.active)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                  {form.active ? <><Unlock size={14}/> Activo</> : <><Lock size={14}/> Inactivo</>}
                </button>
              </div>
            </div>

            {/* Rol base */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Rol base</label>
              <div className="flex gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => handleRoleChange(r)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${form.role === r ? ROLE_COLORS[r] : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-slate-600 text-xs mt-1.5">El rol es solo informativo — los permisos reales son los de abajo</p>
            </div>
          </div>

          {/* Permisos */}
          <div className="p-5">
            <button type="button" onClick={() => setShowPerms(!showPerms)}
              className="w-full flex items-center justify-between py-3 px-4 bg-slate-900 hover:bg-slate-700/50 rounded-xl border border-slate-700 transition-all mb-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-violet-400"/>
                <span className="text-white font-semibold text-sm">Permisos de acceso</span>
                <span className="bg-violet-500/20 text-violet-400 text-xs px-2 py-0.5 rounded-full font-medium">
                  {form.permissions.length} activos
                </span>
              </div>
              {showPerms ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
            </button>

            {showPerms && (
              <PermissionEditor
                permissions={form.permissions}
                onChange={(perms) => set('permissions', perms)}
              />
            )}
          </div>

          <div className="flex gap-3 p-5 pt-0">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold transition-all">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Panel de detalle de permisos (solo lectura) ───────────────────────────────
function PermissionsPanel({ user, onClose }) {
  const groupedPerms = PERMISSION_GROUPS.map(group => ({
    group,
    items: Object.entries(PERMISSIONS).filter(([, v]) => v.group === group),
  }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${user.role === 'ADMIN' ? 'bg-violet-600' : user.role === 'CAJERO' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-white font-bold">{user.name}</p>
              <p className="text-slate-400 text-xs">{user.username} · {user.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-slate-400 text-xs">
            <span className="text-white font-bold">{(user.permissions ?? []).length}</span> de {Object.keys(PERMISSIONS).length} permisos activos
          </p>
          {groupedPerms.map(({ group, items }) => {
            const active = items.filter(([k]) => (user.permissions ?? []).includes(k));
            if (active.length === 0) return null;
            return (
              <div key={group} className="bg-slate-900 rounded-xl p-3">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">{group}</p>
                <div className="space-y-1.5">
                  {active.map(([k, meta]) => (
                    <div key={k} className="flex items-center gap-2">
                      <Check size={12} className="text-violet-400 shrink-0"/>
                      <span className="text-white text-xs">{meta.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {/* Permisos denegados */}
          {(() => {
            const denied = Object.entries(PERMISSIONS).filter(([k]) => !(user.permissions ?? []).includes(k));
            if (denied.length === 0) return null;
            return (
              <div className="bg-slate-900/50 rounded-xl p-3 border border-red-500/10">
                <p className="text-red-400/60 text-xs font-semibold uppercase tracking-wide mb-2">Sin acceso</p>
                <div className="space-y-1">
                  {denied.map(([k, meta]) => (
                    <div key={k} className="flex items-center gap-2 opacity-50">
                      <X size={11} className="text-red-400 shrink-0"/>
                      <span className="text-slate-500 text-xs">{meta.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Users() {
  const { state, dispatch, toast } = useApp();
  const { users, currentUser } = state;
  const [modalCreate, setModalCreate] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);
  const [panelPerms, setPanelPerms] = useState(null);

  const handleSave = (form) => {
    if (modalEdit) {
      const updated = { ...form, id: modalEdit.id };
      if (!form.password) updated.password = modalEdit.password;
      dispatch({ type: 'UPDATE_USER', payload: updated });
      toast('Usuario actualizado', 'success');
      setModalEdit(null);
    } else {
      dispatch({ type: 'ADD_USER', payload: form });
      toast('Usuario creado', 'success');
      setModalCreate(false);
    }
  };

  const handleDelete = (user) => {
    if (user.id === currentUser.id) { toast('No puedes eliminar tu propio usuario', 'error'); return; }
    dispatch({ type: 'DELETE_USER', payload: user.id });
    toast('Usuario eliminado', 'warning');
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
            <UsersIcon size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Gestión de Usuarios</h2>
            <p className="text-slate-400 text-sm">{users.length} usuarios — permisos individuales por usuario</p>
          </div>
        </div>
        <button onClick={() => setModalCreate(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
          <Plus size={15}/> Nuevo usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-900/50">
            <tr className="text-slate-400 text-xs uppercase tracking-wide">
              {['Usuario','Nombre','Rol','Permisos','Estado','Creado','Acciones'].map(h => (
                <th key={h} className="text-left px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {users.map(user => {
              const permCount = (user.permissions ?? []).length;
              const total = Object.keys(PERMISSIONS).length;
              const pct = Math.round((permCount / total) * 100);
              return (
                <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${user.role==='ADMIN'?'bg-violet-600':user.role==='CAJERO'?'bg-amber-500':'bg-emerald-500'}`}>
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-mono text-violet-400 text-xs">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-white font-medium">{user.name}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[user.role]}`}>{user.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => setPanelPerms(user)} className="group text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }}/>
                        </div>
                        <span className="text-slate-400 text-xs group-hover:text-violet-400 transition-colors">
                          {permCount}/{total}
                        </span>
                      </div>
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{new Date(user.createdAt).toLocaleDateString('es-PE')}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setModalEdit(user)}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-violet-600 text-slate-400 hover:text-white transition-all" title="Editar permisos">
                        <Shield size={13}/>
                      </button>
                      <button onClick={() => setModalEdit(user)}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-violet-600/40 text-slate-400 hover:text-white transition-all" title="Editar">
                        <Edit2 size={13}/>
                      </button>
                      {user.id !== currentUser.id && (
                        <button onClick={() => handleDelete(user)}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600/40 text-slate-400 hover:text-red-400 transition-all" title="Eliminar">
                          <Trash2 size={13}/>
                        </button>
                      )}
                      {user.id === currentUser.id && <span className="text-slate-600 text-xs px-2">(tú)</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modals */}
      {modalCreate && <UserModal onClose={() => setModalCreate(false)} onSave={handleSave} />}
      {modalEdit   && <UserModal user={modalEdit} onClose={() => setModalEdit(null)} onSave={handleSave} />}
      {panelPerms  && <PermissionsPanel user={panelPerms} onClose={() => setPanelPerms(null)} />}
    </div>
  );
}

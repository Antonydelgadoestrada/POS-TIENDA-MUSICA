import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { fmt, fmtShort } from '../lib/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  DollarSign, ShoppingBag, TrendingUp, AlertTriangle,
  Wallet, Package, ArrowUpRight,
} from 'lucide-react';

const COLORS = ['#7c3aed','#f59e0b','#10b981','#3b82f6','#ef4444'];

function KPICard({ title, value, sub, icon: Icon, color = 'violet', trend }) {
  const colorMap = {
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    amber:  'text-amber-400  bg-amber-500/10  border-amber-500/20',
    green:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red:    'text-red-400    bg-red-500/10    border-red-500/20',
    blue:   'text-blue-400   bg-blue-500/10   border-blue-500/20',
  };
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-start gap-4 hover:border-slate-600 transition-all">
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{title}</p>
        <p className="text-white text-2xl font-bold mt-1 truncate">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
      {trend != null && (
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          <ArrowUpRight size={13} className={trend < 0 ? 'rotate-180' : ''} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}


export default function Dashboard() {
  const { state, todaySales, lowStockProducts, cashBalance } = useApp();
  const { sales, prevSales, companyConfig, currentCashRegister, products } = state;

  // today's stats
  const todayTotal = useMemo(() => todaySales.reduce((s, v) => s + v.total, 0), [todaySales]);
  const todayCount  = todaySales.length;

  // best-selling today
  const bestProduct = useMemo(() => {
    const counts = {};
    todaySales.forEach(s => s.items.forEach(i => { counts[i.name] = (counts[i.name]||0) + i.qty; }));
    const best = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
    return best ? `${best[0]} (×${best[1]})` : '—';
  }, [todaySales]);

  // month total
  const monthTotal = useMemo(() => {
    const now = new Date();
    return sales
      .filter(s => { const d = new Date(s.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, v) => s + v.total, 0);
  }, [sales]);

  // Pre-index prevSales + real sales by date string — O(1) lookup instead of O(n) find per day
  const salesByDate = useMemo(() => {
    const map = new Map();
    prevSales.forEach(s => map.set(new Date(s.date).toDateString(), s.total));
    // Real sales also contribute to the map
    sales.forEach(s => {
      const key = new Date(s.createdAt).toDateString();
      if (s.status !== 'ANULADA') map.set(key, (map.get(key) || 0) + s.total);
    });
    return map;
  }, [prevSales, sales]);

  const chartData7 = useMemo(() => {
    const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i));
      const total = salesByDate.get(d.toDateString()) ?? 0;
      return { name: dayNames[d.getDay()], total: parseFloat(total.toFixed(2)) };
    });
  }, [salesByDate]);

  const paymentData = useMemo(() => {
    const map = {};
    todaySales.forEach(s => s.payments.forEach(p => { map[p.method] = (map[p.method]||0) + p.amount; }));
    return Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  }, [todaySales]);

  const trendData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 15 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (14 - i));
      const total = salesByDate.get(d.toDateString()) ?? 0;
      return { name: `${d.getDate()}/${d.getMonth()+1}`, total: parseFloat(total.toFixed(2)) };
    });
  }, [salesByDate]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-white font-bold">{fmt(payload[0].value)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-white text-lg sm:text-xl font-bold">Dashboard</h2>
          <p className="text-slate-400 text-xs sm:text-sm truncate">{new Date().toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-medium border ${
          currentCashRegister ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
        }`}>
          {currentCashRegister ? '● Caja abierta' : '● Caja cerrada'}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KPICard title="Ventas del día" value={fmt(todayTotal)} sub={`${todayCount} transacciones`} icon={DollarSign} color="violet" trend={12} />
        <KPICard title="Transacciones"  value={todayCount}      sub="ventas realizadas hoy"           icon={ShoppingBag} color="blue" />
        <KPICard title="Mejor producto" value={bestProduct}     sub="más vendido hoy"                 icon={TrendingUp} color="green" />
        <KPICard title="Stock bajo"     value={lowStockProducts.length} sub="productos en alerta"     icon={AlertTriangle} color={lowStockProducts.length > 0 ? 'amber' : 'green'} />
        <KPICard title="Saldo en caja"  value={fmt(cashBalance)} sub={currentCashRegister ? `Abierta por ${currentCashRegister.openedByName}` : 'Caja cerrada'} icon={Wallet} color="green" />
        <KPICard title="Ventas del mes" value={fmtShort(monthTotal)} sub="mes actual acumulado" icon={Package} color="violet" trend={8} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar - 7 days */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-5">
          <h3 className="text-white font-semibold mb-4">Ventas últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData7} barSize={32}>
              <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `S/${v}`} tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" fill="#7c3aed" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie - payment methods */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Métodos de pago (hoy)</h3>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:8 }} itemStyle={{ color:'#f1f5f9' }} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize:12, color:'#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Sin ventas hoy</div>
          )}
        </div>
      </div>

      {/* Line - monthly trend */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Tendencia mensual</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={trendData}>
            <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `S/${v}`} tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent sales table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Últimas ventas del día</h3>
        {todaySales.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No hay ventas registradas hoy</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700 text-xs uppercase tracking-wide">
                  <th className="text-left pb-3">N° Venta</th>
                  <th className="text-left pb-3">Hora</th>
                  <th className="text-left pb-3">Cajero</th>
                  <th className="text-left pb-3">Productos</th>
                  <th className="text-left pb-3">Método</th>
                  <th className="text-right pb-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[...todaySales].reverse().slice(0,10).map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 font-mono text-violet-400 font-semibold">{sale.id}</td>
                    <td className="py-3 text-slate-300">{new Date(sale.createdAt).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' })}</td>
                    <td className="py-3 text-slate-300">{sale.userName}</td>
                    <td className="py-3 text-slate-400 text-xs max-w-[200px] truncate">{sale.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
                    <td className="py-3"><span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md text-xs">{sale.paymentSummary}</span></td>
                    <td className="py-3 text-right font-semibold text-emerald-400">{fmt(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

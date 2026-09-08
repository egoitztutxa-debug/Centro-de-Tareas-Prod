"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { Plus, Trash2, Search, Clock3, CheckCircle2, CircleDot, AlertTriangle, X } from "lucide-react";

// ---- paleta / tokens ----------------------------------------------------
const INK = "#1F2A33";
const INK_SOFT = "#5B6670";
const PAPER = "#EFEEE9";
const PAPER_RAISED = "#F7F6F2";
const RULE = "#CFC8B8";
const RULE_SOFT = "#DFDACD";
const BRASS = "#A9793F";
const BRASS_SOFT = "#E4D2B4";
const GREEN = "#4C7A5D";
const GREEN_SOFT = "#D9E6DC";
const RUST = "#B0532F";
const RUST_SOFT = "#F0DCCF";
const SLATE = "#5C6F80";
const SLATE_SOFT = "#DCE3E8";

const STORAGE_KEY = "centro-tareas:tasks";

const PRIORITY_META = {
  alta: { label: "Alta", color: RUST, soft: RUST_SOFT },
  media: { label: "Media", color: BRASS, soft: BRASS_SOFT },
  baja: { label: "Baja", color: SLATE, soft: SLATE_SOFT },
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayISO = () => new Date().toISOString().slice(0, 10);

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function isOverdue(task) {
  if (task.status !== "pendiente" || !task.dueDate) return false;
  return task.dueDate < todayISO();
}

// ---- almacenamiento: localStorage del navegador --------------------------
// (En el artifact original de Claude se usaba window.storage; aquí usamos
// localStorage porque la app corre en un navegador normal, sin backend.)
const storage = {
  get(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? { value: raw } : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return { key, value };
    } catch {
      return null;
    }
  },
};

// ---- datos de ejemplo (solo si no hay nada guardado) --------------------
const SEED = [
  { id: uid(), title: "Configurar reglas de acumulación de horas extra", client: "Iberdrola", priority: "alta", status: "pendiente", dueDate: todayISO(), completedDate: null, notes: "Revisar tabla de valoración de tiempo", createdAt: Date.now() - 86400000 * 6 },
  { id: uid(), title: "Migrar perfiles de tiempo a Employee Central Time Off", client: "Repsol", priority: "media", status: "pendiente", dueDate: null, completedDate: null, notes: "", createdAt: Date.now() - 86400000 * 4 },
  { id: uid(), title: "Corregir cálculo de festivos regionales", client: "Iberdrola", priority: "alta", status: "completada", dueDate: null, completedDate: todayISO(), notes: "", createdAt: Date.now() - 86400000 * 9 },
  { id: uid(), title: "Documentar workflow de aprobación de partes", client: "Mapfre", priority: "baja", status: "completada", dueDate: null, completedDate: todayISO(), notes: "", createdAt: Date.now() - 86400000 * 3 },
];

export default function TaskCenter() {
  const [tasks, setTasks] = useState(null); // null = cargando
  const [tab, setTab] = useState("pendiente"); // pendiente | completada | todas | resumen
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  // formulario nueva tarea
  const [fTitle, setFTitle] = useState("");
  const [fClient, setFClient] = useState("");
  const [fPriority, setFPriority] = useState("media");
  const [fDue, setFDue] = useState("");
  const [fNotes, setFNotes] = useState("");

  // ---- carga inicial (solo en cliente) ----
  useEffect(() => {
    try {
      const res = storage.get(STORAGE_KEY);
      const parsed = res ? JSON.parse(res.value) : SEED;
      setTasks(parsed);
    } catch {
      setTasks(SEED);
    }
  }, []);

  // ---- guardado ----
  const persist = useCallback((next) => {
    setTasks(next);
    try {
      const result = storage.set(STORAGE_KEY, JSON.stringify(next));
      if (!result) setError("No se pudo guardar. Tus cambios podrían no persistir.");
      else setError("");
    } catch {
      setError("No se pudo guardar. Tus cambios podrían no persistir.");
    }
  }, []);

  const addTask = () => {
    if (!fTitle.trim()) return;
    const t = {
      id: uid(),
      title: fTitle.trim(),
      client: fClient.trim() || "Sin cliente",
      priority: fPriority,
      status: "pendiente",
      dueDate: fDue || null,
      completedDate: null,
      notes: fNotes.trim(),
      createdAt: Date.now(),
    };
    persist([t, ...tasks]);
    setFTitle(""); setFClient(""); setFPriority("media"); setFDue(""); setFNotes("");
    setShowForm(false);
  };

  const toggleStatus = (id) => {
    const next = tasks.map((t) => {
      if (t.id !== id) return t;
      const completing = t.status === "pendiente";
      return {
        ...t,
        status: completing ? "completada" : "pendiente",
        completedDate: completing ? todayISO() : null,
      };
    });
    persist(next);
  };

  const removeTask = (id) => persist(tasks.filter((t) => t.id !== id));

  // ---- derivados ----
  const clients = useMemo(() => {
    if (!tasks) return [];
    return Array.from(new Set(tasks.map((t) => t.client))).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (tab !== "resumen" && tab !== "todas" && t.status !== tab) return false;
      if (clientFilter !== "todos" && t.client !== clientFilter) return false;
      if (priorityFilter !== "todas" && t.priority !== priorityFilter) return false;
      if (query.trim() && !(`${t.title} ${t.client} ${t.notes}`.toLowerCase().includes(query.trim().toLowerCase()))) return false;
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, tab, clientFilter, priorityFilter, query]);

  const stats = useMemo(() => {
    if (!tasks) return { pending: 0, done: 0, overdue: 0 };
    return {
      pending: tasks.filter((t) => t.status === "pendiente").length,
      done: tasks.filter((t) => t.status === "completada").length,
      overdue: tasks.filter(isOverdue).length,
    };
  }, [tasks]);

  const byClientData = useMemo(() => {
    if (!tasks) return [];
    const map = {};
    tasks.forEach((t) => {
      map[t.client] = map[t.client] || { client: t.client, Pendientes: 0, Completadas: 0 };
      if (t.status === "pendiente") map[t.client].Pendientes += 1;
      else map[t.client].Completadas += 1;
    });
    return Object.values(map).sort((a, b) => (b.Pendientes + b.Completadas) - (a.Pendientes + a.Completadas));
  }, [tasks]);

  const byPriorityData = useMemo(() => {
    if (!tasks) return [];
    const pend = tasks.filter((t) => t.status === "pendiente");
    return ["alta", "media", "baja"].map((p) => ({
      name: PRIORITY_META[p].label,
      value: pend.filter((t) => t.priority === p).length,
      color: PRIORITY_META[p].color,
    }));
  }, [tasks]);

  const trendData = useMemo(() => {
    if (!tasks) return [];
    const days = 14;
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const count = tasks.filter((t) => t.completedDate === iso).length;
      out.push({ day: d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }), completadas: count });
    }
    return out;
  }, [tasks]);

  if (tasks === null) {
    return (
      <div style={{ background: PAPER, color: INK }} className="w-full min-h-screen flex items-center justify-center font-sans">
        <p style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm">cargando tareas…</p>
      </div>
    );
  }

  const TABS = [
    { key: "pendiente", label: "Pendientes", count: stats.pending },
    { key: "completada", label: "Completadas", count: stats.done },
    { key: "todas", label: "Todas", count: tasks.length },
    { key: "resumen", label: "Resumen", count: null },
  ];

  return (
    <div style={{ background: PAPER, color: INK, fontFamily: "'Source Serif 4', Georgia, serif" }} className="w-full min-h-screen p-0">
      <style>{`
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .task-row:hover { background: ${PAPER_RAISED}; }
        .btn-primary { background: ${INK}; color: ${PAPER}; }
        .btn-primary:hover { background: #0f171d; }
        select, input, textarea { font-family: inherit; }
        ::placeholder { color: ${INK_SOFT}; opacity: 0.6; }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* cabecera */}
        <div className="flex items-start justify-between gap-6 pb-6" style={{ borderBottom: `2px solid ${INK}` }}>
          <div>
            <p className="mono text-xs tracking-wide" style={{ color: INK_SOFT }}>SuccessFactors · Time Tracking</p>
            <h1 className="text-3xl font-semibold mt-1" style={{ letterSpacing: "-0.01em" }}>Centro de tareas</h1>
          </div>
          <div className="flex gap-3">
            <StampNumber value={stats.pending} label="pendientes" color={INK} />
            <StampNumber value={stats.done} label="completadas" color={GREEN} />
            <StampNumber value={stats.overdue} label="vencidas" color={RUST} />
          </div>
        </div>

        {error && (
          <div className="mt-4 px-3 py-2 text-sm rounded" style={{ background: RUST_SOFT, color: RUST }}>
            {error}
          </div>
        )}

        {/* tabs */}
        <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
          <div className="flex gap-1">
            {TABS.map((tItem) => (
              <button
                key={tItem.key}
                onClick={() => setTab(tItem.key)}
                className="px-3 py-1.5 text-sm mono rounded-t"
                style={{
                  background: tab === tItem.key ? PAPER_RAISED : "transparent",
                  color: tab === tItem.key ? INK : INK_SOFT,
                  borderBottom: tab === tItem.key ? `2px solid ${INK}` : "2px solid transparent",
                }}
              >
                {tItem.label}{tItem.count !== null ? ` (${tItem.count})` : ""}
              </button>
            ))}
          </div>
          {tab !== "resumen" && (
            <button
              onClick={() => setShowForm((s) => !s)}
              className="btn-primary flex items-center gap-1.5 text-sm px-3 py-1.5 rounded"
            >
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? "Cerrar" : "Nueva tarea"}
            </button>
          )}
        </div>

        {/* formulario nueva tarea */}
        {showForm && tab !== "resumen" && (
          <div className="mt-4 p-4 rounded" style={{ background: PAPER_RAISED, border: `1px solid ${RULE}` }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={fTitle}
                onChange={(e) => setFTitle(e.target.value)}
                placeholder="Título de la tarea"
                className="px-3 py-2 rounded text-sm sm:col-span-2"
                style={{ border: `1px solid ${RULE}`, background: "white" }}
              />
              <input
                value={fClient}
                onChange={(e) => setFClient(e.target.value)}
                placeholder="Cliente / proyecto"
                className="px-3 py-2 rounded text-sm"
                style={{ border: `1px solid ${RULE}`, background: "white" }}
              />
              <select
                value={fPriority}
                onChange={(e) => setFPriority(e.target.value)}
                className="px-3 py-2 rounded text-sm"
                style={{ border: `1px solid ${RULE}`, background: "white" }}
              >
                <option value="alta">Prioridad alta</option>
                <option value="media">Prioridad media</option>
                <option value="baja">Prioridad baja</option>
              </select>
              <input
                type="date"
                value={fDue}
                onChange={(e) => setFDue(e.target.value)}
                className="px-3 py-2 rounded text-sm"
                style={{ border: `1px solid ${RULE}`, background: "white" }}
              />
              <input
                value={fNotes}
                onChange={(e) => setFNotes(e.target.value)}
                placeholder="Notas (opcional)"
                className="px-3 py-2 rounded text-sm"
                style={{ border: `1px solid ${RULE}`, background: "white" }}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={addTask} className="btn-primary text-sm px-4 py-2 rounded">Guardar tarea</button>
            </div>
          </div>
        )}

        {/* filtros */}
        {tab !== "resumen" && (
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ border: `1px solid ${RULE}`, background: "white" }}>
              <Search size={14} style={{ color: INK_SOFT }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar…"
                className="text-sm outline-none"
                style={{ background: "transparent", width: "160px" }}
              />
            </div>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="text-sm px-2 py-1.5 rounded"
              style={{ border: `1px solid ${RULE}`, background: "white" }}
            >
              <option value="todos">Todos los clientes</option>
              {clients.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-sm px-2 py-1.5 rounded"
              style={{ border: `1px solid ${RULE}`, background: "white" }}
            >
              <option value="todas">Toda prioridad</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        )}

        {/* lista de tareas */}
        {tab !== "resumen" && (
          <div className="mt-4" style={{ borderTop: `1px solid ${RULE_SOFT}` }}>
            {filtered.length === 0 && (
              <div className="py-10 text-center" style={{ color: INK_SOFT }}>
                <p className="text-sm">No hay tareas que coincidan. Añade una nueva o ajusta los filtros.</p>
              </div>
            )}
            {filtered.map((t) => {
              const meta = PRIORITY_META[t.priority];
              const overdue = isOverdue(t);
              return (
                <div
                  key={t.id}
                  className="task-row flex items-start gap-3 py-3 px-2 rounded"
                  style={{ borderBottom: `1px solid ${RULE_SOFT}` }}
                >
                  <button onClick={() => toggleStatus(t.id)} className="mt-0.5" title={t.status === "pendiente" ? "Marcar como completada" : "Reabrir tarea"}>
                    {t.status === "completada"
                      ? <CheckCircle2 size={18} style={{ color: GREEN }} />
                      : <CircleDot size={18} style={{ color: INK_SOFT }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm"
                      style={{ textDecoration: t.status === "completada" ? "line-through" : "none", color: t.status === "completada" ? INK_SOFT : INK }}
                    >
                      {t.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="mono text-xs px-1.5 py-0.5 rounded" style={{ background: SLATE_SOFT, color: SLATE }}>{t.client}</span>
                      <span className="mono text-xs px-1.5 py-0.5 rounded" style={{ background: meta.soft, color: meta.color }}>{meta.label}</span>
                      {t.dueDate && (
                        <span className="mono text-xs flex items-center gap-1" style={{ color: overdue ? RUST : INK_SOFT }}>
                          {overdue && <AlertTriangle size={11} />}
                          <Clock3 size={11} /> {fmtDate(t.dueDate)}
                        </span>
                      )}
                      {t.completedDate && (
                        <span className="mono text-xs" style={{ color: GREEN }}>cerrada {fmtDate(t.completedDate)}</span>
                      )}
                    </div>
                    {t.notes && <p className="text-xs mt-1" style={{ color: INK_SOFT }}>{t.notes}</p>}
                  </div>
                  <button onClick={() => removeTask(t.id)} title="Eliminar" style={{ color: INK_SOFT }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* resumen / gráficos */}
        {tab === "resumen" && (
          <div className="mt-6 space-y-10">
            {tasks.length === 0 ? (
              <p className="text-sm" style={{ color: INK_SOFT }}>Añade tareas para ver el resumen.</p>
            ) : (
              <>
                <ChartBlock title="Carga por cliente">
                  <ResponsiveContainer width="100%" height={Math.max(180, byClientData.length * 46)}>
                    <BarChart data={byClientData} layout="vertical" margin={{ left: 12, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={RULE_SOFT} horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: INK_SOFT }} />
                      <YAxis dataKey="client" type="category" width={110} tick={{ fontSize: 12, fill: INK }} />
                      <Tooltip contentStyle={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Pendientes" stackId="a" fill={BRASS} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Completadas" stackId="a" fill={GREEN} radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartBlock>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <ChartBlock title="Pendientes por prioridad">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={byPriorityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                          {byPriorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartBlock>

                  <ChartBlock title="Cierres — últimos 14 días">
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={RULE_SOFT} />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: INK_SOFT }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: INK_SOFT }} width={24} />
                        <Tooltip contentStyle={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }} />
                        <Line type="monotone" dataKey="completadas" stroke={GREEN} strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartBlock>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StampNumber({ value, label, color }) {
  return (
    <div className="text-center px-3 py-1.5 rounded" style={{ border: `1px solid ${color}`, minWidth: 76 }}>
      <p className="mono text-xl font-semibold" style={{ color }}>{value}</p>
      <p className="text-[10px] mt-0.5" style={{ color: INK_SOFT }}>{label}</p>
    </div>
  );
}

function ChartBlock({ title, children }) {
  return (
    <div>
      <h3 className="text-sm mb-3" style={{ color: INK_SOFT }}>{title}</h3>
      {children}
    </div>
  );
}

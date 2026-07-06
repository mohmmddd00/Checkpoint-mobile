// src/components/HallOfFamePage.tsx
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import "../styles/fadeUpAnimation.css";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { DashboardLayout } from "./DashboardLayout";
import { ChartModal } from "./ChartModal";
import { routes } from "../../../server/src/routes/routes";

const API_URL = import.meta.env.VITE_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────
interface RAWGGame {
  id: number;
  name: string;
  slug: string;
  metacritic: number | null;
  rating: number;
  ratings_count: number;
  added: number;
  released: string | null;
  background_image: string | null;
  genres: { id: number; name: string }[];
}

interface RAWGGenre  { id: number; name: string; games_count: number; }
interface RAWGPlatform { id: number; name: string; games_count: number; }

interface HallData {
  topMeta:  RAWGGame[];
  popular:  RAWGGame[];
  thisYear: RAWGGame[];
  genres:   RAWGGenre[];
  platforms: RAWGPlatform[];
  fanFaves: RAWGGame[];
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const MONO = ["#9E1B32","#8A1729","#761320","#621018","#4E0D12"];
function rankColor(i: number) { return MONO[Math.min(i, MONO.length - 1)]; }

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function DarkTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const title = label ?? payload[0]?.name;
  const val   = payload[0]?.value;
  return (
    <div style={{ background:"rgba(22,4,8,0.97)", border:"1px solid #380B14",
      borderRadius:"8px", padding:"8px 12px", pointerEvents:"none" }}>
      <p style={{ color:"#E6A1B0", margin:"0 0 3px", fontSize:"12px" }}>{title}</p>
      <p style={{ color:"#F7F4F5", margin:0, fontWeight:700, fontSize:"13px" }}>
        {typeof val === "number" ? val.toLocaleString() : val}
      </p>
    </div>
  );
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function loadAll(): Promise<HallData> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/hall-of-fame`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Server error: ${res.statusText}`);
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cut = (s: string, n: number) => s.length > n ? s.slice(0, n - 1) + "…" : s;
const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ─── CompactBarChart ─────────────────────────────────────────────────────────
function CompactBar({ data, dataKey }: { data: any[]; dataKey: string }) {
  const rows = data.slice(0, 5).map((d, i) => ({ ...d, _fill: rankColor(i) }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={rows} layout="vertical" margin={{ left:0, right:14, top:2, bottom:2 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" width={112}
          tick={{ fill:"#D4C5C7", fontSize:11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<DarkTip />} cursor={{ fill:"rgba(158,27,50,0.12)" }} />
        <Bar dataKey={dataKey} radius={[0,4,4,0]}>
          {rows.map((r, i) => <Cell key={i} fill={r._fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── CompactRadar ─────────────────────────────────────────────────────────────
function CompactRadar({ data }: { data: { name: string; value: number }[] }) {
  const rows = data.slice(0, 7).map(d => ({ ...d, name: cut(d.name, 11) }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={rows} cx="50%" cy="50%" outerRadius={64}>
        <PolarGrid stroke="#28070F" />
        <PolarAngleAxis dataKey="name" tick={{ fill:"#D4C5C7", fontSize:9 }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        <Radar dataKey="value" stroke="#9E1B32" fill="#9E1B32" fillOpacity={0.35} />
        <Tooltip content={<DarkTip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── FullBar (used inside modals) ─────────────────────────────────────────────
function FullBar({ data, dataKey, xTickFmt }:
  { data: any[]; dataKey: string; xTickFmt?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={310}>
      <BarChart data={data} layout="vertical" margin={{ left:8, right:20, top:4, bottom:4 }}>
        <XAxis type="number" tick={{ fill:"#A28389", fontSize:11 }} axisLine={false} tickLine={false}
          tickFormatter={xTickFmt} />
        <YAxis type="category" dataKey="label" width={148}
          tick={{ fill:"#D4C5C7", fontSize:11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<DarkTip />} cursor={{ fill:"rgba(158,27,50,0.12)" }} />
        <Bar dataKey={dataKey} radius={[0,4,4,0]} fill="#9E1B32" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── RankTable ────────────────────────────────────────────────────────────────
function RankTable({ rows, cols, onRowClick }: {
  rows: Record<string, any>[];
  cols: { key: string; label: string; fmt?: (v: any) => ReactNode }[];
  onRowClick?: (i: number) => void;
}) {
  return (
    <div style={{ overflowX:"auto", marginTop:"20px" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
        <thead>
          <tr style={{ borderBottom:"1px solid #28070F" }}>
            <th style={{ padding:"8px 12px", color:"#A28389", textAlign:"left", fontWeight:600 }}>#</th>
            {cols.map(c => (
              <th key={c.key} style={{ padding:"8px 12px", color:"#A28389", textAlign: c.key === "fullName" ? "left" : "center", fontWeight:600 }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              onClick={() => onRowClick?.(i)}
              style={{ borderBottom:"1px solid #160408", cursor: onRowClick ? "pointer" : "default", transition:"background 0.15s" }}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = "rgba(158,27,50,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <td style={{ padding:"10px 12px", color: i < 3 ? MONO[i] : "#A28389", fontWeight:700 }}>{i + 1}</td>
              {cols.map(c => (
                <td key={c.key} style={{ padding:"10px 12px", color:"#D4C5C7", textAlign: c.key === "fullName" ? "left" : "center" }}>
                  {c.fmt ? c.fmt(row[c.key]) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ChartCard ────────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, onClick, isLoading, children }: {
  title: string; subtitle: string;
  onClick: () => void; isLoading: boolean; children: ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "linear-gradient(135deg,#200610 0%,#160408 100%)"
                        : "linear-gradient(135deg,#180509 0%,#0D0204 100%)",
        border: `1px solid ${hov ? "rgba(158,27,50,0.65)" : "#28070F"}`,
        borderRadius:"14px",
        padding:"20px",
        cursor:"pointer",
        transition:"all 0.22s ease",
        boxShadow: hov ? "0 8px 32px rgba(158,27,50,0.22)" : "0 2px 10px rgba(0,0,0,0.3)",
        transform: hov ? "translateY(-3px)" : "none",
        position:"relative",
        overflow:"hidden",
      }}
    >
      {hov && (
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:"2px",
          background:"linear-gradient(90deg,transparent,#9E1B32,transparent)",
        }} />
      )}

      <h3 style={{ margin:"0 0 3px", color:"#FFFFFF", fontSize:"13px", fontWeight:700, letterSpacing:"0.3px" }}>{title}</h3>
      <p style={{ margin:"0 0 12px", color:"#A28389", fontSize:"11px" }}>{subtitle}</p>
      <div style={{ height:"1px", background:"linear-gradient(90deg,#9E1B32,transparent)", marginBottom:"14px" }} />

      {isLoading ? (
        <div style={{ height:"180px", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ color:"#5C1222", fontSize:"12px", letterSpacing:"1px" }}>LOADING…</span>
        </div>
      ) : children}

      <div style={{ marginTop:"10px", textAlign:"right" }}>
        <span style={{ color: hov ? "#C2434D" : "#5C1222", fontSize:"11px", fontWeight:600,
          letterSpacing:"0.5px", transition:"color 0.2s" }}>
          EXPAND ↗
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function HallOfFamePage() {
  const navigate = useNavigate();
  const [data,    setData]    = useState<HallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [modal,   setModal]   = useState<string | null>(null);

  useEffect(() => {
    loadAll().then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

//   const yr = new Date().getFullYear();

  // ── derived chart data ──
  const metaRows = (data?.topMeta ?? []).map(g => ({
    label: cut(g.name, 22), fullName: g.name, slug: g.slug,
    metacritic: g.metacritic ?? 0, rating: g.rating,
    year: g.released?.slice(0, 4) ?? "–",
  }));

  const popRows = (data?.popular ?? []).map(g => ({
    label: cut(g.name, 22), fullName: g.name, slug: g.slug,
    added: g.added, rating: g.rating, year: g.released?.slice(0, 4) ?? "–",
  }));

//   const yrRows = (data?.thisYear ?? []).map(g => ({
//     label: cut(g.name, 22), fullName: g.name, slug: g.slug,
//     metacritic: g.metacritic ?? 0, rating: g.rating,
//   }));

  const fanRows = (data?.fanFaves ?? []).map(g => ({
    label: cut(g.name, 22), fullName: g.name, slug: g.slug,
    rating: parseFloat(g.rating.toFixed(2)), year: g.released?.slice(0, 4) ?? "–",
  }));

  const genreRows = (data?.genres ?? []).map(g => ({ name: g.name, value: g.games_count }));

  const goToGame = (slug: string) => navigate(routes.game(toSlug(slug)));

  return (
    <DashboardLayout>
      <style>{`
        .hof-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr));
          gap: 20px;
        }
        @media (max-width: 540px) {
          .hof-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="fade-up-enter" style={{ maxWidth:"1200px", margin:"0 auto", padding:"clamp(20px,4vw,40px) clamp(16px,4vw,28px) 60px" }}>

        {/* ── Hero ── */}
        <div style={{ textAlign:"left", marginBottom:"32px" }}>
          <h1 style={{
            margin:"0 0 6px",
            fontSize:"clamp(20px,4vw,30px)",
            fontWeight:900,
            letterSpacing:"0.3px",
            color:"#FFFFFF",
          }}>
            Hall Of Fame
          </h1>
          <p style={{ color:"#A28389", fontSize:"clamp(12px,1.8vw,13px)", margin:"0 0 20px 0" }}>
            The greatest games ever made — ranked, charted, celebrated.
          </p>
          <div style={{ borderBottom: "1px solid #28070F", marginBottom: "8px" }} />
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{
            background:"rgba(158,27,50,0.12)", border:"1px solid rgba(158,27,50,0.35)",
            borderRadius:"12px", padding:"16px 20px", marginBottom:"24px", textAlign:"center",
          }}>
            <p style={{ color:"#E6A1B0", margin:0, fontSize:"14px" }}>
              Cannot load charts at the moment. Please try again later.
            </p>
          </div>
        )}

        {/* ── Grid ── */}
        <div className="hof-grid">

          <ChartCard title="Critically Acclaimed" subtitle="Top 10 games by Metacritic score"
            onClick={() => setModal("meta")} isLoading={loading}>
            <CompactBar data={metaRows} dataKey="metacritic" />
          </ChartCard>

          <ChartCard title="Most Popular" subtitle="Games added to the most libraries worldwide"
            onClick={() => setModal("popular")} isLoading={loading}>
            <CompactBar data={popRows} dataKey="added" />
          </ChartCard>

          <ChartCard title="Fan Favorites" subtitle="Highest community-rated games of all time"
            onClick={() => setModal("fan")} isLoading={loading}>
            <CompactBar data={fanRows} dataKey="rating" />
          </ChartCard>

          <ChartCard title="Genre Landscape" subtitle="Games by category — radar view"
            onClick={() => setModal("genres")} isLoading={loading}>
            <CompactRadar data={genreRows} />
          </ChartCard>

        </div>

        </div>

      {/* ════════════ MODALS ════════════ */}

      {/* Critically Acclaimed */}
      <ChartModal isOpen={modal === "meta"} onClose={() => setModal(null)}
        title="Critically Acclaimed" subtitle="Top 10 by Metacritic score — the industry's gold standard">
        <FullBar data={metaRows} dataKey="metacritic" />
        <RankTable
          rows={metaRows}
          cols={[
            { key:"fullName", label:"Game" },
            { key:"metacritic", label:"Metacritic", fmt: v => <strong style={{ color:"#9E1B32" }}>{v}</strong> },
            { key:"rating", label:"User Rating", fmt: v => `${v.toFixed(1)} / 5` },
            { key:"year", label:"Year" },
          ]}
          onRowClick={i => goToGame(metaRows[i]?.slug)}
        />
      </ChartModal>

      {/* Most Popular */}
      <ChartModal isOpen={modal === "popular"} onClose={() => setModal(null)}
        title="Most Popular" subtitle="Games with the highest library adds worldwide">
        <FullBar data={popRows} dataKey="added" xTickFmt={v => `${(v/1000).toFixed(0)}k`} />
        <RankTable
          rows={popRows}
          cols={[
            { key:"fullName", label:"Game" },
            { key:"added", label:"Library Adds", fmt: v => <strong style={{ color:"#9E1B32" }}>{v.toLocaleString()}</strong> },
            { key:"rating", label:"User Rating", fmt: v => `${v.toFixed(1)} / 5` },
            { key:"year", label:"Year" },
          ]}
          onRowClick={i => goToGame(popRows[i]?.slug)}
        />
      </ChartModal>

      {/* Genre Landscape */}
      <ChartModal isOpen={modal === "genres"} onClose={() => setModal(null)}
        title="Genre Landscape" subtitle="Total games available in each top genre">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={genreRows.slice(0, 8)} cx="50%" cy="50%" outerRadius={110}>
            <PolarGrid stroke="#380B14" />
            <PolarAngleAxis dataKey="name" tick={{ fill:"#D4C5C7", fontSize:11 }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="#9E1B32" fill="#9E1B32" fillOpacity={0.3} />
            <Tooltip content={<DarkTip />} />
          </RadarChart>
        </ResponsiveContainer>
        <RankTable
          rows={genreRows.slice(0, 8).map((g, _) => ({ ...g, label: g.name, fullName: g.name }))}
          cols={[
            { key:"fullName", label:"Genre" },
            { key:"value", label:"Total Games", fmt: v => <strong style={{ color:"#9E1B32" }}>{v.toLocaleString()}</strong> },
          ]}
        />
      </ChartModal>

      {/* Fan Favorites */}
      <ChartModal isOpen={modal === "fan"} onClose={() => setModal(null)}
        title="Fan Favorites" subtitle="Highest community user ratings of all time">
        <FullBar data={fanRows} dataKey="rating" xTickFmt={v => v.toFixed(1)} />
        <RankTable
          rows={fanRows}
          cols={[
            { key:"fullName", label:"Game" },
            { key:"rating", label:"User Rating", fmt: v => <strong style={{ color:"#F5C842", whiteSpace:"nowrap" }}>{v} / 5</strong> },
            { key:"year", label:"Year" },
          ]}
          onRowClick={i => goToGame(fanRows[i]?.slug)}
        />
      </ChartModal>

    </DashboardLayout>
  );
}
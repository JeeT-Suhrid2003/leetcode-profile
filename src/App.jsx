import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const SAMPLE = {
  meta: { username: "yourhandle", realName: "Your Name", ranking: 42130, lastUpdated: new Date().toISOString() },
  stats: {
    easy:   { count: 98,  submissions: 142 },
    medium: { count: 143, submissions: 289 },
    hard:   { count: 31,  submissions:  74 },
    total:  { count: 272, submissions: 505 },
  },
  streak: { current: 14, totalActiveDays: 187 },
  calendar: (() => {
    const cal = {};
    const today = new Date();
    for (let i = 60; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (Math.random() > 0.35) cal[d.toISOString().split("T")[0]] = Math.ceil(Math.random() * 6);
    }
    return cal;
  })(),
  recentSolved: [
    { id:"1", title:"Two Sum", slug:"two-sum", lang:"python3", solvedAt: new Date(Date.now()-3600000).toISOString() },
    { id:"2", title:"Longest Substring Without Repeating Characters", slug:"longest-substring-without-repeating-characters", lang:"python3", solvedAt: new Date(Date.now()-86400000).toISOString() },
    { id:"3", title:"Merge Intervals", slug:"merge-intervals", lang:"cpp", solvedAt: new Date(Date.now()-172800000).toISOString() },
    { id:"4", title:"Valid Parentheses", slug:"valid-parentheses", lang:"python3", solvedAt: new Date(Date.now()-259200000).toISOString() },
    { id:"5", title:"Binary Tree Level Order Traversal", slug:"binary-tree-level-order-traversal", lang:"java", solvedAt: new Date(Date.now()-432000000).toISOString() },
  ],
  languageBreakdown: { python3: 12, cpp: 5, java: 2, javascript: 1 },
};

const DIFF_COLORS = { easy: "#22c55e", medium: "#f59e0b", hard: "#ef4444" };
const DIFF_BG_COLORS = { easy: "#22c55e22", medium: "#f59e0b22", hard: "#ef444422" };
const LANG_PALETTE = ["#6366f1","#0ea5e9","#f59e0b","#ec4899","#10b981","#8b5cf6"];

function relative(iso) {
  const diff = Date.now() - new Date(iso);
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#111", border: `1px solid ${accent}33`, borderRadius: 12,
      padding: "1.1rem 1.2rem", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: "#555" }}>{sub}</span>}
    </div>
  );
}

function HeatmapCalendar({ calendar }) {
  const weeks = [];
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(today);
  start.setDate(start.getDate() - 175);
  start.setDate(start.getDate() - start.getDay());
  let d = new Date(start);
  while (d <= today) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const key = d.toISOString().split("T")[0];
      week.push({ date: key, count: calendar[key] || 0, future: d > today });
      d.setDate(d.getDate() + 1);
    }
    weeks.push(week);
  }
  const maxVal = Math.max(...Object.values(calendar), 1);
  function cellColor(count) {
    if (count === 0) return "#1a1a1a";
    const v = Math.min(count / maxVal, 1);
    if (v < 0.33) return "#14532d";
    if (v < 0.66) return "#16a34a";
    return "#22c55e";
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 3, minWidth: "fit-content" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((day) => (
              <div key={day.date} title={`${day.date}: ${day.count}`} style={{
                width: 12, height: 12, borderRadius: 2,
                background: day.future ? "transparent" : cellColor(day.count),
                border: day.future ? "1px solid #1a1a1a" : "none",
              }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:8, justifyContent:"flex-end" }}>
        <span style={{ fontSize:10, color:"#444" }}>Less</span>
        {["#1a1a1a","#14532d","#16a34a","#22c55e"].map(c => (
          <div key={c} style={{ width:10, height:10, borderRadius:2, background:c }} />
        ))}
        <span style={{ fontSize:10, color:"#444" }}>More</span>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(SAMPLE);
  const [expandedId, setExpandedId] = useState(null);
  useEffect(() => {
    const urls = ['/data/stats.json', '/stats.json', '/data.json', './data/stats.json'];
    let cancelled = false;
    (async () => {
      for (const u of urls) {
        try {
          const r = await fetch(u);
          if (!r.ok) continue;
          const j = await r.json();
          if (cancelled) return;
          setData(j);
          return;
        } catch (e) {
          // try next
        }
      }
      // no data found — leave SAMPLE in place
    })();
    return () => { cancelled = true; };
  }, []);

  const { meta, stats, streak, calendar, recentSolved, languageBreakdown } = data;

  const diffPie = [
    { name:"Easy",   value:stats?.easy?.count || 0,   color:DIFF_COLORS.easy },
    { name:"Medium", value:stats?.medium?.count || 0, color:DIFF_COLORS.medium },
    { name:"Hard",   value:stats?.hard?.count || 0,   color:DIFF_COLORS.hard },
  ];
  const langBar = Object.entries(languageBreakdown || {}).sort(([,a],[,b])=>b-a).map(([lang,count])=>({lang,count}));
  const acRate = n => {
    const s = stats?.[n]||{};
    if (!s.submissions) return "—";
    return ((s.count/s.submissions)*100).toFixed(0)+"%";
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#0a0a0a", color:"#e5e5e5",
      fontFamily:"'JetBrains Mono','Fira Code','Consolas',monospace",
      padding:"1.5rem", maxWidth:1100, margin:"0 auto",
    }}>
      <header style={{ marginBottom:"2rem" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#fff", margin:0, letterSpacing:"-0.03em" }}>
            <span style={{ color:"#f59e0b" }}>{"{}"}</span> {meta?.username || "Loading..."}
          </h1>
          <span style={{ fontSize:12, color:"#555" }}>rank #{meta?.ranking?.toLocaleString?.() || "—"}</span>
        </div>
        <p style={{ margin:"4px 0 0", fontSize:11, color:"#444" }}>
          last synced {new Date(meta?.lastUpdated || new Date()).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}
          {" · "}
          <span style={{ color:"#22c55e" }}>● live</span>
        </p>
      </header>

      <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:"1.5rem" }}>
        <StatCard label="Total Solved" value={stats?.total?.count/2 || 0} sub={`${stats?.total?.submissions || 0} attempts`} accent="#f59e0b" />
        <StatCard label="Easy"   value={stats?.easy?.count || 0}   sub={acRate("easy")+" AC"}   accent={DIFF_COLORS.easy} />
        <StatCard label="Medium" value={stats?.medium?.count || 0} sub={acRate("medium")+" AC"} accent={DIFF_COLORS.medium} />
        <StatCard label="Hard"   value={stats?.hard?.count || 0}   sub={acRate("hard")+" AC"}   accent={DIFF_COLORS.hard} />
        <StatCard label="Streak" value={`${streak?.current || 0}d`} sub={`${streak?.totalActiveDays || 0} active days`} accent="#6366f1" />
      </section>

      <section style={{ background:"#111", borderRadius:12, padding:"1.25rem", marginBottom:"1.25rem", border:"1px solid #1f1f1f" }}>
        <h2 style={{ margin:"0 0 1rem", fontSize:11, color:"#555", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
          Activity — last 25 weeks
        </h2>
        <HeatmapCalendar calendar={calendar || {}} />
      </section>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"1.25rem" }}>
        <section style={{ background:"#111", borderRadius:12, padding:"1.25rem", border:"1px solid #1f1f1f" }}>
          <h2 style={{ margin:"0 0 0.75rem", fontSize:11, color:"#555", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
            Difficulty split
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={diffPie} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value">
                {diffPie.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
              </Pie>
              <Tooltip contentStyle={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", justifyContent:"center", gap:16 }}>
            {diffPie.map(d=>(
              <span key={d.name} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#666" }}>
                <span style={{ width:8,height:8,borderRadius:2,background:d.color,display:"inline-block" }}/>
                {d.name} <strong style={{ color:d.color }}>{d.value}</strong>
              </span>
            ))}
          </div>
        </section>

        <section style={{ background:"#111", borderRadius:12, padding:"1.25rem", border:"1px solid #1f1f1f" }}>
          <h2 style={{ margin:"0 0 0.75rem", fontSize:11, color:"#555", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
            Languages
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={langBar} layout="vertical" margin={{ left:0, right:16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={false}/>
              <XAxis type="number" tick={{ fontSize:11, fill:"#444" }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="lang" tick={{ fontSize:11, fill:"#888" }} axisLine={false} tickLine={false} width={70}/>
              <Tooltip contentStyle={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, fontSize:12 }} cursor={{ fill:"#ffffff06" }}/>
              <Bar dataKey="count" radius={[0,4,4,0]}>
                {langBar.map((_,i)=><Cell key={i} fill={LANG_PALETTE[i%LANG_PALETTE.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section style={{ background:"#111", borderRadius:12, padding:"1.25rem", border:"1px solid #1f1f1f" }}>
        <h2 style={{ margin:"0 0 0.75rem", fontSize:11, color:"#555", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
          Recently solved
        </h2>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {(recentSolved || []).map((p,i)=>{
            const diffColor = DIFF_COLORS[p.difficulty?.toLowerCase()] || "#888";
            const diffBg = DIFF_BG_COLORS[p.difficulty?.toLowerCase()] || "#88888822";
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} style={{ border:"1px solid #1f1f1f", borderRadius:8, overflow:"hidden" }}>
                <div style={{ 
                  background:"#0f0f0f", padding:"10px 12px", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  gap:10, fontSize:13
                }} onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                    <span style={{ color:"#444", minWidth:20 }}>{String(i+1).padStart(2,"0")}</span>
                    <a href={p.leetcodeLink} target="_blank" rel="noopener noreferrer"
                      onClick={(e)=>e.stopPropagation()}
                      style={{ color:"#e5e5e5", textDecoration:"none", fontWeight:500, flex:1 }}>
                      {p.title}
                    </a>
                  </div>
                  <span style={{ fontSize:10,padding:"3px 8px",borderRadius:4,background:diffBg,color:diffColor,letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
                    {p.difficulty}
                  </span>
                  <span style={{ fontSize:10,padding:"3px 8px",borderRadius:4,background:"#6366f122",color:"#818cf8",letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
                    {p.lang}
                  </span>
                  <span style={{ color:"#444", fontSize:11, whiteSpace:"nowrap" }}>
                    {relative(p.solvedAt)}
                  </span>
                  <span style={{ color:"#666", fontSize:14 }}>{isExpanded ? "▲" : "▼"}</span>
                </div>
                {isExpanded && (
                  <div style={{ background:"#0a0a0a", padding:"12px", borderTop:"1px solid #1f1f1f", maxHeight:300, overflowY:"auto" }}>
                    {p.tags && p.tags.length > 0 && (
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontSize:10, color:"#666", marginBottom:4 }}>Tags:</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {p.tags.map(tag => (
                            <span key={tag} style={{ fontSize:10, padding:"2px 6px", borderRadius:3, background:"#3f3f3f", color:"#aaa" }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {p.description && (
                      <div style={{ fontSize:11, color:"#aaa", lineHeight:1.5 }}>
                        <div style={{ color:"#666", marginBottom:6, fontSize:9 }}>Problem:</div>
                        <div dangerouslySetInnerHTML={{ __html: p.description.substring(0, 500) }} style={{ color:"#ddd" }} />
                        {p.description.length > 500 && <p style={{ color:"#555", fontSize:10 }}>... <a href={p.leetcodeLink} target="_blank" rel="noopener noreferrer" style={{ color:"#6366f1" }}>view full</a></p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <footer style={{ marginTop:"1.5rem", textAlign:"center", fontSize:10, color:"#2a2a2a" }}>
        auto-synced daily via github actions
      </footer>
    </div>
  );
}
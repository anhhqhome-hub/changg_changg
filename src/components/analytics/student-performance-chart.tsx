"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function StudentPerformanceChart({
  skillData,
  trendData,
  typeData
}: {
  skillData: { skill: string; percent: number }[];
  trendData: { date: string; score: number }[];
  typeData: { questionType: string; percent: number }[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <ChartShell title="Skill radar">
        <RadarChart data={skillData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
          <Radar dataKey="percent" fill="#4F46E5" fillOpacity={0.35} stroke="#4F46E5" />
          <Tooltip />
        </RadarChart>
      </ChartShell>
      <ChartShell title="Score trend">
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#38BDF8" strokeWidth={3} />
        </LineChart>
      </ChartShell>
      <ChartShell title="Question types">
        <BarChart data={typeData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="questionType" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="percent" fill="#FBBF24" />
        </BarChart>
      </ChartShell>
    </div>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

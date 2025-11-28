"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { getStressHistory } from "../actions"; // Імпарт з сервера
import Link from "next/link";
import { ArrowLeft, Filter } from "lucide-react";

type LogEntry = {
  id: string;
  level: number;
  note: string | null;
  tags: string[];
  createdAt: string;
};

export default function StatsPage() {
  const [data, setData] = useState<LogEntry[]>([]);
  const [filteredData, setFilteredData] = useState<LogEntry[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Загрузка дадзеных пры адкрыцці
  useEffect(() => {
    getStressHistory().then((logs) => {
      setData(logs);
      setFilteredData(logs);

      // Збіраем унікальныя тэгі
      const tags = new Set<string>();
      logs.forEach((log) => log.tags.forEach((tag) => tags.add(tag)));
      setAllTags(Array.from(tags));
    });
  }, []);

  // Фільтрацыя
  useEffect(() => {
    if (!selectedTag) {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter((item) => item.tags.includes(selectedTag)));
    }
  }, [selectedTag, data]);

  // Фарматаванне даты для восі X
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getDate()}.${date.getMonth() + 1} ${date.getHours()}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  // Кастамны тултып для графіка
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-bold text-slate-700">
            {formatDate(dataPoint.createdAt)}
          </p>
          <p className="text-lg font-bold" style={{ color: payload[0].stroke }}>
            Узровень: {dataPoint.level}%
          </p>
          {dataPoint.note && (
            <p className="text-sm text-slate-500 mt-2">{dataPoint.note}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {dataPoint.tags.map((t: string) => (
              <span key={t} className="text-xs bg-slate-100 px-1 rounded">
                {t}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Хэдэр */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition font-medium"
          >
            <ArrowLeft size={20} />
            Назад да Стрэсометра
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Дынаміка стрэсу</h1>
        </div>

        {/* Фільтр па тэгах */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter size={18} />
            <span className="font-medium">Фільтр:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                selectedTag === null
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Усе
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  selectedTag === tag
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Графік */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[500px]">
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                {/* Градыент для лініі */}
                <defs>
                  <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.8} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={formatDate}
                  stroke="#94a3b8"
                  minTickGap={30}
                />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />

                {/* Зялёная зона камфорту (фонам) */}
                <ReferenceArea y1={0} y2={30} fill="green" fillOpacity={0.05} />

                {/* Чырвоная зона небяспекі (фонам) */}
                <ReferenceArea y1={80} y2={100} fill="red" fillOpacity={0.05} />

                <Line
                  type="monotone"
                  dataKey="level"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#3b82f6",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              Няма дадзеных для гэтага фільтра
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import React, { useState, useEffect } from "react";
// Імпартуем новую функцыю deleteStressLog
import { Send, History, BarChart3, Trash2 } from "lucide-react";
import Link from "next/link";
// АБНАЎЛЕННЕ: Дадаем deleteStressLog у імпарт
import { saveStressLog, getStressHistory, deleteStressLog } from "./actions";

// Тып павінен супадаць з тым, што вяртае getStressHistory
type StressEntry = {
  id: string;
  level: number;
  note: string | null;
  tags: string[];
  createdAt: string;
};

export default function Home() {
  const [level, setLevel] = useState<number>(50);
  const [note, setNote] = useState<string>("");
  const [history, setHistory] = useState<StressEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Функцыя загрузкі дадзеных з БД
  const fetchData = async () => {
    try {
      const logs = await getStressHistory();
      setHistory(logs.reverse().slice(0, 5));
    } catch (error) {
      console.error("Не ўдалося загрузіць гісторыю", error);
    }
  };

  // Загрузка пры старце
  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  // Функцыя для выдалення запісу
  const handleDelete = async (id: string) => {
    if (!window.confirm("Вы сапраўды жадаеце выдаліць гэты запіс?")) {
      return;
    }

    setLoading(true);
    try {
      await deleteStressLog(id);
      await fetchData(); // Абнаўляем спіс пасля выдалення
    } catch (error) {
      console.error("Памылка пры выдаленні:", error);
      alert("Памылка пры выдаленні запісу! (Праверце кансоль)");
    } finally {
      setLoading(false);
    }
  };

  const getColor = (value: number) => {
    const hue = ((100 - value) * 1.2).toString(10);
    return `hsl(${hue}, 80%, 50%)`;
  };

  const extractTags = (text: string) => {
    const regex = /[@#][\wа-яА-ЯёЁіІўЎ]+/g;
    const matches = text.match(regex);
    return matches ? matches : [];
  };

  const handleSave = async () => {
    setLoading(true);
    const tags = extractTags(note);

    try {
      await saveStressLog(level, note, tags);
      setNote("");
      await fetchData();
    } catch (error) {
      alert("Памылка захавання!");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null; // FIX: Каб пазбегнуць гідратацыі

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Стрэсометр</h1>
        <Link
          href="/stats"
          className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50 transition font-medium"
        >
          <BarChart3 size={20} />
          Графікі
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-12 w-full max-w-4xl items-start justify-center">
        <div className="flex flex-col items-center gap-6 w-full md:w-1/3">
          <div className="relative w-24 h-80 bg-slate-200 rounded-2xl border-4 border-slate-300 overflow-hidden shadow-inner">
            <div
              className="absolute bottom-0 w-full transition-all duration-500 ease-out flex items-center justify-center"
              style={{
                height: `${level}%`,
                backgroundColor: getColor(level),
              }}
            >
              <span className="text-white font-bold text-xl drop-shadow-md">
                {level}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              style={{ writingMode: "vertical-lr", direction: "rtl" }}
            />
          </div>

          <div className="w-full space-y-2">
            <label className="text-sm text-slate-500 font-medium">
              Каментар (тэгі: #праца @шэф)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Што здарылася?"
              className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 shadow-sm text-slate-800 bg-white"
            />
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2 font-semibold shadow-lg disabled:opacity-70"
            >
              <Send size={18} />
              {loading ? "Захаванне..." : "Зафіксаваць"}
            </button>
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТКА: Апошнія запісы */}
        <div className="w-full md:w-2/3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-slate-700">
            <History size={20} />
            <h2 className="text-xl font-bold">Апошнія змены</h2>
          </div>

          {history.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              Запісаў пакуль няма.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition group" // АБНАЎЛЕННЕ: клас group для hover эфектаў
                >
                  <div
                    className="w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getColor(item.level) }}
                  />
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 text-lg">
                        {item.level}%
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleString("be-BY")}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-slate-600 mt-1 whitespace-pre-wrap">
                        {item.note}
                      </p>
                    )}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* КНОПКА ВЫДАЛЕННЯ (ВЕРНУТА) */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={loading}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <div className="mt-4 text-center">
                <Link
                  href="/stats"
                  className="text-blue-600 text-sm hover:underline"
                >
                  Глядзець усю гісторыю →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

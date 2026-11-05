import React, { useState, useEffect } from 'react';
import api from '../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getCalDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

export default function ActivityCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dayActivities, setDayActivities] = useState([]);

  useEffect(() => {
    api.get('/activities').then(r => setActivities(r.data)).catch(() => {});
  }, []);

  const actByDay = {};
  activities.forEach(a => {
    const d = a.created_at?.slice(0,10);
    if (d) {
      if (!actByDay[d]) actByDay[d] = [];
      actByDay[d].push(a);
    }
  });

  const handleDayClick = (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setSelected(dateStr);
    setDayActivities(actByDay[dateStr] || []);
  };

  const days = getCalDays(year, month);

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Activity Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg">←</button>
            <h2 className="text-lg font-semibold text-slate-800">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg">→</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const hasActs = actByDay[dateStr]?.length > 0;
              const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
              const isSelected = dateStr === selected;
              return (
                <button key={i} onClick={() => handleDayClick(day)}
                  className={`relative p-2 rounded-lg text-sm font-medium transition-colors text-center
                    ${isSelected ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                  {day}
                  {hasActs && <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-3">
            {selected ? `Activities on ${selected}` : 'Select a date'}
          </h3>
          {dayActivities.length === 0 ? (
            <p className="text-sm text-slate-400">{selected ? 'No activities on this day.' : 'Click a date to see activities.'}</p>
          ) : (
            <div className="space-y-2">
              {dayActivities.map(a => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                  <div className="font-medium text-slate-800">{a.client_name || a.customer_name}</div>
                  <div className="text-xs text-slate-500">{a.activity_type} · {a.activity_status}</div>
                  {a.sales_notes && <div className="text-xs text-slate-400 mt-1 truncate">{a.sales_notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

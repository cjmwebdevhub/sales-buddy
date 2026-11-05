// ── Activity Calendar ─────────────────────────────────────────────────────────
function ActivityCalendar() {
  const {apiFetch}   = useAuth();
  const today        = new Date();
  const todayStr     = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const [year,setYear]   = useState(today.getFullYear());
  const [month,setMonth] = useState(today.getMonth());
  const [acts,setActs]   = useState([]);
  const [selDay,setSelDay] = useState(null);

  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  useEffect(()=>{ apiFetch('/activities').then(setActs).catch(()=>{}); },[]);

  const byDay = {};
  acts.forEach(a => {
    const d = a.created_at?.slice(0,10);
    if (d) { if (!byDay[d]) byDay[d]=[]; byDay[d].push(a); }
  });

  const getDays = (y,m) => {
    const first = new Date(y,m,1), last = new Date(y,m+1,0), days = [];
    for(let i=0;i<first.getDay();i++) days.push(null);
    for(let d=1;d<=last.getDate();d++) days.push(d);
    return days;
  };
  const days = getDays(year,month);

  const prevMonth = () => { if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); };

  return h('div',{className:'page-stack'},
    h('h1',{className:'page-title'},'Activity Calendar'),
    h('div',{className:'cal-layout'},
      h('div',{className:'card cal-grid-card'},
        h('div',{className:'cal-nav'},
          h('button',{className:'btn btn-secondary cal-nav-btn',onClick:prevMonth},'←'),
          h('h2',{className:'cal-month-label'},MN[month]+' '+year),
          h('button',{className:'btn btn-secondary cal-nav-btn',onClick:nextMonth},'→')
        ),
        h('div',{className:'cal-dow-row'},
          DN.map(d=>h('div',{key:d,className:'cal-dow'},d))
        ),
        h('div',{className:'cal-days-grid'},
          days.map((day,i) => {
            if (!day) return h('div',{key:i});
            const dStr    = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const hasActs = byDay[dStr]?.length>0;
            const isToday = dStr===todayStr;
            const isSel   = dStr===selDay;
            return h('button',{key:i,onClick:()=>setSelDay(dStr),
              className:'cal-day'+(isToday?' cal-today':'')+(isSel?' cal-sel':''),
            },
              day,
              hasActs && h('span',{className:'cal-dot'+(isSel?' cal-dot-sel':'')})
            );
          })
        )
      ),
      h('div',{className:'card cal-detail-card'},
        h('h3',{className:'card-title'},selDay?'Activities on '+selDay:'Select a date'),
        !selDay
          ? h('p',{className:'empty-state'},'Click a date to see activities.')
          : (byDay[selDay]||[]).length===0
            ? h('p',{className:'empty-state'},'No activities on this day.')
            : (byDay[selDay]).map(a=>h('div',{key:a.id,className:'cal-act-item'},
                h('div',{style:{fontWeight:500,color:'#0f172a'}},a.client_name||a.customer_name),
                h('div',{style:{fontSize:'.8125rem',color:'#64748b'}},a.activity_type+' · '+a.activity_status),
                a.sales_notes && h('div',{className:'notes-cell'},a.sales_notes)
              ))
      )
    )
  );
}

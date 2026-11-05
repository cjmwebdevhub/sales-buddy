// ── Daily LR ──────────────────────────────────────────────────────────────────
function DailyLR() {
  const {apiFetch}       = useAuth();
  const MN               = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [data,setData]   = useState([]);
  const [loading,setLoading] = useState(true);
  const [fMonth,setFMonth]   = useState('');
  const [fYear,setFYear]     = useState('');

  useEffect(()=>{
    let p = '';
    if(fMonth) p += `?month=${fMonth}`;
    if(fYear)  p += (p?'&':'?')+`year=${fYear}`;
    apiFetch('/reports/daily-lr'+p).then(setData).catch(console.error).finally(()=>setLoading(false));
  },[fMonth,fYear]);

  const totalLR    = data.reduce((s,d)=>s+(d.total_lr||0),0);
  const totalCount = data.reduce((s,d)=>s+(d.count||0),0);
  const chartData  = [...new Map(
    data.map(d=>[d.disbursal_date,{
      date:d.disbursal_date,
      amount:data.filter(x=>x.disbursal_date===d.disbursal_date).reduce((s,x)=>s+x.total_lr,0)
    }])
  ).values()].slice(0,30);

  return h('div',{className:'page-stack'},
    h('div',null,
      h('h1',{className:'page-title'},'Daily Loan Releases'),
      h('p',{className:'page-sub'},'Disbursement records and analytics')
    ),
    h('div',{className:'stat-grid',style:{maxWidth:'40rem'}},
      h('div',{className:'card stat-card'},
        h('div',{className:'stat-icon'},Icon('banknote',22)),
        h('div',null,
          h('div',{className:'stat-value'},'₱'+(totalLR/1000000).toFixed(2)+'M'),
          h('div',{className:'stat-label'},'Total LR Amount')
        )
      ),
      h('div',{className:'card stat-card'},
        h('div',{className:'stat-icon'},Icon('bar-chart-2',22)),
        h('div',null,
          h('div',{className:'stat-value'},totalCount),
          h('div',{className:'stat-label'},'Total Disbursements')
        )
      )
    ),
    h('div',{className:'filter-bar'},
      h('select',{className:'input',style:{maxWidth:'180px'},value:fMonth,onChange:e=>setFMonth(e.target.value)},
        h('option',{value:''},'All Months'),
        MN.map((m,i)=>h('option',{key:i,value:i+1},m))
      ),
      h('input',{type:'number',className:'input',style:{width:'7rem'},placeholder:'Year',value:fYear,onChange:e=>setFYear(e.target.value)})
    ),
    chartData.length>0 && h('div',{className:'card'},
      h('h2',{className:'card-title'},'Daily LR Trend'),
      h(ResponsiveContainer,{width:'100%',height:200},
        h(BarChart,{data:chartData},
          h(XAxis,{dataKey:'date',tick:{fontSize:10}}),
          h(YAxis,{tickFormatter:v=>`₱${(v/1000).toFixed(0)}k`,width:70}),
          h(Tooltip,{formatter:v=>`₱${Number(v).toLocaleString()}`}),
          h(Bar,{dataKey:'amount',fill:'#4B006E',radius:[4,4,0,0]})
        )
      )
    ),
    h('div',{className:'card tbl-card'},
      h('div',{className:'tbl-wrap'},
        h('table',{className:'tbl'},
          h('thead',null,h('tr',null,['Disbursal Date','Branch','Region','Count','Total LR'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,
            loading
              ? h('tr',null,h('td',{colSpan:5,className:'tbl-empty'},'Loading...'))
              : data.length===0
                ? h('tr',null,h('td',{colSpan:5,className:'tbl-empty'},'No data found'))
                : data.map((d,i)=>h('tr',{key:i},
                    h('td',{className:'mono-cell'},d.disbursal_date),
                    h('td',null,d.branch_name),
                    h('td',{style:{color:'#64748b'}},d.region),
                    h('td',{style:{textAlign:'center'}},d.count),
                    h('td',{style:{fontWeight:600,color:'#4B006E'}},'₱'+Number(d.total_lr||0).toLocaleString())
                  ))
          )
        )
      )
    )
  );
}

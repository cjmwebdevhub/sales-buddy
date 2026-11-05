// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const {user,apiFetch} = useAuth();
  const [data,setData]       = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    apiFetch('/reports/dashboard').then(setData).catch(console.error).finally(()=>setLoading(false));
  },[]);

  if (loading) return h('div',{className:'loading-state'},'Loading dashboard...');

  const actStats    = data?.activity_stats||[];
  const doneCount   = actStats.find(a=>a.activity_status==='Done')?.count||0;
  const pendingCount= actStats.find(a=>a.activity_status==='Pending')?.count||0;
  const totalAct    = actStats.reduce((s,a)=>s+a.count,0);
  const custStats   = data?.customer_stats||[];
  const barData     = custStats.map(c=>({name:c.loan_type,count:c.count}));
  const pieData     = actStats.map(a=>({name:a.activity_status,value:a.count}));

  const SC = ({icon,label,value,sub}) =>
    h('div',{className:'card stat-card'},
      h('div',{className:'stat-icon'},Icon(icon,22)),
      h('div',null,
        h('div',{className:'stat-value'},value),
        h('div',{className:'stat-label'},label),
        sub && h('div',{className:'stat-sub'},sub)
      )
    );

  return h('div',{className:'page-stack'},
    h('div',null,
      h('h1',{className:'page-title'},'Welcome, '+(user?.full_name?.split(' ')[0]||'')+'!'),
      h('p',{className:'page-sub'},user?.role+' · '+user?.agency+' · '+user?.region_name)
    ),
    h('div',{className:'stat-grid'},
      h(SC,{icon:'users',           label:'Total Customers',    value:data?.total_customers||0}),
      h(SC,{icon:'circle-check-big',label:'Activities Done',    value:doneCount, sub:`of ${totalAct} total`}),
      h(SC,{icon:'clock',           label:'Pending Activities', value:pendingCount}),
      h(SC,{icon:'banknote',        label:'Total LR',           value:`₱${((data?.lr_total||0)/1000000).toFixed(2)}M`})
    ),
    h('div',{className:'chart-grid'},
      h('div',{className:'card'},
        h('h2',{className:'card-title'},'Activity Status'),
        pieData.length>0
          ? h(ResponsiveContainer,{width:'100%',height:200},
              h(PieChart,null,
                h(Pie,{data:pieData,cx:'50%',cy:'50%',innerRadius:55,outerRadius:85,dataKey:'value',label:true},
                  pieData.map((_,i)=>h(Cell,{key:i,fill:COLORS[i%COLORS.length]}))
                ),
                h(Legend,null), h(Tooltip,null)
              )
            )
          : h('div',{className:'empty-chart'},'No activity data')
      ),
      h('div',{className:'card'},
        h('h2',{className:'card-title'},'Customers by Loan Type'),
        h(ResponsiveContainer,{width:'100%',height:200},
          h(BarChart,{data:barData},
            h(XAxis,{dataKey:'name',tick:{fontSize:12}}), h(YAxis,null), h(Tooltip,null),
            h(Bar,{dataKey:'count',fill:'#4B006E',radius:[4,4,0,0]})
          )
        )
      )
    ),
    h('div',{className:'card'},
      h('div',{className:'card-header'},
        h('h2',{className:'card-title'},'Recent Activities'),
        h('button',{className:'btn btn-secondary',style:{fontSize:'.75rem',padding:'.375rem .75rem'},onClick:()=>navigate('/activities')},'View all →')
      ),
      data?.recent_activities?.length>0
        ? h('div',{className:'tbl-wrap'},
            h('table',{className:'tbl'},
              h('thead',null,h('tr',null,['Customer','Type','Loan Status','Activity Status','Date'].map(c=>h('th',{key:c},c)))),
              h('tbody',null, data.recent_activities.map(a=>h('tr',{key:a.id},
                h('td',{style:{fontWeight:500}},a.client_name||a.customer_name),
                h('td',{style:{color:'#64748b'}},a.activity_type),
                h('td',{style:{color:'#64748b',fontSize:'.8125rem'}},a.loan_status),
                h('td',null,h(StatusBadge,{status:a.activity_status})),
                h('td',{style:{color:'#94a3b8',fontSize:'.8125rem'}},a.created_at?.slice(0,10))
              )))
            )
          )
        : h('p',{className:'empty-state'},'No recent activities.')
    )
  );
}

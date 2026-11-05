// ── Targets ───────────────────────────────────────────────────────────────────
function Targets() {
  const {user,apiFetch} = useAuth();
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [targets,setTargets] = useState([]);
  const [loading,setLoading] = useState(true);
  const [fAgency,setFAgency] = useState(user?.role==='Admin'?'':(user?.agency||'DEPED'));
  const [fMonth,setFMonth]   = useState(new Date().getMonth()+1);
  const [fYear,setFYear]     = useState(new Date().getFullYear());
  const [showModal,setShowModal] = useState(false);

  const initForm = {
    region_product_group:'',agency:'DEPED',
    month:new Date().getMonth()+1,year:new Date().getFullYear(),
    target_amount:'',actual_lr_mtd:'',actual_lr_ytd:'',actual_lp:'',target_lp:'',
    lr_stretch_target:'',total_new_loan:'',total_reloan:'',target_new_money:'',actual_new_money:''
  };
  const [form,setForm] = useState(initForm);
  const sf = k => v => setForm(f=>({...f,[k]:v}));

  const load = () => {
    let p = `?month=${fMonth}&year=${fYear}`;
    if(fAgency) p += `&agency=${fAgency}`;
    apiFetch('/targets'+p).then(setTargets).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(load,[fAgency,fMonth,fYear]);

  const submit = async e => {
    e.preventDefault();
    try { await apiFetch('/targets',{method:'POST',body:JSON.stringify(form)}); toast.success('Saved!'); setShowModal(false); load(); }
    catch(err) { toast.error(err?.response?.data?.error||'Failed'); }
  };

  return h('div',{className:'page-stack'},
    h('div',{className:'page-header'},
      h('h1',{className:'page-title'},'Targets Tracking'),
      ['Admin','SH'].includes(user?.role) &&
        h('button',{className:'btn btn-primary',onClick:()=>{setForm(initForm);setShowModal(true);}},'+ Add/Update')
    ),
    h('div',{className:'filter-bar'},
      user?.role==='Admin' &&
        h('select',{className:'input',style:{maxWidth:'200px'},value:fAgency,onChange:e=>setFAgency(e.target.value)},
          h('option',{value:''},'All Agencies'),
          ['DEPED','BEYOND_DEPED','PENSION'].map(a=>h('option',{key:a},a))
        ),
      h('select',{className:'input',style:{width:'9rem'},value:fMonth,onChange:e=>setFMonth(Number(e.target.value))},
        MN.map((m,i)=>h('option',{key:i,value:i+1},m))
      ),
      h('input',{type:'number',className:'input',style:{width:'7rem'},value:fYear,onChange:e=>setFYear(Number(e.target.value)),min:2020,max:2030})
    ),
    targets.length>0 && h('div',{className:'card'},
      h('h2',{className:'card-title'},'Target vs Actual LR (MTD)'),
      h(ResponsiveContainer,{width:'100%',height:200},
        h(BarChart,{data:targets.map(t=>({name:t.region_product_group,Target:t.target_amount,Actual:t.actual_lr_mtd}))},
          h(XAxis,{dataKey:'name',tick:{fontSize:11}}),
          h(YAxis,{tickFormatter:v=>`₱${(v/1000000).toFixed(1)}M`,width:70}),
          h(Tooltip,{formatter:v=>`₱${Number(v).toLocaleString()}`}),
          h(Bar,{dataKey:'Target',fill:'#cbd5e1',radius:[4,4,0,0]}),
          h(Bar,{dataKey:'Actual',fill:'#4B006E',radius:[4,4,0,0]})
        )
      )
    ),
    h('div',{className:'targets-grid'},
      loading
        ? h('div',{className:'loading-state'},'Loading...')
        : targets.length===0
          ? h('div',{className:'empty-state'},'No target data for this period.')
          : targets.map(t=>h('div',{key:t.id,className:'card'},
              h('div',{className:'card-header',style:{marginBottom:'1rem'}},
                h('div',null,
                  h('div',{style:{fontWeight:600,color:'#0f172a'}},t.region_product_group),
                  h('div',{style:{fontSize:'.75rem',color:'#94a3b8'}},t.agency+' · '+MN[t.month-1]+' '+t.year)
                ),
                h('div',{style:{textAlign:'right',fontSize:'.75rem',color:'#64748b'}},
                  h('div',null,'New: '+t.total_new_loan),
                  h('div',null,'Reloan: '+t.total_reloan)
                )
              ),
              h(Gauge,{label:'LR MTD Attainment',val:t.actual_lr_mtd,max:t.target_amount}),
              h(Gauge,{label:'New Money Attainment',val:t.actual_new_money,max:t.target_new_money}),
              h('div',{className:'attainment-row'},
                [['MTD Att.',t.mtd_attainment],['LP Att.',t.lp_attainment],['Stretch',t.stretch_attainment]].map(([k,v])=>
                  h('div',{key:k},
                    h('div',{style:{fontWeight:600,color:'#374151'}},Number(v||0).toFixed(1)+'%'),
                    h('div',{style:{color:'#94a3b8',fontSize:'.75rem'}},k)
                  )
                )
              )
            ))
    ),
    h(Modal,{open:showModal,onClose:()=>setShowModal(false),title:'Add / Update Target'},
      h('form',{onSubmit:submit},
        h('div',{className:'grid2'},
          h('div',{className:'span2'}, fld('Region / Product Group *', inp(form.region_product_group,sf('region_product_group'),{required:true}))),
          fld('Agency',  h('select',{className:'input',value:form.agency,onChange:e=>sf('agency')(e.target.value)},['DEPED','BEYOND_DEPED','PENSION'].map(a=>h('option',{key:a},a)))),
          fld('Month',   h('select',{className:'input',value:form.month,onChange:e=>sf('month')(Number(e.target.value))},MN.map((m,i)=>h('option',{key:i,value:i+1},m)))),
          fld('Year',    inp(form.year,v=>sf('year')(Number(v)),{type:'number'})),
          ...['target_amount','actual_lr_mtd','actual_lr_ytd','target_new_money','actual_new_money','total_new_loan','total_reloan'].map(k=>
            fld(k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), inp(form[k],sf(k),{type:'number'}))
          ),
          h('div',{className:'span2 modal-actions'},
            h('button',{className:'btn btn-primary',type:'submit',style:{flex:1}},'Save'),
            h('button',{className:'btn btn-secondary',type:'button',style:{flex:1},onClick:()=>setShowModal(false)},'Cancel')
          )
        )
      )
    )
  );
}

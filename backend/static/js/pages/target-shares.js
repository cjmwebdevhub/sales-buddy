// ── Target Shares ─────────────────────────────────────────────────────────────
function TargetShares() {
  const {user,apiFetch} = useAuth();
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [shares,setShares]       = useState([]);
  const [saList,setSaList]       = useState([]);
  const [audit,setAudit]         = useState([]);
  const [showModal,setShowModal] = useState(false);
  const [showAudit,setShowAudit] = useState(false);
  const [form,setForm] = useState({
    sa_id:'', agency:user?.agency||'DEPED',
    month:new Date().getMonth()+1, year:new Date().getFullYear(), target_amount:''
  });
  const sf = k => v => setForm(f=>({...f,[k]:v}));

  const load = () => apiFetch('/targets/shares').then(setShares).catch(console.error);
  useEffect(()=>{ load(); apiFetch('/reports/sa-list').then(setSaList).catch(()=>{}); },[]);

  const submit = async e => {
    e.preventDefault();
    try { await apiFetch('/targets/shares',{method:'POST',body:JSON.stringify(form)}); toast.success('Target share saved!'); setShowModal(false); load(); }
    catch(err) { toast.error(err?.response?.data?.error||'Failed'); }
  };

  const openAudit = sa_id => {
    apiFetch(`/reports/target-audit/${sa_id}`).then(setAudit).catch(()=>setAudit([]));
    setShowAudit(true);
  };

  return h('div',{className:'page-stack'},
    h('div',{className:'page-header'},
      h('div',null,
        h('h1',{className:'page-title'},'Target Shares'),
        h('p',{className:'page-sub'},'SA-level target assignments')
      ),
      ['ASH','RSH','SH','Admin'].includes(user?.role) &&
        h('button',{className:'btn btn-primary',onClick:()=>setShowModal(true)},'+ Assign Target')
    ),
    h('div',{className:'card tbl-card'},
      h('div',{className:'tbl-wrap'},
        h('table',{className:'tbl'},
          h('thead',null,h('tr',null,['SA Name','Employee ID','Agency','Month/Year','Target Amount','Actual LR','Attainment','Audit'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,
            shares.length===0
              ? h('tr',null,h('td',{colSpan:8,className:'tbl-empty'},'No target shares assigned yet.'))
              : shares.map(s=>h('tr',{key:s.id},
                  h('td',{style:{fontWeight:500}},s.full_name),
                  h('td',{className:'mono-cell'},s.employee_id),
                  h('td',null,h('span',{className:'badge badge-blue'},s.agency)),
                  h('td',{style:{color:'#475569'}},MN[s.month-1]+' '+s.year),
                  h('td',{style:{fontWeight:600}},'₱'+Number(s.target_amount||0).toLocaleString()),
                  h('td',{style:{color:'#475569'}},'₱'+Number(s.actual_lr||0).toLocaleString()),
                  h('td',null,
                    h('div',{style:{display:'flex',alignItems:'center',gap:'.5rem'}},
                      h('div',{style:{flex:1,height:'8px',background:'#f1f5f9',borderRadius:'9999px',overflow:'hidden',minWidth:'60px'}},
                        h('div',{style:{height:'100%',background:'#4B006E',borderRadius:'9999px',width:Math.min(100,s.attainment||0)+'%'}})
                      ),
                      h('span',{style:{fontSize:'.8125rem',fontWeight:600,color:'#374151'}},Number(s.attainment||0).toFixed(1)+'%')
                    )
                  ),
                  h('td',null,h('button',{className:'link-btn',onClick:()=>openAudit(s.sa_id)},'Audit Trail'))
                ))
          )
        )
      )
    ),
    h(Modal,{open:showModal,onClose:()=>setShowModal(false),title:'Assign Target Share'},
      h('form',{onSubmit:submit,style:{display:'flex',flexDirection:'column',gap:'.875rem'}},
        fld('Sales Associate *', h('select',{className:'input',value:form.sa_id,onChange:e=>sf('sa_id')(e.target.value),required:true},
          h('option',{value:''},'Select SA...'),
          saList.map(s=>h('option',{key:s.id,value:s.id},s.full_name+' ('+s.employee_id+')'))
        )),
        h('div',{className:'grid3'},
          fld('Agency', h('select',{className:'input',value:form.agency,onChange:e=>sf('agency')(e.target.value)},['DEPED','BEYOND_DEPED','PENSION'].map(a=>h('option',{key:a},a)))),
          fld('Month',  h('select',{className:'input',value:form.month,onChange:e=>sf('month')(Number(e.target.value))},MN.map((m,i)=>h('option',{key:i,value:i+1},m)))),
          fld('Year',   inp(form.year,v=>sf('year')(Number(v)),{type:'number'}))
        ),
        fld('Target Amount (₱) *', inp(form.target_amount,sf('target_amount'),{type:'number',required:true})),
        h('div',{className:'modal-actions'},
          h('button',{className:'btn btn-primary',type:'submit',style:{flex:1}},'Save'),
          h('button',{className:'btn btn-secondary',type:'button',style:{flex:1},onClick:()=>setShowModal(false)},'Cancel')
        )
      )
    ),
    h(Modal,{open:showAudit,onClose:()=>setShowAudit(false),title:'Audit Trail'},
      audit.length===0
        ? h('p',{className:'empty-state'},'No audit history.')
        : h('div',null,audit.map(a=>h('div',{key:a.id,className:'audit-item'},
            h('div',{style:{display:'flex',justifyContent:'space-between'}},
              h('span',{style:{fontWeight:500}},a.changed_by_name),
              h('span',{className:'muted-cell'},a.changed_at?.slice(0,16))
            ),
            h('div',{style:{color:'#64748b',fontSize:'.8125rem',marginTop:'.25rem'}},
              '₱'+Number(a.old_target||0).toLocaleString()+' → ₱'+Number(a.new_target||0).toLocaleString()
            )
          )))
    )
  );
}

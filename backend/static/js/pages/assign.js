// ── Assign Leads ──────────────────────────────────────────────────────────────
function Assign() {
  const {apiFetch}          = useAuth();
  const [saList,setSaList]  = useState([]);
  const [selTable,setSelTable] = useState('lcs14');
  const [records,setRecords]   = useState([]);
  const [loading,setLoading]   = useState(false);
  const [assignRec,setAssignRec] = useState(null);
  const [aForm,setAForm]         = useState({sa_id:'',priority:'P2'});

  const TABLES = [
    {key:'lcs14',       label:'LCS 14'},
    {key:'lcs18_pd_npl',label:'LCS 18 / PD_NPL'},
    {key:'deped_reloan',label:'DepEd Reloan'},
    {key:'deped_mob',   label:'DepEd MOB'},
  ];
  const agencyMap = {lcs14:'DEPED',lcs18_pd_npl:'DEPED',deped_reloan:'DEPED',deped_mob:'DEPED'};

  useEffect(()=>{ apiFetch('/reports/sa-list').then(setSaList).catch(()=>{}); },[]);
  useEffect(()=>{
    setLoading(true);
    apiFetch(`/uploads/${selTable}`).then(setRecords).catch(()=>setRecords([])).finally(()=>setLoading(false));
  },[selTable]);

  const doAssign = async () => {
    if(!aForm.sa_id||!assignRec) return;
    try {
      const cRes = await apiFetch('/customers',{method:'POST',body:JSON.stringify({
        loan_type:'Reloan', agency:agencyMap[selTable]||'DEPED',
        product:assignRec.product||assignRec.product_categ||'',
        client_name:assignRec.account_name,
        date_added:new Date().toISOString().slice(0,10),
        loan_amount:assignRec.loan_amount||0,
        source:selTable==='lcs14'?'LCS14':selTable==='lcs18_pd_npl'?'PD_NPL':selTable==='deped_reloan'?'DepEd_Leads':'MOB'
      })});
      await apiFetch(`/customers/${cRes.id}/assign`,{method:'POST',body:JSON.stringify(aForm)});
      toast.success('Customer assigned. Auto-tagged as Reloan.');
      setAssignRec(null);
    } catch(err) { toast.error(err?.response?.data?.error||'Failed'); }
  };

  return h('div',{className:'page-stack'},
    h('div',null,
      h('h1',{className:'page-title'},'Assign Leads to SA'),
      h('p',{className:'page-sub'},'Distribute leads from master lists')
    ),
    h('div',{className:'card info-banner'},
      h('div',{style:{display:'flex',gap:'.75rem'}},
        h('span',{style:{fontSize:'1.25rem'}},'ℹ️'),
        h('div',{style:{fontSize:'.875rem',color:'#1e3a8a'}},
          h('strong',null,'Smart Tagging: '),
          'All customers assigned here are automatically tagged as Reloan.'
        )
      )
    ),
    h('div',{className:'tab-bar'},
      h('span',{style:{fontSize:'.875rem',fontWeight:500,color:'#374151'}},'Source:'),
      TABLES.map(t=>h('button',{
        key:t.key,
        onClick:()=>setSelTable(t.key),
        className:'tab-btn'+(selTable===t.key?' active':'')
      },t.label))
    ),
    h('div',{className:'card tbl-card'},
      h('div',{className:'tbl-wrap'},
        h('table',{className:'tbl'},
          h('thead',null,h('tr',null,['Account Name','Branch Code','Account No.','Loan Amount','Status','MOB','Action'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,
            loading
              ? h('tr',null,h('td',{colSpan:7,className:'tbl-empty'},'Loading...'))
              : records.length===0
                ? h('tr',null,h('td',{colSpan:7,className:'tbl-empty'},'No records. Upload a CSV file first.'))
                : records.slice(0,100).map((r,i)=>h('tr',{key:i},
                    h('td',{style:{fontWeight:500}},r.account_name),
                    h('td',{className:'mono-cell'},r.branch_code),
                    h('td',{className:'mono-cell'},r.account_no),
                    h('td',null,'₱'+Number(r.loan_amount||0).toLocaleString()),
                    h('td',{className:'muted-cell'},r.status||r.loanstatus||'—'),
                    h('td',{style:{fontSize:'.8125rem'}},r.mob||'—'),
                    h('td',null,h('button',{className:'link-btn',onClick:()=>{setAssignRec(r);setAForm({sa_id:'',priority:'P2'});}},'Assign'))
                  ))
          )
        )
      )
    ),
    h(Modal,{open:!!assignRec,onClose:()=>setAssignRec(null),title:'Assign Customer'},
      assignRec && h('div',{style:{display:'flex',flexDirection:'column',gap:'1rem'}},
        h('div',{style:{padding:'.75rem',background:'#f8fafc',borderRadius:'.625rem',fontSize:'.875rem'}},
          h('div',{style:{fontWeight:500}},assignRec.account_name),
          h('div',{className:'muted-cell'},assignRec.branch_code+' · ₱'+Number(assignRec.loan_amount||0).toLocaleString()),
          h('div',{style:{color:'#059669',fontSize:'.8125rem',marginTop:'.25rem',fontWeight:500}},'🏷️ Will be auto-tagged as Reloan')
        ),
        fld('Assign to SA *', h('select',{className:'input',value:aForm.sa_id,onChange:e=>setAForm(f=>({...f,sa_id:e.target.value}))},
          h('option',{value:''},'Select SA...'),
          saList.map(s=>h('option',{key:s.id,value:s.id},s.full_name+' ('+s.employee_id+')'))
        )),
        fld('Priority', h('select',{className:'input',value:aForm.priority,onChange:e=>setAForm(f=>({...f,priority:e.target.value}))},
          [['P1','HIGH'],['P2','MID'],['P3','LOW']].map(([p,l])=>h('option',{key:p,value:p},`${p} — ${l}`))
        )),
        h('div',{className:'modal-actions'},
          h('button',{className:'btn btn-primary',style:{flex:1},disabled:!aForm.sa_id,onClick:doAssign},'Assign Customer'),
          h('button',{className:'btn btn-secondary',style:{flex:1},onClick:()=>setAssignRec(null)},'Cancel')
        )
      )
    )
  );
}

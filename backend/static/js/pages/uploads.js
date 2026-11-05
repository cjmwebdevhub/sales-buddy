// ── Uploads ───────────────────────────────────────────────────────────────────
function Uploads() {
  const {apiFetch}              = useAuth();
  const [uploading,setUploading] = useState({});
  const [results,setResults]     = useState({});

  const TABLES = [
    {key:'daily_lr',      label:'Daily LR',           desc:'Daily loan disbursement records',    icon:'banknote'},
    {key:'lcs14',         label:'LCS 14 (MOB 14)',     desc:'Month-on-book 14 loan data',         icon:'file-spreadsheet'},
    {key:'lcs18_pd_npl',  label:'LCS 18 / PD_NPL',    desc:'Non-performing loans MOB 18',        icon:'alert-triangle'},
    {key:'deped_reloan',  label:'DepEd Reloan',        desc:'DepEd reloan tracking data',         icon:'school'},
    {key:'deped_sor',     label:'DepEd SOR',           desc:'DepEd Statement of Releases',        icon:'file-text'},
    {key:'deped_mob',     label:'DepEd MOB',           desc:'DepEd Month on Book data',           icon:'bar-chart-2'},
  ];

  const upload = async (table, file) => {
    if(!file.name.endsWith('.csv')) { toast.error('Only CSV files accepted'); return; }
    setUploading(u=>({...u,[table]:true}));
    const fd    = new FormData(); fd.append('file',file);
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`/api/uploads/${table}`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd});
      const data = await res.json();
      if(!res.ok) throw {response:{data}};
      toast.success(`${data.inserted} records uploaded`);
      setResults(r=>({...r,[table]:{success:true,count:data.inserted}}));
    } catch(err) {
      toast.error(err?.response?.data?.error||'Upload failed');
      setResults(r=>({...r,[table]:{success:false}}));
    } finally { setUploading(u=>({...u,[table]:false})); }
  };

  return h('div',{className:'page-stack'},
    h('div',null,
      h('h1',{className:'page-title'},'Data Uploads'),
      h('p',{className:'page-sub'},'Upload CSV files for bulk data import. Admin only.')
    ),
    h('div',{className:'card warn-banner'},
      h('div',{style:{display:'flex',gap:'.75rem',alignItems:'center'}},
        Icon('triangle-alert',18,{color:'#92400e',flexShrink:0}),
        h('div',{style:{fontSize:'.875rem',color:'#92400e'}},
          h('strong',null,'CSV Format Required: '),'All files must be .csv only.'
        )
      )
    ),
    h('div',{className:'uploads-grid'},
      TABLES.map(t=>h('div',{key:t.key,className:'card'},
        h('div',{className:'upload-card-header'},
          h('div',{className:'upload-icon'},Icon(t.icon,20)),
          h('div',null,
            h('div',{style:{fontWeight:600,color:'#0f172a'}},t.label),
            h('div',{style:{fontSize:'.8125rem',color:'#64748b'}},t.desc)
          )
        ),
        h('label',{style:{display:'block',cursor:'pointer'}},
          h('div',{className:'upload-dropzone'+(uploading[t.key]?' uploading':'')},
            uploading[t.key]
              ? h('div',{className:'upload-loading'},Icon('loader',16,{color:'#4B006E'}),'Uploading...')
              : h(Fragment,null,
                  h('div',{style:{display:'flex',justifyContent:'center',marginBottom:'.25rem'}},Icon('upload-cloud',28,{color:'#c4b5fd'})),
                  h('div',{style:{fontSize:'.875rem',fontWeight:500,color:'#475569'}},'Drop CSV or click to browse'),
                  h('div',{style:{fontSize:'.75rem',color:'#94a3b8',marginTop:'.125rem'}},'.csv files only')
                )
          ),
          h('input',{
            type:'file', accept:'.csv', style:{display:'none'},
            onChange:e=>{ if(e.target.files[0]) upload(t.key,e.target.files[0]); e.target.value=''; },
            disabled:uploading[t.key]
          })
        ),
        results[t.key] && h('div',{
          className:'upload-result '+(results[t.key].success?'result-ok':'result-err')
        },
          Icon(results[t.key].success?'circle-check-big':'circle-x',14),
          results[t.key].success ? `${results[t.key].count} records imported` : 'Upload failed'
        )
      ))
    )
  );
}

// ── Activities ────────────────────────────────────────────────────────────────
function Activities() {
  const {user,apiFetch}        = useAuth();
  const [acts,setActs]         = useState([]);
  const [custs,setCusts]       = useState([]);
  const [loading,setLoading]   = useState(true);
  const [showModal,setShowModal] = useState(false);
  const [editAct,setEditAct]   = useState(null);
  const [filterStatus,setFilterStatus] = useState('');

  const initForm = {
    customer_id:'',loan_status:'For Application',activity_type:'Visit',
    activity_status:'Pending',disbursal_date:'',duration:'',address:'',sales_notes:''
  };
  const [form,setForm] = useState(initForm);
  const sf = k => v => setForm(f=>({...f,[k]:v}));

  const LOAN_ST = ['For Application','Not Interested','Pending Approval','Released'];
  const ACT_TY  = ['Call','Message','Email','Online Meeting','Event','Visit'];
  const ACT_ST  = ['Call Again','Pending','Done'];

  const load = () => {
    const p = filterStatus ? `?status=${filterStatus}` : '';
    apiFetch('/activities'+p).then(setActs).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(load,[filterStatus]);
  useEffect(()=>{ apiFetch('/customers').then(setCusts).catch(()=>{}); },[]);

  const openNew  = () => { setEditAct(null); setForm(initForm); setShowModal(true); };
  const openEdit = a  => {
    setEditAct(a);
    setForm({customer_id:a.customer_id||'',loan_status:a.loan_status,activity_type:a.activity_type,
             activity_status:a.activity_status,disbursal_date:a.disbursal_date||'',
             duration:a.duration||'',address:a.address||'',sales_notes:a.sales_notes||''});
    setShowModal(true);
  };

  const submit = async e => {
    e.preventDefault();
    try {
      if (editAct) { await apiFetch(`/activities/${editAct.id}`,{method:'PUT',body:JSON.stringify(form)}); toast.success('Updated!'); }
      else         { await apiFetch('/activities',{method:'POST',body:JSON.stringify(form)}); toast.success('Created!'); }
      setShowModal(false); load();
    } catch(err) { toast.error(err?.response?.data?.error||'Failed'); }
  };

  const del = async id => {
    if(!confirm('Delete?')) return;
    try { await apiFetch(`/activities/${id}`,{method:'DELETE'}); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return h('div',{className:'page-stack'},
    h('div',{className:'page-header'},
      h('div',null,
        h('h1',{className:'page-title'},'Activities'),
        h('p',{className:'page-sub'},acts.length+' activities')
      ),
      h('button',{className:'btn btn-primary',onClick:openNew},'+ Add Activity')
    ),
    h('select',{className:'input',style:{maxWidth:'220px'},value:filterStatus,onChange:e=>setFilterStatus(e.target.value)},
      h('option',{value:''},'All Statuses'),
      ACT_ST.map(s=>h('option',{key:s},s))
    ),
    h('div',{className:'card tbl-card'},
      h('div',{className:'tbl-wrap'},
        h('table',{className:'tbl'},
          h('thead',null,h('tr',null,['ID','Customer','Type','Loan Status','Status','Duration','Notes','SA','Date','Actions'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,
            loading
              ? h('tr',null,h('td',{colSpan:10,className:'tbl-empty'},'Loading...'))
              : acts.length===0
                ? h('tr',null,h('td',{colSpan:10,className:'tbl-empty'},'No activities found'))
                : acts.map(a=>h('tr',{key:a.id},
                    h('td',{className:'mono-cell'},a.activity_id),
                    h('td',{style:{fontWeight:500}},a.client_name||a.customer_name),
                    h('td',{style:{color:'#475569'}},a.activity_type),
                    h('td',{className:'muted-cell'},a.loan_status),
                    h('td',null,h(StatusBadge,{status:a.activity_status})),
                    h('td',{style:{color:'#94a3b8'}},a.duration),
                    h('td',{className:'notes-cell'},a.sales_notes),
                    h('td',{className:'muted-cell'},a.sa_name),
                    h('td',{className:'muted-cell'},a.created_at?.slice(0,10)),
                    h('td',null,
                      h('div',{style:{display:'flex',gap:'.5rem'}},
                        h('button',{className:'link-btn',onClick:()=>openEdit(a)},'Edit'),
                        user?.role==='SA' && h('button',{className:'link-btn danger-btn',onClick:()=>del(a.id)},'Del')
                      )
                    )
                  ))
          )
        )
      )
    ),
    h(Modal,{open:showModal,onClose:()=>setShowModal(false),title:editAct?'Edit Activity':'New Activity'},
      h('form',{onSubmit:submit},
        h('div',{className:'grid2'},
          !editAct && h('div',{className:'span2'}, fld('Customer *',
            h('select',{className:'input',value:form.customer_id,onChange:e=>sf('customer_id')(e.target.value),required:true},
              h('option',{value:''},'Select customer...'),
              custs.map(c=>h('option',{key:c.id,value:c.id},c.client_name+' ('+c.customer_id+')'))
            )
          )),
          fld('Activity Type *',   h('select',{className:'input',value:form.activity_type,onChange:e=>sf('activity_type')(e.target.value)},ACT_TY.map(t=>h('option',{key:t},t)))),
          fld('Activity Status *', h('select',{className:'input',value:form.activity_status,onChange:e=>sf('activity_status')(e.target.value)},ACT_ST.map(s=>h('option',{key:s},s)))),
          h('div',{className:'span2'}, fld('Loan Status *', h('select',{className:'input',value:form.loan_status,onChange:e=>sf('loan_status')(e.target.value)},LOAN_ST.map(s=>h('option',{key:s},s))))),
          form.loan_status==='Released' && h('div',{className:'span2'}, fld('Disbursal Date', inp(form.disbursal_date,sf('disbursal_date'),{type:'date'}))),
          fld('Duration', inp(form.duration,sf('duration'),{placeholder:'30 mins'})),
          fld('Address',  inp(form.address,sf('address'))),
          h('div',{className:'span2'}, fld('Sales Notes', h('textarea',{className:'input',rows:3,value:form.sales_notes,onChange:e=>sf('sales_notes')(e.target.value)}))),
          h('div',{className:'span2 modal-actions'},
            h('button',{className:'btn btn-primary',type:'submit',style:{flex:1}},editAct?'Update':'Save'),
            h('button',{className:'btn btn-secondary',type:'button',style:{flex:1},onClick:()=>setShowModal(false)},'Cancel')
          )
        )
      )
    )
  );
}

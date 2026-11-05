// ── Customers ─────────────────────────────────────────────────────────────────
function Customers() {
  const {user,apiFetch} = useAuth();
  const [customers,setCustomers] = useState([]);
  const [promos,setPromos]       = useState([]);
  const [loading,setLoading]     = useState(true);
  const [showModal,setShowModal] = useState(false);
  const [search,setSearch]       = useState('');
  const [filterLoan,setFilterLoan] = useState('');

  const initForm = {
    loan_type:'New Loan', agency:user?.agency||'DEPED', product:'', promo_id:'',
    client_name:'', date_added:new Date().toISOString().slice(0,10),
    school:'', location:'', employee_number:'', mobile_number:'', customer_email:'', loan_amount:''
  };
  const [form,setForm] = useState(initForm);
  const sf = k => v => setForm(f=>({...f,[k]:v}));

  const PRODS = {
    DEPED:['01.01 DEPED','01.02 DEPED CALAMITY','02 NEWLY HIRED TEACHERS','03 DEPED SPECIAL'],
    BEYOND_DEPED:['SUC','LGU','GOCCs','Other Government'],
    PENSION:['Pension','GSIS','SSS','AFP']
  };

  const load = () => {
    const p = filterLoan ? `?loan_type=${filterLoan}` : '';
    apiFetch('/customers'+p).then(setCustomers).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(load,[filterLoan]);
  useEffect(()=>{ apiFetch(`/promos?active_only=true&agency=${form.agency}`).then(setPromos).catch(()=>{}); },[form.agency]);

  const submit = async e => {
    e.preventDefault();
    try {
      await apiFetch('/customers',{method:'POST',body:JSON.stringify(form)});
      toast.success('Customer registered!'); setShowModal(false); setForm(initForm); load();
    } catch(err) { toast.error(err?.response?.data?.error||'Failed'); }
  };

  const filtered = customers.filter(c =>
    c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_id?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile_number?.includes(search)
  );

  return h('div',{className:'page-stack'},
    h('div',{className:'page-header'},
      h('div',null,
        h('h1',{className:'page-title'},'Customers'),
        h('p',{className:'page-sub'},customers.length+' total')
      ),
      h('button',{className:'btn btn-primary',onClick:()=>setShowModal(true)},'+ Add Customer')
    ),
    h('div',{className:'filter-bar'},
      inp(search,setSearch,{placeholder:'Search name, ID, mobile...',style:{maxWidth:'280px'}}),
      h('select',{className:'input',style:{maxWidth:'200px'},value:filterLoan,onChange:e=>setFilterLoan(e.target.value)},
        h('option',{value:''},'All Loan Types'),
        h('option',null,'New Loan'),
        h('option',null,'Reloan')
      )
    ),
    h('div',{className:'card tbl-card'},
      h('div',{className:'tbl-wrap'},
        h('table',{className:'tbl'},
          h('thead',null,h('tr',null,['ID','Client Name','Agency','Loan Type','Product','Amount','Branch','Source','Contact','Date',''].map(c=>h('th',{key:c},c)))),
          h('tbody',null,
            loading
              ? h('tr',null,h('td',{colSpan:11,className:'tbl-empty'},'Loading...'))
              : filtered.length===0
                ? h('tr',null,h('td',{colSpan:11,className:'tbl-empty'},'No customers found'))
                : filtered.map(c=>h('tr',{key:c.id},
                    h('td',{className:'mono-cell'},c.customer_id),
                    h('td',{style:{fontWeight:500}},c.client_name),
                    h('td',null,h('span',{className:'badge badge-blue'},c.agency)),
                    h('td',{style:{color:'#475569'}},c.loan_type),
                    h('td',{className:'muted-cell'},c.product),
                    h('td',null,'₱'+Number(c.loan_amount||0).toLocaleString()),
                    h('td',{className:'muted-cell'},c.branch_name),
                    h('td',null,h('span',{className:'badge',style:{background:c.source==='Manual'?'#f1f5f9':'#f0fdf4',color:c.source==='Manual'?'#475569':'#15803d'}},c.source)),
                    h('td',null,
                      c.mobile_number&&h('a',{href:'tel:'+c.mobile_number,style:{marginRight:'.5rem'}},'📞'),
                      c.customer_email&&h('a',{href:'mailto:'+c.customer_email},'✉️')
                    ),
                    h('td',{className:'muted-cell'},c.date_added),
                    h('td',null,h('button',{className:'link-btn',onClick:()=>navigate('/customers/'+c.id)},'View →'))
                  ))
          )
        )
      )
    ),
    h(Modal,{open:showModal,onClose:()=>setShowModal(false),title:'Register New Customer'},
      h('form',{onSubmit:submit},
        h('div',{className:'grid2'},
          fld('Loan Type *', h('select',{className:'input',value:form.loan_type,onChange:e=>sf('loan_type')(e.target.value)},
            h('option',null,'New Loan'), h('option',null,'Reloan')
          )),
          fld('Agency', inp(form.agency,()=>{},{readOnly:true,style:{background:'#f8fafc'}})),
          fld('Product', h('select',{className:'input',value:form.product,onChange:e=>sf('product')(e.target.value)},
            h('option',{value:''},'Select...'),
            (PRODS[form.agency]||[]).map(p=>h('option',{key:p},p))
          )),
          fld('Promo', h('select',{className:'input',value:form.promo_id,onChange:e=>sf('promo_id')(e.target.value)},
            h('option',{value:''},'No promo'),
            promos.map(p=>h('option',{key:p.id,value:p.id},p.promo_name))
          )),
          h('div',{className:'span2'}, fld('Client Full Name *', inp(form.client_name,sf('client_name'),{placeholder:'First Middle Last',required:true}))),
          fld('Date Added *', inp(form.date_added,sf('date_added'),{type:'date',required:true})),
          fld('Employee Number', inp(form.employee_number,sf('employee_number'))),
          form.agency==='DEPED' && h('div',{className:'span2'}, fld('School', inp(form.school,sf('school')))),
          h('div',{className:'span2'}, fld('Location', inp(form.location,sf('location'),{placeholder:'City, Province'}))),
          fld('Mobile', inp(form.mobile_number,sf('mobile_number'))),
          fld('Email',  inp(form.customer_email,sf('customer_email'),{type:'email'})),
          h('div',{className:'span2'}, fld('Loan Amount (₱)', inp(form.loan_amount,sf('loan_amount'),{type:'number'}))),
          h('div',{className:'span2 modal-actions'},
            h('button',{className:'btn btn-primary',type:'submit',style:{flex:1}},'Save Customer'),
            h('button',{className:'btn btn-secondary',type:'button',style:{flex:1},onClick:()=>setShowModal(false)},'Cancel')
          )
        )
      )
    )
  );
}

// ── Customer Detail ───────────────────────────────────────────────────────────
function CustomerDetail({id}) {
  const {apiFetch}         = useAuth();
  const [customer,setCustomer] = useState(null);
  const [loading,setLoading]   = useState(true);
  const [showAct,setShowAct]   = useState(false);
  const [actForm,setActForm]   = useState({
    loan_status:'For Application',activity_type:'Visit',activity_status:'Pending',
    disbursal_date:'',duration:'',address:'',sales_notes:''
  });
  const saf = k => v => setActForm(f=>({...f,[k]:v}));

  const load = () => apiFetch(`/customers/${id}`).then(setCustomer).catch(console.error).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[id]);

  const submitAct = async e => {
    e.preventDefault();
    try {
      await apiFetch('/activities',{method:'POST',body:JSON.stringify({...actForm,customer_id:customer.id})});
      toast.success('Activity saved!'); setShowAct(false); load();
    } catch(err) { toast.error(err?.response?.data?.error||'Failed'); }
  };

  if (loading)   return h('div',{className:'loading-state'},'Loading...');
  if (!customer) return h('div',{className:'loading-state'},'Customer not found');

  const LOAN_ST = ['For Application','Not Interested','Pending Approval','Released'];
  const ACT_TY  = ['Call','Message','Email','Online Meeting','Event','Visit'];
  const ACT_ST  = ['Call Again','Pending','Done'];

  return h('div',{className:'page-stack',style:{maxWidth:'56rem'}},
    h('div',{className:'breadcrumb'},
      h('button',{className:'link-btn',onClick:()=>navigate('/customers')},'← Customers'),
      h('span',null,' / '),
      h('span',null,customer.client_name)
    ),
    h('div',{className:'card'},
      h('div',{className:'card-header',style:{marginBottom:'1.25rem'}},
        h('div',null,
          h('h1',{className:'page-title',style:{marginBottom:'.25rem'}},customer.client_name),
          h('p',{className:'mono-cell',style:{fontSize:'.8125rem'}},customer.customer_id)
        ),
        h('div',{style:{display:'flex',gap:'.5rem',flexWrap:'wrap'}},
          customer.priority && h('span',{className:'badge',style:{background:'#fee2e2',color:'#991b1b'}},customer.priority),
          h('span',{className:'badge badge-blue'},customer.agency),
          h('span',{className:'badge',style:{background:'#f1f5f9',color:'#475569'}},customer.loan_type)
        )
      ),
      h('div',{className:'detail-grid'},
        [['Product',customer.product],['Loan Amount','₱'+Number(customer.loan_amount||0).toLocaleString()],
         ['Branch',customer.branch_name],['Region',customer.region_name],
         ['School',customer.school||'—'],['Location',customer.location||'—'],
         ['Employee No.',customer.employee_number||'—'],['Mobile',customer.mobile_number||'—'],
         ['Email',customer.customer_email||'—'],['Date Added',customer.date_added],
         ['Source',customer.source],['Assigned SA',customer.sa_name||'—']
        ].map(([k,v])=>
          h('div',{key:k},
            h('div',{className:'detail-label'},k),
            h('div',{className:'detail-value'},v)
          )
        )
      ),
      h('div',{className:'card-actions'},
        customer.mobile_number  && h('a',{href:'tel:'+customer.mobile_number,className:'btn btn-secondary'},'📞 Call'),
        customer.customer_email && h('a',{href:'mailto:'+customer.customer_email,className:'btn btn-secondary'},'✉️ Email'),
        h('button',{className:'btn btn-primary',onClick:()=>setShowAct(true)},'+ Add Activity')
      )
    ),
    h('div',{className:'card'},
      h('div',{className:'card-header'},
        h('h2',{className:'card-title'},'Related Activities ('+(customer.activities?.length||0)+')'),
        h('button',{className:'btn btn-secondary',style:{fontSize:'.8125rem',padding:'.375rem .75rem'},onClick:()=>setShowAct(true)},'+ Add')
      ),
      customer.activities?.length>0
        ? h('div',{className:'tbl-wrap'},
            h('table',{className:'tbl'},
              h('thead',null,h('tr',null,['ID','Type','Loan Status','Status','Duration','Notes','Date'].map(c=>h('th',{key:c},c)))),
              h('tbody',null,customer.activities.map(a=>h('tr',{key:a.id},
                h('td',{className:'mono-cell'},a.activity_id),
                h('td',null,a.activity_type),
                h('td',{className:'muted-cell'},a.loan_status),
                h('td',null,h(StatusBadge,{status:a.activity_status})),
                h('td',{style:{color:'#94a3b8'}},a.duration),
                h('td',{className:'notes-cell'},a.sales_notes),
                h('td',{className:'muted-cell'},a.created_at?.slice(0,10))
              )))
            )
          )
        : h('p',{className:'empty-state'},'No activities yet.')
    ),
    h(Modal,{open:showAct,onClose:()=>setShowAct(false),title:'Add Activity'},
      h('form',{onSubmit:submitAct},
        h('div',{className:'grid2'},
          fld('Activity Type *',   h('select',{className:'input',value:actForm.activity_type,onChange:e=>saf('activity_type')(e.target.value)},ACT_TY.map(t=>h('option',{key:t},t)))),
          fld('Activity Status *', h('select',{className:'input',value:actForm.activity_status,onChange:e=>saf('activity_status')(e.target.value)},ACT_ST.map(s=>h('option',{key:s},s)))),
          h('div',{className:'span2'}, fld('Loan Status *', h('select',{className:'input',value:actForm.loan_status,onChange:e=>saf('loan_status')(e.target.value)},LOAN_ST.map(s=>h('option',{key:s},s))))),
          actForm.loan_status==='Released' && h('div',{className:'span2'}, fld('Disbursal Date', inp(actForm.disbursal_date,saf('disbursal_date'),{type:'date'}))),
          fld('Duration', inp(actForm.duration,saf('duration'),{placeholder:'30 mins'})),
          fld('Address',  inp(actForm.address,saf('address'))),
          h('div',{className:'span2'}, fld('Sales Notes', h('textarea',{className:'input',rows:3,value:actForm.sales_notes,onChange:e=>saf('sales_notes')(e.target.value)}))),
          h('div',{className:'span2 modal-actions'},
            h('button',{className:'btn btn-primary',type:'submit',style:{flex:1}},'Save Activity'),
            h('button',{className:'btn btn-secondary',type:'button',style:{flex:1},onClick:()=>setShowAct(false)},'Cancel')
          )
        )
      )
    )
  );
}

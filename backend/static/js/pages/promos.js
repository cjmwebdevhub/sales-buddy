// ── Promos ────────────────────────────────────────────────────────────────────
function Promos() {
  const {user,apiFetch}        = useAuth();
  const [promos,setPromos]     = useState([]);
  const [loading,setLoading]   = useState(true);
  const [showModal,setShowModal] = useState(false);
  const [editPromo,setEditPromo] = useState(null);
  const [form,setForm] = useState({promo_agency:'DEPED',promo_name:'',date_start:'',date_end:'',description:'',changes_made:''});
  const sf = k => v => setForm(f=>({...f,[k]:v}));

  const load = () => apiFetch('/promos').then(setPromos).catch(console.error).finally(()=>setLoading(false));
  useEffect(load,[]);

  const openNew = () => {
    setEditPromo(null);
    setForm({promo_agency:'DEPED',promo_name:'',date_start:'',date_end:'',description:'',changes_made:''});
    setShowModal(true);
  };
  const openEdit = p => {
    setEditPromo(p);
    setForm({promo_agency:p.promo_agency,promo_name:p.promo_name,date_start:p.date_start,date_end:p.date_end,description:p.description||'',changes_made:''});
    setShowModal(true);
  };

  const submit = async e => {
    e.preventDefault();
    try {
      if(editPromo) { await apiFetch(`/promos/${editPromo.id}`,{method:'PUT',body:JSON.stringify(form)}); toast.success('Updated!'); }
      else          { await apiFetch('/promos',{method:'POST',body:JSON.stringify(form)}); toast.success('Created!'); }
      setShowModal(false); load();
    } catch(err) { toast.error(err?.response?.data?.error||'Failed'); }
  };

  const del = async id => {
    if(!confirm('Delete?')) return;
    try { await apiFetch(`/promos/${id}`,{method:'DELETE'}); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const isActive = p => new Date(p.date_end) >= new Date();

  return h('div',{className:'page-stack'},
    h('div',{className:'page-header'},
      h('div',null,
        h('h1',{className:'page-title'},'Promos'),
        h('p',{className:'page-sub'},'Active and expired promotional offers')
      ),
      user?.role==='Admin' && h('button',{className:'btn btn-primary',onClick:openNew},'+ Create Promo')
    ),
    h('div',{className:'promos-grid'},
      loading
        ? h('div',{className:'loading-state'},'Loading...')
        : promos.length===0
          ? h('div',{className:'empty-state'},'No promos available.')
          : promos.map(p=>h('div',{key:p.id,className:'card promo-card',style:{opacity:isActive(p)?1:0.65}},
              h('div',{className:'promo-card-header'},
                h('div',null,
                  h('div',{style:{marginBottom:'.25rem'}},Icon('tag',22,{color:'#4B006E'})),
                  h('div',{style:{fontWeight:600,color:'#0f172a'}},p.promo_name),
                  h('div',{className:'mono-cell'},p.promo_id)
                ),
                h('div',{style:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'.25rem'}},
                  h('span',{className:'badge',style:{background:isActive(p)?'#d1fae5':'#fee2e2',color:isActive(p)?'#065f46':'#991b1b'}},isActive(p)?'✅ Active':'❌ Expired'),
                  h('span',{className:'badge badge-blue'},p.promo_agency)
                )
              ),
              h('p',{style:{fontSize:'.875rem',color:'#475569',marginBottom:'.75rem'}},p.description),
              h('div',{style:{fontSize:'.8125rem',color:'#94a3b8'}},
                h('div',null,'Start: ',h('span',{style:{color:'#374151',fontWeight:500}},p.date_start)),
                h('div',null,'End: ',  h('span',{style:{color:'#374151',fontWeight:500}},p.date_end))
              ),
              user?.role==='Admin' && h('div',{className:'card-actions',style:{marginTop:'.75rem',paddingTop:'.75rem',borderTop:'1px solid #f1f5f9'}},
                h('button',{className:'btn btn-secondary',style:{flex:1,fontSize:'.8125rem'},onClick:()=>openEdit(p)},'Edit'),
                h('button',{className:'btn btn-danger',style:{flex:1,fontSize:'.8125rem'},onClick:()=>del(p.id)},'Delete')
              )
            ))
    ),
    h(Modal,{open:showModal,onClose:()=>setShowModal(false),title:editPromo?'Edit Promo':'Create Promo'},
      h('form',{onSubmit:submit},
        h('div',{className:'grid2'},
          fld('Agency *',     h('select',{className:'input',value:form.promo_agency,onChange:e=>sf('promo_agency')(e.target.value)},['DEPED','BEYOND_DEPED','PENSION'].map(a=>h('option',{key:a},a)))),
          fld('Promo Name *', inp(form.promo_name,sf('promo_name'),{required:true})),
          fld('Date Start *', inp(form.date_start,sf('date_start'),{type:'date',required:true})),
          fld('Date End *',   inp(form.date_end,sf('date_end'),{type:'date',required:true})),
          h('div',{className:'span2'}, fld('Description', h('textarea',{className:'input',rows:3,value:form.description,onChange:e=>sf('description')(e.target.value)}))),
          editPromo && h('div',{className:'span2'}, fld('Changes Made', inp(form.changes_made,sf('changes_made'),{placeholder:'What changed...'}))),
          h('div',{className:'span2 modal-actions'},
            h('button',{className:'btn btn-primary',type:'submit',style:{flex:1}},editPromo?'Update':'Create'),
            h('button',{className:'btn btn-secondary',type:'button',style:{flex:1},onClick:()=>setShowModal(false)},'Cancel')
          )
        )
      )
    )
  );
}

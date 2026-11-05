// ── Profile ───────────────────────────────────────────────────────────────────
function Profile() {
  const {user,apiFetch,refreshUser} = useAuth();
  const [form,setForm]   = useState({full_name:user?.full_name||'',reports_to:user?.reports_to||''});
  const [loading,setLoading] = useState(false);

  const RC = {SA:'#d1fae5 #065f46',ASH:'#dbeafe #1e40af',RSH:'#ede9fe #6d28d9',SH:'#ffedd5 #c2410c',Admin:'#fee2e2 #991b1b'};
  const [bg,tc] = (RC[user?.role]||'#f1f5f9 #374151').split(' ');

  const save = async e => {
    e.preventDefault(); setLoading(true);
    try { await apiFetch('/users/me',{method:'PUT',body:JSON.stringify(form)}); await refreshUser(); toast.success('Profile updated!'); }
    catch(err) { toast.error(err?.response?.data?.error||'Failed'); }
    finally { setLoading(false); }
  };

  return h('div',{style:{maxWidth:'40rem'}},
    h('h1',{className:'page-title',style:{marginBottom:'1.25rem'}},'My Profile'),
    h('div',{className:'card'},
      h('div',{className:'profile-header'},
        h('div',{className:'profile-avatar'},user?.full_name?.charAt(0)||'U'),
        h('div',null,
          h('h2',{style:{fontSize:'1.25rem',fontWeight:600,color:'#0f172a',marginBottom:'.25rem'}},user?.full_name),
          h('p',{style:{color:'#64748b',fontSize:'.875rem',marginBottom:'.5rem'}},user?.email),
          h('div',{style:{display:'flex',gap:'.5rem'}},
            h('span',{className:'badge',style:{background:bg,color:tc}},user?.role),
            h('span',{className:'badge',style:{background:'#f1f5f9',color:'#475569'}},user?.agency)
          )
        )
      ),
      h('div',{className:'profile-info-grid'},
        [['Employee ID',user?.employee_id],['Branch',user?.branch_name],
         ['Branch Code',user?.branch_code],['Region',user?.region_name],
         ['Joined',user?.created_at?.slice(0,10)]
        ].map(([k,v])=>
          h('div',{key:k},
            h('div',{className:'detail-label'},k),
            h('div',{className:'detail-value'},v||'—')
          )
        )
      ),
      h('form',{onSubmit:save,className:'profile-edit-form'},
        h('h3',{style:{fontSize:'.9375rem',fontWeight:600,color:'#374151'}},'Edit Details'),
        fld('Full Name', inp(form.full_name,v=>setForm(f=>({...f,full_name:v})))),
        fld('Reporting To (Email)', inp(form.reports_to,v=>setForm(f=>({...f,reports_to:v})),{placeholder:'supervisor@csb.com'})),
        h('button',{className:'btn btn-primary',type:'submit',disabled:loading,style:{alignSelf:'flex-start',padding:'.625rem 1.5rem'}},
          loading?'Saving...':'Save Changes'
        )
      ),
      h('div',{className:'profile-notice'},
        h('strong',null,'⚠️ Important: '),
        'To correct your Employee ID, email, or role, contact your ASH.'
      )
    )
  );
}

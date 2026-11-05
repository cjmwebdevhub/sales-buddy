// ── Users ─────────────────────────────────────────────────────────────────────
function Users() {
  const {user,apiFetch}      = useAuth();
  const [users,setUsers]     = useState([]);
  const [loading,setLoading] = useState(true);
  const [editUser,setEditUser] = useState(null);
  const [eForm,setEForm]       = useState({});
  const [search,setSearch]     = useState('');

  const load = () => apiFetch('/users').then(setUsers).catch(console.error).finally(()=>setLoading(false));
  useEffect(load,[]);

  const openEdit = u => {
    setEditUser(u);
    setEForm({full_name:u.full_name,role:u.role,agency:u.agency,region_name:u.region_name,branch_code:u.branch_code,branch_name:u.branch_name,reports_to:u.reports_to||''});
  };

  const save = async () => {
    try { await apiFetch(`/users/${editUser.id}`,{method:'PUT',body:JSON.stringify(eForm)}); toast.success('Updated!'); setEditUser(null); load(); }
    catch(err) { toast.error(err?.response?.data?.error||'Failed'); }
  };

  const del = async id => {
    if(!confirm('Delete user?')) return;
    try { await apiFetch(`/users/${id}`,{method:'DELETE'}); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  const RC = {SA:'#d1fae5 #065f46',ASH:'#dbeafe #1e40af',RSH:'#ede9fe #6d28d9',SH:'#ffedd5 #c2410c',Admin:'#fee2e2 #991b1b'};

  return h('div',{className:'page-stack'},
    h('div',null,
      h('h1',{className:'page-title'},'Users'),
      h('p',{className:'page-sub'},users.length+' registered users')
    ),
    inp(search,setSearch,{placeholder:'Search name, email, ID...',style:{maxWidth:'280px'}}),
    h('div',{className:'card tbl-card'},
      h('div',{className:'tbl-wrap'},
        h('table',{className:'tbl'},
          h('thead',null,h('tr',null,
            ['Name','Email','Employee ID','Role','Agency','Branch','Region','Reports To',
             ...(user?.role==='Admin'?['Actions']:[])
            ].map(c=>h('th',{key:c},c))
          )),
          h('tbody',null,
            loading
              ? h('tr',null,h('td',{colSpan:9,className:'tbl-empty'},'Loading...'))
              : filtered.length===0
                ? h('tr',null,h('td',{colSpan:9,className:'tbl-empty'},'No users found'))
                : filtered.map(u => {
                    const [bg,tc] = (RC[u.role]||'#f1f5f9 #374151').split(' ');
                    return h('tr',{key:u.id},
                      h('td',{style:{fontWeight:500}},u.full_name),
                      h('td',{className:'muted-cell'},u.email),
                      h('td',{className:'mono-cell'},u.employee_id),
                      h('td',null,h('span',{className:'badge',style:{background:bg,color:tc}},u.role)),
                      h('td',{className:'muted-cell'},u.agency),
                      h('td',{className:'muted-cell'},u.branch_name),
                      h('td',{className:'muted-cell'},u.region_name),
                      h('td',{style:{fontSize:'.8125rem',color:'#94a3b8'}},u.reports_to||'—'),
                      user?.role==='Admin' && h('td',null,
                        h('div',{style:{display:'flex',gap:'.5rem'}},
                          h('button',{className:'link-btn',onClick:()=>openEdit(u)},'Edit'),
                          h('button',{className:'link-btn danger-btn',onClick:()=>del(u.id)},'Del')
                        )
                      )
                    );
                  })
          )
        )
      )
    ),
    h(Modal,{open:!!editUser,onClose:()=>setEditUser(null),title:'Edit: '+(editUser?.full_name||'')},
      editUser && h('div',{style:{display:'flex',flexDirection:'column',gap:'.875rem'}},
        fld('Full Name', inp(eForm.full_name,v=>setEForm(f=>({...f,full_name:v})))),
        h('div',{className:'grid2'},
          fld('Role',   h('select',{className:'input',value:eForm.role,onChange:e=>setEForm(f=>({...f,role:e.target.value}))},['SA','ASH','RSH','SH','Admin'].map(r=>h('option',{key:r},r)))),
          fld('Agency', h('select',{className:'input',value:eForm.agency,onChange:e=>setEForm(f=>({...f,agency:e.target.value}))},['DEPED','BEYOND_DEPED','PENSION','ALL'].map(a=>h('option',{key:a},a))))
        ),
        fld('Reports To', inp(eForm.reports_to,v=>setEForm(f=>({...f,reports_to:v})))),
        h('div',{className:'modal-actions'},
          h('button',{className:'btn btn-primary',style:{flex:1},onClick:save},'Save Changes'),
          h('button',{className:'btn btn-secondary',style:{flex:1},onClick:()=>setEditUser(null)},'Cancel')
        )
      )
    )
  );
}

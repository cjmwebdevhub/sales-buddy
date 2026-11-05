// ── Register ──────────────────────────────────────────────────────────────────
function Register() {
  const {register,apiFetch} = useAuth();
  const [branches,setBranches]   = useState([]);
  const [loading,setLoading]     = useState(false);
  const [form,setForm] = useState({
    email:'',password:'',full_name:'',employee_id:'',
    role:'SA',agency:'DEPED',region_name:'',branch_code:'',branch_name:'',reports_to:''
  });
  const sf = k => v => setForm(f=>({...f,[k]:v}));

  useEffect(()=>{ apiFetch('/reports/branches').then(setBranches).catch(()=>{}); },[]);

  const regions = [...new Set(branches.map(b=>b.region_name))];
  const filtB   = branches.filter(b=>b.region_name===form.region_name);

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try { await register(form); toast.success('Registered!'); navigate('/dashboard'); }
    catch(err) { toast.error(err?.response?.data?.error||'Registration failed'); }
    finally { setLoading(false); }
  };

  return h('div',{style:{minHeight:'100vh',background:'linear-gradient(135deg,#4B006E,#2d0042,#1a0030)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}},
    h('div',{className:'card register-card'},
      h('div',{style:{textAlign:'center',marginBottom:'1.5rem'}},
        h('img',{src:'/static/logo.png',alt:'logo',style:{height:'3.5rem',borderRadius:'.75rem',marginBottom:'.75rem'}}),
        h('h1',{style:{fontSize:'1.5rem',fontWeight:800,color:'#1a0030'}},'Create Account')
      ),
      h('form',{onSubmit:submit},
        h('div',{className:'grid2',style:{gap:'.875rem'}},
          fld('Full Name *',     inp(form.full_name,sf('full_name'),{placeholder:'First Middle Last',required:true})),
          fld('Employee ID *',   inp(form.employee_id,sf('employee_id'),{placeholder:'EMP-001',required:true})),
          h('div',{className:'span2'}, fld('CSB Email *', inp(form.email,sf('email'),{type:'email',placeholder:'you@csb.com',required:true}))),
          h('div',{className:'span2'}, fld('Password *',  inp(form.password,sf('password'),{type:'password',placeholder:'Min 6 chars',required:true,minLength:6}))),
          fld('Role *',   sel(form.role,sf('role'),   [['SA'],['ASH'],['RSH'],['SH'],['Admin']])),
          fld('Agency *', sel(form.agency,sf('agency'),[['DEPED'],['BEYOND_DEPED'],['PENSION']],{disabled:form.role==='Admin'})),
          h('div',{className:'span2'}, fld('Region *',
            h('select',{className:'input',value:form.region_name,onChange:e=>setForm(f=>({...f,region_name:e.target.value,branch_code:'',branch_name:''})),required:true},
              h('option',{value:''},'Select region...'),
              regions.map(r=>h('option',{key:r,value:r},r))
            )
          )),
          fld('Branch Code', h('select',{className:'input',value:form.branch_code,onChange:e=>{
            const b=filtB.find(x=>x.branch_code===e.target.value);
            setForm(f=>({...f,branch_code:e.target.value,branch_name:b?.branch_name||''}));
          }},
            h('option',{value:''},'Select...'),
            filtB.map(b=>h('option',{key:b.branch_code,value:b.branch_code},b.branch_code))
          )),
          fld('Branch Name', inp(form.branch_name,()=>{},{readOnly:true,style:{background:'#f8fafc'}})),
          h('div',{className:'span2'}, fld('Reporting To (email)', inp(form.reports_to,sf('reports_to'),{placeholder:'supervisor@csb.com'}))),
          h('div',{className:'span2'},
            h('button',{className:'btn btn-primary',type:'submit',disabled:loading,style:{width:'100%',padding:'.75rem',fontSize:'1rem'}},
              loading?'Registering...':'Create Account'
            )
          )
        )
      ),
      h('p',{style:{textAlign:'center',fontSize:'.875rem',color:'#64748b',marginTop:'1rem'}},
        'Already registered? ',
        h('a',{href:'#/login',style:{color:'#4B006E',fontWeight:500}},'Sign In')
      )
    )
  );
}

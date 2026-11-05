// ── Login ─────────────────────────────────────────────────────────────────────
function Login() {
  const {login} = useAuth();
  const [email,setEmail]     = useState('');
  const [pass,setPass]       = useState('');
  const [loading,setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try { await login(email,pass); toast.success('Welcome back!'); navigate('/dashboard'); }
    catch(err) { toast.error(err?.response?.data?.error||'Login failed'); }
    finally { setLoading(false); }
  };

  return h('div',{className:'auth-split'},
    // ── Left panel ────────────────────────────────────────────────────────────
    h('div',{className:'auth-left'},
      h('div',{style:{position:'absolute',top:'-4rem',right:'-4rem',width:'18rem',height:'18rem',borderRadius:'50%',background:'rgba(255,255,255,.05)'}}),
      h('div',{style:{position:'absolute',bottom:'-5rem',left:'-5rem',width:'22rem',height:'22rem',borderRadius:'50%',background:'rgba(255,255,255,.04)'}}),
      h('div',{className:'auth-left-inner'},
        h('img',{src:'/static/logo.png',alt:'Sales Buddy 3.0',className:'auth-logo'}),
        h('h2',{className:'auth-left-title'},'Your sales command center'),
        h('p',{className:'auth-left-sub'},
          'Track leads, monitor targets, and manage activities for City Savings Bank\'s Salary and Pension Loans teams.'
        ),
        h('div',{className:'auth-features'},
          [['circle-check-big','Lead & activity tracking'],
           ['bar-chart-2',     'Performance analytics'],
           ['milestone',       'Branch target management']
          ].map(([icon,txt],i) =>
            h('div',{key:i,className:'auth-feature-row'},
              Icon(icon,16,{color:'#e9d5ff',flexShrink:0}), txt
            )
          )
        )
      ),
      h('p',{className:'auth-left-footer'},'City Savings Bank · Internal Use Only')
    ),

    // ── Right panel ───────────────────────────────────────────────────────────
    h('div',{className:'auth-right'},
      h('div',{className:'auth-form-wrap'},
        h('div',{className:'auth-form-header'},
          h('h1',{className:'auth-form-title'},'Welcome back'),
          h('p',{className:'auth-form-sub'},'Sign in to your account')
        ),
        h('form',{onSubmit:submit,className:'auth-form'},
          h('div',null,
            h('label',{className:'auth-field-label'},'Email'),
            inp(email,setEmail,{type:'email',placeholder:'you@csb.com',required:true,className:'input auth-input'})
          ),
          h('div',null,
            h('label',{className:'auth-field-label'},'Password'),
            inp(pass,setPass,{type:'password',placeholder:'••••••••',required:true,className:'input auth-input'})
          ),
          h('button',{className:'btn btn-primary auth-submit',type:'submit',disabled:loading},
            loading?'Signing in…':'Sign In'
          )
        ),
        h('div',{className:'auth-demo-box'},
          h('div',{className:'auth-demo-title'},'Demo accounts'),
          h('div',null,'admin@csb.com / Admin@123'),
          h('div',null,'ash@csb.com / Ash@1234'),
          h('div',null,'sa1@csb.com / Sa@12345')
        ),
        h('p',{className:'auth-switch'},
          "Don't have an account? ",
          h('a',{href:'#/register',style:{color:'#4B006E',fontWeight:600}},'Register')
        )
      )
    )
  );
}

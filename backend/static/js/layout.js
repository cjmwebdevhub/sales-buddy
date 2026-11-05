// ── Navigation config ─────────────────────────────────────────────────────────
const NAV = [
  {path:'/dashboard',    icon:'layout-dashboard', label:'Dashboard',    roles:['SA','ASH','RSH','SH','Admin']},
  {path:'/customers',    icon:'users',            label:'Customers',    roles:['SA','ASH','RSH','SH','Admin']},
  {path:'/activities',   icon:'clipboard-list',   label:'Activities',   roles:['SA','ASH','RSH','SH','Admin']},
  {path:'/calendar',     icon:'calendar-days',    label:'Calendar',     roles:['SA','ASH','RSH','SH','Admin']},
  {path:'/targets',      icon:'target',           label:'Targets',      roles:['SA','ASH','RSH','SH','Admin']},
  {path:'/target-shares',icon:'trending-up',      label:'Target Shares',roles:['ASH','RSH','SH','Admin']},
  {path:'/daily-lr',     icon:'banknote',         label:'Daily LR',     roles:['ASH','RSH','SH','Admin']},
  {path:'/assign',       icon:'git-branch',       label:'Assign Leads', roles:['ASH','RSH','SH','Admin']},
  {path:'/uploads',      icon:'upload-cloud',     label:'Uploads',      roles:['Admin']},
  {path:'/promos',       icon:'tag',              label:'Promos',       roles:['SA','ASH','RSH','SH','Admin']},
  {path:'/users',        icon:'user-cog',         label:'Users',        roles:['ASH','RSH','SH','Admin']},
];

// ── Layout ────────────────────────────────────────────────────────────────────
function Layout({page}) {
  const {user,logout}          = useAuth();
  const [collapsed,setCollapsed] = useState(false);
  const [mobileOpen,setMobileOpen] = useState(false);
  const route                  = useRoute();
  const visible                = NAV.filter(n=>n.roles.includes(user?.role));

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false); }, [route]);

  return h('div',{className:'app-shell'},

    // ── Sidebar (desktop) ─────────────────────────────────────────────────────
    h('aside',{className:`sidebar${collapsed?' collapsed':''}${mobileOpen?' mobile-open':''}`},
      h('div',{className:'sidebar-brand'},
        h('img',{src:'/static/logo.png',alt:'logo',className:'sidebar-logo'}),
        !collapsed && h('span',{className:'sidebar-brand-name'},'Sales Buddy 3.0')
      ),
      h('nav',{className:'sidebar-nav'},
        visible.map(n =>
          h('button',{
            key:n.path,
            className:`sidebar-link${route===n.path?' active':''}`,
            onClick:()=>navigate(n.path)
          },
            Icon(n.icon, 18, {flexShrink:0}),
            !collapsed && h('span',{style:{whiteSpace:'nowrap'}},n.label)
          )
        )
      ),
      h('div',{className:'sidebar-bottom'},
        h('button',{
          className:`sidebar-link${route==='/profile'?' active':''}`,
          onClick:()=>navigate('/profile')
        },
          Icon('settings',18,{flexShrink:0}),
          !collapsed && h('span',null,'Profile')
        ),
        h('button',{className:'sidebar-link',onClick:()=>{logout();navigate('/login');}},
          Icon('log-out',18,{flexShrink:0}),
          !collapsed && h('span',null,'Logout')
        )
      )
    ),

    // ── Mobile overlay ────────────────────────────────────────────────────────
    mobileOpen && h('div',{className:'sidebar-overlay',onClick:()=>setMobileOpen(false)}),

    // ── Main content area ─────────────────────────────────────────────────────
    h('div',{className:'main-area'},
      h('header',{className:'topbar'},
        h('button',{
          className:'topbar-menu-btn',
          onClick:()=>{ setCollapsed(!collapsed); setMobileOpen(!mobileOpen); }
        },'☰'),
        h('div',{className:'topbar-user'},
          h('div',{className:'topbar-user-info'},
            h('div',{className:'topbar-user-name'},user?.full_name),
            h('div',{className:'topbar-user-role'},user?.role+' · '+user?.agency)
          ),
          h('div',{className:'topbar-avatar'},user?.full_name?.charAt(0)||'U')
        )
      ),
      h('main',{className:'page-content'},page)
    ),

    // ── Bottom tab bar (mobile) ───────────────────────────────────────────────
    h('nav',{className:'mobile-tabbar'},
      visible.slice(0,5).map(n =>
        h('button',{
          key:n.path,
          className:`mobile-tab${route===n.path?' active':''}`,
          onClick:()=>navigate(n.path)
        },
          Icon(n.icon, 20),
          h('span',{className:'mobile-tab-label'},n.label)
        )
      )
    )
  );
}

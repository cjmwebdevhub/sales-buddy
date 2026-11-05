// ── Landing Page (redesigned public homepage) ─────────────────────────────────
function Landing() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString('en-PH', {weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const timeStr = now.toLocaleTimeString('en-PH', {hour:'2-digit',minute:'2-digit',second:'2-digit'});

  const features = [
    ['users',       'Lead Management',        'Register & track leads across DepEd, Beyond DepEd, and Pension sectors.'],
    ['clipboard-list','Activity Tracking',    'Log field engagements, calls, visits and monitor real-time statuses.'],
    ['target',      'Performance Analytics',  'Track targets, attainments, and productivity by branch or region.'],
    ['upload-cloud','Data Uploads',           'Bulk import MOB, LCS, Daily LR, and DepEd reloan data via CSV.'],
    ['tag',         'Promos',                 'Manage and broadcast active promotional offers per agency.'],
    ['calendar-days','Calendar',              'Visualise your activities on a monthly calendar at a glance.'],
  ];

  const roles = [
    ['SA',    'Sales Associate',        'Logs customers & activities, views own targets.'],
    ['ASH',   'Area Sales Head',        'Oversees SA performance within an area.'],
    ['RSH',   'Regional Sales Head',    'Monitors multiple areas, manages target shares.'],
    ['SH',    'Sales Head',             'Full visibility across regions and branches.'],
    ['Admin', 'Administrator',          'Manages uploads, users, promos, and system config.'],
  ];

  return h('div',{className:'landing-root'},

    // ── Hero ───────────────────────────────────────────────────────────────────
    h('section',{className:'landing-hero'},
      h('div',{className:'landing-hero-inner'},
        h('img',{src:'/static/logo.png',alt:'Sales Buddy 3.0',className:'landing-logo'}),
        h('h1',{className:'landing-headline'},'Sales Buddy 3.0'),
        h('p',{className:'landing-tagline'},
          'All-in-one sales management platform for City Savings Bank\'s Salary and Pension Loans teams.'
        ),
        h('div',{className:'landing-datetime'},
          h('span',null,dateStr),
          h('span',{className:'landing-time'},timeStr)
        ),
        h('div',{className:'landing-ctas'},
          h('button',{className:'btn btn-primary landing-cta-primary',onClick:()=>navigate('/login')},'Sign In'),
          h('button',{className:'btn landing-cta-ghost',onClick:()=>navigate('/register')},'Register')
        )
      )
    ),

    // ── Features ───────────────────────────────────────────────────────────────
    h('section',{className:'landing-section'},
      h('h2',{className:'landing-section-title'},'What you can do'),
      h('div',{className:'landing-features-grid'},
        features.map(([icon,title,desc],i) =>
          h('div',{key:i,className:'landing-feature-card'},
            h('div',{className:'landing-feature-icon'},Icon(icon,28,{color:'#4B006E'})),
            h('div',{className:'landing-feature-title'},title),
            h('p',{className:'landing-feature-desc'},desc)
          )
        )
      )
    ),

    // ── Who it's for ───────────────────────────────────────────────────────────
    h('section',{className:'landing-section landing-section-alt'},
      h('h2',{className:'landing-section-title'},'Who it\'s for'),
      h('div',{className:'landing-roles-grid'},
        roles.map(([role,label,desc],i) =>
          h('div',{key:i,className:'landing-role-card'},
            h('div',{className:'landing-role-badge'},role),
            h('div',{className:'landing-role-label'},label),
            h('p',{className:'landing-role-desc'},desc)
          )
        )
      )
    ),

    // ── Footer ─────────────────────────────────────────────────────────────────
    h('footer',{className:'landing-footer'},
      h('div',{className:'landing-footer-inner'},
        h('img',{src:'/static/logo.png',alt:'CSB',className:'landing-footer-logo'}),
        h('div',null,
          h('div',{className:'landing-footer-brand'},'City Savings Bank'),
          h('div',{className:'landing-footer-sub'},'Internal Use Only · Sales Buddy 3.0')
        )
      )
    )
  );
}

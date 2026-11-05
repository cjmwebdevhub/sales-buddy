// ── Globals from React ────────────────────────────────────────────────────────
const {createElement:h,useState,useEffect,useCallback,createContext,useContext,useRef,Fragment} = React;
const {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend} = Recharts;

// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  window._showToast = (msg, type='success') => {
    const id = Date.now();
    setToasts(t => [...t, {id,msg,type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return h('div',{className:'toast-wrap'},
    toasts.map(t => h('div',{key:t.id,className:`toast toast-${t.type}`},t.msg))
  );
}
const toast = {
  success: m => window._showToast?.(m,'success'),
  error:   m => window._showToast?.(m,'error'),
};

// ── Router ────────────────────────────────────────────────────────────────────
function useRoute() {
  const [hash, setHash] = useState(window.location.hash || '#/');
  useEffect(() => {
    const fn = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return hash.replace('#','') || '/';
}
const navigate = path => { window.location.hash = '#' + path; };

// ── Helpers ───────────────────────────────────────────────────────────────────
const el  = (tag, props, ...kids) => h(tag, props, ...kids);
const inp = (val, onChange, extra={}) => h('input', {className:'input', value:val, onChange:e=>onChange(e.target.value), ...extra});
const sel = (val, onChange, opts, extra={}) => h('select', {className:'input', value:val, onChange:e=>onChange(e.target.value), ...extra},
  opts.map(([v,l]) => h('option',{key:v,value:v},l||v))
);
const btn  = (label, onClick, cls='btn btn-primary', extra={}) => h('button',{className:cls,onClick,...extra},label);
const lbl  = txt => h('label',{className:'label'},txt);
const fld  = (label, child) => h('div',null, lbl(label), child);

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({open, onClose, title, children, maxWidth='36rem'}) {
  if (!open) return null;
  return h('div',{className:'modal-bg',onClick:e=>e.target===e.currentTarget&&onClose()},
    h('div',{className:'modal-box',style:{maxWidth}},
      h('div',{className:'modal-hd'},
        h('h2',{style:{fontSize:'1.125rem',fontWeight:600}},title),
        h('button',{onClick:onClose,style:{background:'none',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'#94a3b8',lineHeight:1}},'×')
      ),
      h('div',{className:'modal-bd'},children)
    )
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({status}) {
  const cls = status==='Done' ? 'status-done' : status==='Pending' ? 'status-pending' : 'status-call-again';
  return h('span',{className:cls},status);
}

// ── Gauge ─────────────────────────────────────────────────────────────────────
function Gauge({label, val, max}) {
  const pct = max > 0 ? Math.min(100,(val/max)*100) : 0;
  const col = pct>=100?'#10b981':pct>=75?'#3b82f6':pct>=50?'#f59e0b':'#ef4444';
  return h('div',{className:'gauge-wrap'},
    h('div',{style:{display:'flex',justifyContent:'space-between',fontSize:'.75rem',color:'#64748b',marginBottom:'.375rem'}},
      h('span',null,label), h('span',{style:{fontWeight:600}},pct.toFixed(1)+'%')
    ),
    h('div',{className:'gauge-bar'},h('div',{className:'gauge-fill',style:{width:`${pct}%`,background:col}})),
    h('div',{style:{display:'flex',justifyContent:'space-between',fontSize:'.75rem',color:'#94a3b8',marginTop:'.25rem'}},
      h('span',null,'₱'+Number(val).toLocaleString()), h('span',null,'₱'+Number(max).toLocaleString())
    )
  );
}

// ── Icon (inline SVG) ─────────────────────────────────────────────────────────
const ICONS = {
  'layout-dashboard': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  'users':            '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'clipboard-list':   '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  'calendar-days':    '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/>',
  'target':           '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  'trending-up':      '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'banknote':         '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  'git-branch':       '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  'upload-cloud':     '<polyline points="16 16 12 12 8 16"/><line x1="12" x2="12" y1="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>',
  'tag':              '<path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>',
  'user-cog':         '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/><circle cx="19" cy="18" r="3"/><path d="m21.7 16.4-.9.4"/><path d="m17.2 19.2-.9.4"/><path d="m16.3 16.4.9.4"/><path d="m20.8 19.2.9.4"/><path d="m19 15v1"/><path d="m19 21v1"/><path d="m22 18h-1"/><path d="m16 18h-1"/>',
  'settings':         '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'log-out':          '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  'circle-check-big': '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
  'clock':            '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'bar-chart-2':      '<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>',
  'triangle-alert':   '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
  'file-spreadsheet': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
  'alert-triangle':   '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
  'school':           '<path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10"/><path d="M18 5v17"/><path d="M6 5v17"/><path d="m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6"/><rect x="9" y="12" width="6" height="5" rx="1"/>',
  'file-text':        '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
  'loader':           '<line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/><line x1="4.93" x2="7.76" y1="4.93" y2="7.76"/><line x1="16.24" x2="19.07" y1="16.24" y2="19.07"/><line x1="2" x2="6" y1="12" y2="12"/><line x1="18" x2="22" y1="12" y2="12"/><line x1="4.93" x2="7.76" y1="19.07" y2="16.24"/><line x1="16.24" x2="19.07" y1="7.76" y2="4.93"/>',
  'circle-x':         '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  'milestone':        '<path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5z"/><path d="M12 13v8"/><path d="M12 2v4"/>',
};
const Icon = (name, size=16, style={}) => {
  const d = ICONS[name] || '<circle cx="12" cy="12" r="10"/>';
  return h('svg', {
    xmlns:'http://www.w3.org/2000/svg', width:size, height:size,
    viewBox:'0 0 24 24', fill:'none', stroke:'currentColor',
    strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round',
    style:{display:'inline-block',flexShrink:0,verticalAlign:'middle',...style},
    dangerouslySetInnerHTML:{__html:d}
  });
};

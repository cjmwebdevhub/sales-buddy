// ── App Router ────────────────────────────────────────────────────────────────
function AppContent() {
  const {user} = useAuth();
  const route  = useRoute();

  if (!user) {
    if (route==='/register') return h(Register,null);
    if (route==='/login')    return h(Login,null);
    if (route==='/')         return h(Landing,null);
    return h(Login,null);
  }

  const getPage = () => {
    if (route==='/dashboard')           return h(Dashboard,null);
    if (route==='/customers')           return h(Customers,null);
    if (route.startsWith('/customers/')) return h(CustomerDetail,{id:route.split('/')[2]});
    if (route==='/activities')          return h(Activities,null);
    if (route==='/calendar')            return h(ActivityCalendar,null);
    if (route==='/targets')             return h(Targets,null);
    if (route==='/target-shares')       return h(TargetShares,null);
    if (route==='/daily-lr')            return h(DailyLR,null);
    if (route==='/assign')              return h(Assign,null);
    if (route==='/uploads')             return h(Uploads,null);
    if (route==='/promos')              return h(Promos,null);
    if (route==='/users')               return h(Users,null);
    if (route==='/profile')             return h(Profile,null);
    return h(Dashboard,null);
  };

  return h(Layout,{page:getPage()});
}

function App() {
  return h(AuthProvider,null, h(ToastContainer,null), h(AppContent,null));
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(App,null));

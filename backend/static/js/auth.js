// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = '';
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

// ── Auth Context ──────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);

function AuthProvider({children}) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const apiFetch = useCallback(async (path, opts={}) => {
    const token = localStorage.getItem('token');
    const isForm = opts.body instanceof FormData;
    const headers = isForm ? {} : {'Content-Type':'application/json'};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api' + path, {...opts, headers:{...headers,...(opts.headers||{})}});
    if (res.status === 401) { localStorage.clear(); setUser(null); navigate('/login'); }
    const data = await res.json();
    if (!res.ok) throw {response:{data}};
    return data;
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', {method:'POST', body:JSON.stringify({email,password})});
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (form) => {
    const data = await apiFetch('/auth/register', {method:'POST', body:JSON.stringify(form)});
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => { localStorage.clear(); setUser(null); };

  const refreshUser = async () => {
    try {
      const u = await apiFetch('/users/me');
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
    } catch {}
  };

  return h(AuthCtx.Provider, {value:{user,login,register,logout,refreshUser,apiFetch}}, children);
}

const useAuth = () => useContext(AuthCtx);

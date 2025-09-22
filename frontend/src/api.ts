const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";
export async function login(username: string, password: string){
  const r = await fetch(`${API_BASE}/auth/login`,{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username, password})
  });
  if(!r.ok) throw new Error('Login failed');
  return r.json(); // {token}
}

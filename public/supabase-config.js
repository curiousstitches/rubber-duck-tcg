// ============================================================
//  🔑  YOUR SUPABASE KEYS
//  Paste the two values from your Supabase dashboard here.
//  Dashboard → Project Settings → API
//
//  These two are SAFE to be public — that's what they're for.
//  Never paste the "service_role" key here.
// ============================================================

const SUPABASE_URL      = "https://gjqmasubbczbpvrzbdfl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqcW1hc3ViYmN6YnB2cnpiZGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NDg1NTcsImV4cCI6MjEwMTAyNDU1N30.wR0SkguKoqsQEhc7ertxV4a9aM2JrVG2gI7gnhEv3Fo";
// ============================================================
//  🔒  SHARED CLIENT — every page (login, hub, game, ducknet,
//  ducksave) MUST create its Supabase client through getDuckClient()
//  instead of calling supabase.createClient() directly. That's what
//  makes "Remember me" work: all of them then agree on whether the
//  session token lives in localStorage (survives closing the browser)
//  or sessionStorage (gone once the tab/browser closes).
// ============================================================
const DUCK_REMEMBER_KEY = 'duck_remember_me';

function duckRememberMe(){
  try { return localStorage.getItem(DUCK_REMEMBER_KEY) !== '0'; }
  catch(e){ return true; }
}
function duckSetRememberMe(on){
  try { localStorage.setItem(DUCK_REMEMBER_KEY, on ? '1' : '0'); }
  catch(e){}
}
// storage adapter Supabase calls into — it decides localStorage vs
// sessionStorage fresh on every read/write, based on the flag above,
// so flipping the checkbox before signing in is all it takes.
const duckAuthStorage = {
  getItem:    k    => (duckRememberMe() ? localStorage : sessionStorage).getItem(k),
  setItem:    (k,v)=> (duckRememberMe() ? localStorage : sessionStorage).setItem(k,v),
  removeItem: k    => (duckRememberMe() ? localStorage : sessionStorage).removeItem(k),
};

let _duckClient = null;
function getDuckClient(){
  if(_duckClient) return _duckClient;
  if(typeof supabase === 'undefined' || typeof SUPABASE_URL === 'undefined' ||
     !SUPABASE_URL || SUPABASE_URL.indexOf('PASTE') !== -1) return null;
  _duckClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storage: duckAuthStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return _duckClient;
}

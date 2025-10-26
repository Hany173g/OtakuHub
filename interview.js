/**
 * create_blog_test_no_bearer.js
 * Local test script (Node 18+)
 * - register users -> login -> create blog
 * - IMPORTANT: Authorization header sends token BY ITSELF (no "Bearer ")
 *
 * Run: node create_blog_test_no_bearer.js
 */

const BASE_API = 'http://localhost:5000';      // backend base
const AUTH_BASE = `${BASE_API}/api/auth`;      // register, login
const CREATE_BLOG = `${BASE_API}/api/createBlog`;  // blog route
const NUM_USERS = 10;                          // عدد المستخدمين التجريبيين
const PASSWORD = 'Test@1234';                  // باس ثابت للاختبار
const MIN_DELAY_MS = 120;
const MAX_DELAY_MS = 450;

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// helper fetch with retry
async function doFetch(url, opts = {}, retries = 2) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch (e) { body = text; }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    if (retries > 0) return doFetch(url, opts, retries - 1);
    return { ok: false, status: 0, body: err.message };
  }
}

function randomName(i) {
  const first = ['Ahmed','Mohamed','Mona','Sara','Hany','Nada','Khaled','Laila','Omar','Yara'];
  const last = ['Ali','Hassan','Ibrahim','Sayed','Mahmoud','Fathy','Zaki','Karim','Mostafa','Nabil'];
  return `${first[i % first.length]} ${last[(i + 3) % last.length]}`;
}
function randomEmail(name, idx) {
  return name.toLowerCase().replace(/\s+/g,'') + idx + '@example.test';
}

async function registerUser(name, email, password) {
  await sleep(randInt(MIN_DELAY_MS, MAX_DELAY_MS));
  return doFetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: name, email, password })
  });
}

async function loginUser(email, password) {
  await sleep(randInt(MIN_DELAY_MS, MAX_DELAY_MS));
  return doFetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
}

// createBlog: sends JSON { title, content }
// IMPORTANT: Authorization header = token (no "Bearer ")
async function createBlog(token, title, content) {
  await sleep(randInt(MIN_DELAY_MS, MAX_DELAY_MS));
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = token; // <<-- token only, as requested
  return doFetch(CREATE_BLOG, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, content })
  });
}

(async function main() {
  console.log('== START createBlog test (no Bearer) ==');
  const users = [];

  // 1) create users
  for (let i = 0; i < NUM_USERS; i++) {
    const name = randomName(i);
    const email = randomEmail(name, i);
    const reg = await registerUser(name, email, PASSWORD);
    if (reg.ok) {
      const id = (reg.body && (reg.body.id || reg.body._id || reg.body.userId)) || email;
      users.push({ username: name, email, id });
      console.log(`[REGISTER] ${email} ✅ id:${id}`);
    } else {
      console.warn(`[REGISTER FAIL] ${email} ❌ status:${reg.status} body:${JSON.stringify(reg.body)}`);
      // Add anyway to try login (maybe user existed)
      users.push({ username: name, email, id: email });
    }
  }

  // 2) login and collect token
  for (const u of users) {
    const L = await loginUser(u.email, PASSWORD);
    if (L.ok) {
      // try common token fields
      const token = (L.body && (L.body.token || L.body.accessToken || L.body.jwt || (L.body.data && (L.body.data.token || L.body.data.accessToken)))) || null;
      u.token = token;
      // update id if returned
      const returnedId = (L.body && (L.body.id || L.body._id || (L.body.user && (L.body.user.id || L.body.user._id)))) || u.id;
      u.id = returnedId;
      console.log(`[LOGIN] ${u.email} ✅ token:${token ? 'YES' : 'NO'} id:${u.id}`);
    } else {
      console.warn(`[LOGIN FAIL] ${u.email} ❌ status:${L.status} body:${JSON.stringify(L.body)}`);
      u.token = null;
    }
    await sleep(randInt(60, 180));
  }

  // 3) create blogs using token in Authorization header (token only)
  const results = [];
  for (const u of users) {
    const title = `تست بلوق - ${u.username} - ${new Date().toISOString()}`;
    const content = `هذا محتوى تجريبي مُولد آلياً بواسطة سكربت الاختبار للمستخدم ${u.username}.`;
    const res = await createBlog(u.token, title, content);
    if (res.ok) {
      console.log(`[CREATE-BLOG] ${u.email} ✅ status:${res.status}`);
      results.push({ email: u.email, ok: true, status: res.status, body: res.body });
    } else {
      console.warn(`[CREATE-BLOG FAIL] ${u.email} ❌ status:${res.status} body:${JSON.stringify(res.body)}`);
      results.push({ email: u.email, ok: false, status: res.status, body: res.body });
    }
    await sleep(randInt(80, 220));
  }

  // Summary
  const okCount = results.filter(r => r.ok).length;
  console.log('== SUMMARY ==');
  console.log(`Total users: ${users.length}`);
  console.log(`Blogs created: ${okCount}`);
  console.table(results.map(r => ({ email: r.email, ok: r.ok, status: r.status })));
  console.log('== DONE ==');
})();

# 🛡️ Project Architecture – Important Constraints for AI Agents

This project uses **Firebase Authentication** for auth and **Supabase** for database and file storage. There is a crucial architectural rule that must always be followed when generating, editing, or reviewing code:

---

## 🔒 Data Access Architecture

- ✅ All Supabase operations (reads and writes to the database or storage) **must use the Supabase Service Role key**.
- ❌ Supabase client-side SDK with Row-Level Security (RLS) **must NOT be used**.
- ❌ Do NOT use `supabase.auth` or any auth-sensitive operations on the browser.

---

## 🔑 Service Role Key Usage

- The Supabase **Service Role key is securely handled on the backend**.
- All Supabase operations should be done **from server-side functions, API routes, or protected server environments** using the service role.
- This enables full control over access and bypasses RLS, which is disabled/not used in this project.

---

## 🧠 AI Agent Behavior Guidelines

1. **Never generate code** that uses the Supabase JS client (`createClient`) in the browser with RLS.
2. **Always prefer server-side code** using the service role key for Supabase interactions.
3. When writing code that reads/writes data from/to Supabase:
   - Wrap it in a secure API route or backend handler.
   - Authenticate the request using Firebase Auth.
   - Validate access manually if needed.
4. Do not assume that Supabase is managing permissions via RLS—**it is not**.
5. Avoid code that relies on `supabase.auth.getUser()` or client `session`.

---

## ✅ Example Patterns

✅ Correct (using service role securely on server):

```ts
// Inside server-side code or API route
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await supabase.from('songs').insert([...]);
```
❌ Wrong (exposes DB from client):

```ts
// This is NOT allowed
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
await supabase.from('songs').insert([...]); // ❌ Violates access rules
```
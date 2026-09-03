/* Yangu web chat embed. Usage: <script src=".../yangu-webchat.js" data-channel-id="..." async></script> */
(() => {
  const script = document.currentScript;
  if (!script) return;
  const channelId = script.dataset.channelId;
  const endpoint = script.dataset.endpoint || `https://${script.dataset.project || "xcipuyvcwfytlsjryhvs"}.supabase.co/functions/v1/webchat`;
  if (!channelId) return;

  const storageKey = `yangu-webchat-${channelId}`;
  const visitorKey = localStorage.getItem(storageKey) || crypto.randomUUID();
  localStorage.setItem(storageKey, visitorKey);
  const shadow = document.createElement("div");
  shadow.id = "yangu-webchat-root";
  document.body.appendChild(shadow);
  const root = shadow.attachShadow ? shadow.attachShadow({ mode: "open" }) : shadow;
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .launcher { position: fixed; right: 20px; bottom: 20px; z-index: 2147483000; border: 0; border-radius: 12px; padding: 13px 17px; color: #fff; background: #152a20; box-shadow: 0 10px 30px rgba(0,0,0,.24); cursor: pointer; font: 600 14px system-ui,sans-serif; }
    .panel { position: fixed; right: 20px; bottom: 78px; z-index: 2147483000; width: min(360px, calc(100vw - 32px)); height: min(540px, calc(100vh - 110px)); display: none; overflow: hidden; border: 1px solid rgba(255,255,255,.16); border-radius: 14px; background: #101512; color: #f6faf6; box-shadow: 0 18px 60px rgba(0,0,0,.35); font: 14px system-ui,sans-serif; }
    .panel.open { display: flex; flex-direction: column; }
    .head { padding: 16px; background: linear-gradient(135deg,#152a20,#9b4d20); display:flex; justify-content:space-between; align-items:center; }
    .head strong { font-size: 15px; } .close { background: transparent; color: inherit; border:0; font-size:20px; cursor:pointer; }
    .messages { flex: 1; overflow:auto; padding: 14px; display:flex; flex-direction:column; gap:9px; }
    .bubble { max-width: 84%; white-space: pre-wrap; line-height:1.4; padding:9px 11px; border-radius:10px; }
    .customer { align-self:flex-end; background:#d96828; color:#fff; } .agent { align-self:flex-start; background:#202b24; color:#f6faf6; }
    .form { display:flex; gap:8px; padding:10px; border-top:1px solid rgba(255,255,255,.12); } .input { flex:1; min-width:0; resize:none; border:1px solid rgba(255,255,255,.18); border-radius:9px; padding:10px; color:inherit; background:#17201a; font:inherit; } .send { width:42px; border:0; border-radius:9px; color:#fff; background:#d96828; cursor:pointer; }
    .status { padding:0 14px 8px; color:#aebbb1; font-size:12px; }
  `;
  root.appendChild(style);
  const button = document.createElement("button"); button.className = "launcher"; button.textContent = "Chat with us";
  const panel = document.createElement("section"); panel.className = "panel";
  panel.innerHTML = `<div class="head"><strong>Chat with us</strong><button class="close" aria-label="Close">×</button></div><div class="messages"></div><div class="status"></div><form class="form"><textarea class="input" rows="1" placeholder="Write a message…"></textarea><button class="send" aria-label="Send">↑</button></form>`;
  root.append(button, panel);
  const messages = panel.querySelector(".messages"); const status = panel.querySelector(".status"); const form = panel.querySelector(".form"); const input = panel.querySelector(".input");
  let token = null; let lastAt = new Date(0).toISOString(); let opened = false; let polling = false;
  const add = (role, text, at) => { const el = document.createElement("div"); el.className = `bubble ${role === "customer" ? "customer" : "agent"}`; el.textContent = text; messages.appendChild(el); messages.scrollTop = messages.scrollHeight; if (at) lastAt = at; };
  async function api(body) { const res = await fetch(endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || data.error || "Chat unavailable"); return data; }
  async function start() { if (token) return; status.textContent = "Connecting…"; try { const data = await api({ action:"session", channelId, visitorKey }); token = data.token; if (data.greeting) add("agent", data.greeting, new Date().toISOString()); status.textContent = ""; poll(); } catch (e) { status.textContent = e.message; } }
  async function poll() { if (!token || polling) return; polling = true; try { const data = await api({ action:"poll", token, since:lastAt }); (data.messages || []).forEach(m => { if (m.at > lastAt && m.role !== "customer") add(m.role, m.text, m.at); }); } catch (_) {} finally { polling = false; if (opened) setTimeout(poll, 5000); } }
  button.onclick = () => { opened = !opened; panel.classList.toggle("open", opened); if (opened) { start(); input.focus(); } };
  panel.querySelector(".close").onclick = () => { opened = false; panel.classList.remove("open"); };
  form.onsubmit = async (event) => { event.preventDefault(); const text = input.value.trim(); if (!text || !token) return; add("customer", text, new Date().toISOString()); input.value = ""; status.textContent = "Typing…"; try { const data = await api({ action:"message", token, text }); if (data.reply) add("agent", data.reply, data.at); if (data.handover) status.textContent = "A team member will follow up."; else status.textContent = ""; } catch (e) { status.textContent = e.message; } };
})();

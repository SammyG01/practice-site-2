/**
 * Bella's Bakery chat widget.
 * Loads on the page via: <script src="/widget.js"></script>
 * Talks to the function at /.netlify/functions/chat automatically (same site).
 */
(function () {
  const ENDPOINT = "/.netlify/functions/chat";
  let conversation = [];

  const style = document.createElement("style");
  style.textContent = `
    #bbchat-root { position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: "Nunito", -apple-system, sans-serif; }
    #bbchat-toggle {
      width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;
      background: #C2255C; color: white; font-size: 26px; box-shadow: 0 4px 14px rgba(59,34,24,0.35);
      display: flex; align-items: center; justify-content: center;
    }
    #bbchat-panel {
      position: absolute; bottom: 76px; right: 0; width: 330px; max-width: 88vw; height: 440px;
      background: #FFF3F6; border-radius: 18px; box-shadow: 0 10px 40px rgba(59,34,24,0.3);
      display: none; flex-direction: column; overflow: hidden; border: 2px solid #F8C9D6;
    }
    #bbchat-panel.open { display: flex; }
    #bbchat-header { background: #3B2218; color: #FFF3F6; padding: 14px 16px; font-weight: 800; font-size: 15px; }
    #bbchat-messages { flex: 1; overflow-y: auto; padding: 14px; }
    .bbchat-msg { margin-bottom: 10px; display: flex; }
    .bbchat-msg.user { justify-content: flex-end; }
    .bbchat-bubble { max-width: 80%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; }
    .bbchat-msg.user .bbchat-bubble { background: #C2255C; color: white; border-bottom-right-radius: 4px; }
    .bbchat-msg.assistant .bbchat-bubble { background: #fff; color: #3B2218; border: 2px solid #F8C9D6; border-bottom-left-radius: 4px; }
    #bbchat-inputbar { display: flex; border-top: 2px solid #F8C9D6; padding: 8px; gap: 6px; background: #fff; }
    #bbchat-input { flex: 1; border: 2px solid #F8C9D6; border-radius: 20px; padding: 9px 14px; font-size: 14px; outline: none; }
    #bbchat-input:focus { border-color: #C2255C; }
    #bbchat-send { background: #C2255C; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; font-size: 16px; flex-shrink: 0; }
    #bbchat-send:disabled { opacity: 0.5; }
    .bbchat-typing { font-size: 13px; color: #6B4A3C; padding: 4px 0 0 4px; }
  `;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "bbchat-root";
  root.innerHTML = `
    <div id="bbchat-panel">
      <div id="bbchat-header">Chat with Bella's Bakery</div>
      <div id="bbchat-messages"></div>
      <div id="bbchat-inputbar">
        <input id="bbchat-input" type="text" placeholder="Ask about our menu, hours, delivery..." />
        <button id="bbchat-send">➤</button>
      </div>
    </div>
    <button id="bbchat-toggle" aria-label="Open chat">💬</button>
  `;
  document.body.appendChild(root);

  const panel = root.querySelector("#bbchat-panel");
  const toggle = root.querySelector("#bbchat-toggle");
  const messagesEl = root.querySelector("#bbchat-messages");
  const input = root.querySelector("#bbchat-input");
  const sendBtn = root.querySelector("#bbchat-send");

  toggle.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open") && conversation.length === 0) {
      addMessage("assistant", "Hi! I'm Bella's Bakery's assistant. Ask me about our menu, hours, or delivery.");
    }
  });

  function addMessage(role, text) {
    const wrap = document.createElement("div");
    wrap.className = `bbchat-msg ${role}`;
    wrap.innerHTML = `<div class="bbchat-bubble"></div>`;
    wrap.querySelector(".bbchat-bubble").textContent = text;
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setTyping(on) {
    let el = messagesEl.querySelector(".bbchat-typing");
    if (on && !el) {
      el = document.createElement("div");
      el.className = "bbchat-typing";
      el.textContent = "Typing...";
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    } else if (!on && el) {
      el.remove();
    }
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    conversation.push({ role: "user", content: text });
    input.value = "";
    sendBtn.disabled = true;
    setTyping(true);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: conversation.slice(0, -1) }),
      });
      const data = await res.json();
      setTyping(false);

      if (!res.ok || data.error) {
        addMessage("assistant", "Sorry, something went wrong. Please try again, or message us directly on WhatsApp.");
        return;
      }

      addMessage("assistant", data.reply);
      conversation.push({ role: "assistant", content: data.reply });
    } catch (err) {
      setTyping(false);
      addMessage("assistant", "Sorry, I couldn't connect. Please try again.");
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
})();

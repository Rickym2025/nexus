/**
 * NexusAI - Chatbot Pilot & Avatar Carousel
 */
const WEBHOOK_CHATBOT = 'https://n8n.rmstudio.app/webhook/chatbot-builder';
const SESSION_KEY = 'nexus_chat_session';

let chatSessionId = sessionStorage.getItem(SESSION_KEY);
if (!chatSessionId) {
  chatSessionId = 'nx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  sessionStorage.setItem(SESSION_KEY, chatSessionId);
}

const isEn = window.location.pathname.includes('/en/');
let chatIsOpen = window.innerWidth > 768;

const QUICK_REPLIES = isEn ? [
  { label: '💬 How does it work?',  text: 'How does NexusAI work in practice?' },
  { label: '💰 Pricing plans?',     text: 'What are the pricing plans and options?' },
  { label: '⚡ Setup time?',        text: 'How long does it take to activate the chatbot?' }
] : [
  { label: '💬 Come funziona?',     text: 'Come funziona NexusAI concretamente?' },
  { label: '💰 Quanto costa?',      text: 'Quali sono i prezzi e i piani disponibili?' },
  { label: '⚡ Quanto ci vuole?',   text: 'Quanto tempo ci vuole per attivare il chatbot?' }
];

const WELCOME_SEQUENCE = isEn ? [
  { text: 'Welcome to the future of conversion. ⚡' },
  { text: 'I am <b>NexusAI</b>: your autonomous sales agent.' },
  { text: 'I can be installed on <b>any website</b> in less than 10 seconds.' },
  { text: 'What would you like to explore today? Choose a question below or write to me. 👇' }
] : [
  { text: 'Benvenuto nel futuro della conversione. ⚡' },
  { text: 'Sono <b>NexusAI</b>: il tuo agente commerciale autonomo.' },
  { text: 'Posso essere installato su <b>qualsiasi sito</b> in meno di 10 secondi.' },
  { text: 'Cosa vuoi scoprire oggi? Scegli una domanda qui sotto o scrivimi. 👇' }
];

const AVATARS = [
  isEn ? "../logo_nexus_bg.png" : "logo_nexus_bg.png",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
];
let currentAvatarIndex = 0;

function startAvatarCycle() {
  const avatarImg = document.getElementById('nx-avatar');
  if (!avatarImg) return;
  setInterval(() => {
    currentAvatarIndex = (currentAvatarIndex + 1) % AVATARS.length;
    avatarImg.style.opacity = '0';
    setTimeout(() => {
      avatarImg.src = AVATARS[currentAvatarIndex];
      avatarImg.style.opacity = '1';
    }, 300);
  }, 4000);
}

function toggleChat() {
  const win = document.getElementById('nx-window');
  chatIsOpen = !chatIsOpen;
  if (chatIsOpen) {
    win.style.display = 'flex';
    win.classList.add('open');
  } else {
    win.style.display = 'none';
    win.classList.remove('open');
  }
}

async function sendNxMsg(textOverride) {
  const input = document.getElementById('nx-input');
  const qrBox = document.getElementById('nx-quick-replies');
  const text = (textOverride || input.value).trim();
  if (!text) return;

  input.value = '';
  if (qrBox) qrBox.innerHTML = '';
  addMsg(text, 'user');

  const loadId = 'typing-send-' + Date.now();
  addMsg('<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>', 'bot', loadId);

  try {
    const res = await fetch(WEBHOOK_CHATBOT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId: chatSessionId,
        strutturaId: isEn ? 'nexus_landing_en' : 'nexus_landing'
      }),
      signal: AbortSignal.timeout(15000)
    });

    const data = await res.json();
    document.getElementById(loadId)?.remove();
    addMsg(data.response || data.output || data.text || "Messaggio ricevuto.", 'bot');
  } catch (err) {
    document.getElementById(loadId)?.remove();
    addMsg(isEn ? "Connection failed. Please retry." : "Connessione non riuscita. Riprova tra poco.", 'bot');
  }
}

function addMsg(text, sender, id) {
  if (!text) return;
  const msgBox = document.getElementById('nx-messages');
  const div = document.createElement('div');
  div.className = 'nx-msg ' + sender;
  if (id) div.id = id;
  div.innerHTML = String(text).replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  msgBox.appendChild(div);
  msgBox.scrollTo({ top: msgBox.scrollHeight, behavior: 'smooth' });
}

function startWelcomeSequence() {
  let i = 0;
  function showNext() {
    if (i >= WELCOME_SEQUENCE.length) {
      renderQuickReplies();
      return;
    }
    const msg = WELCOME_SEQUENCE[i];
    const dotId = 'typing-seq-' + i;
    addMsg('<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>', 'bot', dotId);
    setTimeout(() => {
      document.getElementById(dotId)?.remove();
      addMsg(msg.text, 'bot');
      i++;
      setTimeout(showNext, 2000);
    }, 900);
  }
  showNext();
}

function renderQuickReplies() {
  const qrBox = document.getElementById('nx-quick-replies');
  if (!qrBox) return;
  qrBox.innerHTML = '';
  QUICK_REPLIES.forEach(({ label, text }) => {
    const btn = document.createElement('button');
    btn.className = 'nx-qr';
    btn.textContent = label;
    btn.onclick = () => {
      qrBox.innerHTML = '';
      sendNxMsg(text);
    };
    qrBox.appendChild(btn);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  startAvatarCycle();
  const bubble = document.getElementById('nx-bubble');
  const closeBtn = document.getElementById('nx-close-btn');
  const sendBtn = document.getElementById('nx-send-btn');
  const input = document.getElementById('nx-input');

  if (bubble) bubble.onclick = toggleChat;
  if (closeBtn) closeBtn.onclick = toggleChat;
  if (sendBtn) sendBtn.onclick = () => sendNxMsg();
  if (input) input.onkeydown = e => { if (e.key === 'Enter') sendNxMsg(); };

  if (chatIsOpen) {
    const win = document.getElementById('nx-window');
    win.style.display = 'flex';
    win.classList.add('open');
    startWelcomeSequence();
  }
});

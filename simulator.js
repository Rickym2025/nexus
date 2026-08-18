/**
 * NexusAI - Simulator & Live Demo Generator
 */
const isEnglish = window.location.pathname.includes('/en/');

const SIM_RESPONSES = isEnglish ? {
  prezzi: {
    user: "How do you handle pricing?",
    bot: "NexusAI costs just <b>49€/month</b> for the Base plan. Includes 1 bot, auto-scraping of 10 pages, and full color customization."
  },
  attivazione: {
    user: "Is it hard to set up?",
    bot: "Zero friction. We give you a **single-line HTML script** to paste before `</body>`. Works on WordPress, Shopify, Webflow."
  },
  sicurezza: {
    user: "Is my data secure?",
    bot: "Yes. All databases and hosting reside on secure European infrastructure (**Hetzner & Supabase**) with full GDPR compliance."
  }
} : {
  prezzi: {
    user: "Come gestisci i prezzi?",
    bot: "NexusAI costa solo <b>49€/mese</b> per il piano Base. Include 1 bot, scansione fino a 10 pagine e personalizzazione grafica."
  },
  attivazione: {
    user: "È difficile da attivare?",
    bot: "Zero complicazioni. Ti forniamo un **tag HTML di una riga** da incollare prima della chiusura `</body>`. Funziona su WordPress, Shopify, Webflow."
  },
  sicurezza: {
    user: "I dati sono al sicuro?",
    bot: "Sì. Tutta l'infrastruttura risiede sui server ultra-sicuri ed europei di **Hetzner & Supabase**, garantendo privacy e conformità GDPR."
  }
};

function triggerSim(key) {
  const simBox = document.getElementById('sim-messages');
  const data = SIM_RESPONSES[key];
  if (!data || !simBox) return;

  simBox.innerHTML = `<div class="nx-msg user">${data.user}</div>`;
  const loadDiv = document.createElement('div');
  loadDiv.className = 'nx-msg bot';
  loadDiv.id = 'sim-loading';
  loadDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  simBox.appendChild(loadDiv);

  setTimeout(() => {
    document.getElementById('sim-loading')?.remove();
    const botDiv = document.createElement('div');
    botDiv.className = 'nx-msg bot';
    botDiv.innerHTML = data.bot;
    simBox.appendChild(botDiv);
    simBox.scrollTop = simBox.scrollHeight;
  }, 1000);
}

async function generateDemo() {
  const urlRaw = document.getElementById('site-url').value.trim();
  if (!urlRaw) { document.getElementById('site-url').focus(); return; }

  let url = urlRaw;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  const botId = 'demo_' + Math.random().toString(36).slice(2, 9);
  const submitBtn = document.querySelector('#demo button');
  const originalText = submitBtn.textContent;
  
  submitBtn.disabled = true;
  submitBtn.textContent = isEnglish ? 'Analyzing website (takes 15s)...' : 'Analisi e addestramento AI (richiede 15s)...';

  try {
    const res = await fetch('https://n8n.rmstudio.app/webhook/chatbot-creator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_url: url, bot_id: botId, nome_struttura: 'Demo Client', is_paid: false })
    });
    
    const data = await res.json();
    if (data.success && data.demo_url) {
      const linkEl = document.getElementById('demo-link');
      const resultDiv = document.getElementById('demo-result');
      linkEl.href = data.demo_url;
      linkEl.textContent = data.demo_url;
      resultDiv.classList.remove('hidden');
    } else {
      alert(isEnglish ? "Error during site analysis." : "Errore nell'analisi del sito.");
    }
  } catch(e) {
    alert(isEnglish ? "Server processing... please retry in 5s." : "Il server sta completando l'analisi. Riprova tra 5 secondi.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Live counter ticker
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById('live-count');
  if (!el) return;
  setInterval(() => {
    const delta = Math.floor(Math.random() * 3) - 1; 
    el.textContent = Math.max(230, parseInt(el.textContent) + delta);
  }, 4000);
});

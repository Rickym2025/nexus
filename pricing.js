/**
 * NexusAI - Live Dynamic Pricing Engine & Stripe On-The-Fly
 * RM Studio Universal Engine
 */

const SUPABASE_S2_URL = 'https://jhijfulhntlhcytbhcly.supabase.co';
const SUPABASE_S2_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaWpmdWxobnRsaGN5dGJoY2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzcxODcsImV4cCI6MjA5ODMxMzE4N30.z062NW4ApClll-XWHH2ufmcCleBRNHUUdKO6FiLa0TQ';

// 1. Prezzi di Fallback Immediati (Zero Flicker)
const NEXUS_PRICES = {
    base: { id: 'base', name: 'Base Plan', price: 49, desc: '1 Chatbot attivo, scansione fino a 10 pagine' },
    pro:  { id: 'pro',  name: 'Nexus Pro',  price: 99, desc: '1 Chatbot attivo, raccolta prenotazioni & lead' }
};

// 2. Render Reattivo del DOM
function renderNexusPrices() {
    ['base', 'pro'].forEach(planKey => {
        const plan = NEXUS_PRICES[planKey];
        if (!plan) return;

        const elPrice = document.getElementById(`price-${planKey}-val`);
        if (elPrice) {
            elPrice.textContent = `€${plan.price}`;
        }
    });
}

// 3. Fetch Live da Supabase S2 (Tabella saas_pricing)
async function fetchNexusLivePricing() {
    try {
        const res = await fetch(`${SUPABASE_S2_URL}/rest/v1/saas_pricing?saas=eq.nexus&select=*`, {
            headers: {
                'apikey': SUPABASE_S2_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_S2_ANON_KEY}`
            },
            cache: 'no-store'
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const rows = await res.json();

        if (Array.isArray(rows) && rows.length > 0) {
            rows.forEach(row => {
                const pid = (row.plan_id || '').toLowerCase();
                if (NEXUS_PRICES[pid]) {
                    NEXUS_PRICES[pid].price = Number(row.price);
                    if (row.name) NEXUS_PRICES[pid].name = row.name;
                }
            });
            renderNexusPrices();
        }
    } catch (err) {
        console.warn('Caricamento listino NexusAI da S2 non riuscito, uso fallback locale:', err);
    }
}

// 4. Avvio Checkout Stripe On-The-Fly via n8n
async function avviaCheckoutNexus(planKey, email = '', nome = '') {
    const plan = NEXUS_PRICES[planKey];
    if (!plan) return;

    const payload = {
        progetto: "NexusAI",
        portal_type: "nexus",
        title: `NexusAI • ${plan.name}`,
        price: plan.price,
        ricarica_tipo: planKey,
        email: email || undefined,
        agency_id: email ? `lead_${email}` : "checkout_diretto",
        project_id: email ? `lead_${email}` : "checkout_diretto",
        origin: window.location.origin,
        success_url: `${window.location.origin}/success.html?plan=${planKey}`,
        cancel_url: `${window.location.origin}/#pricing`
    };

    try {
        const res = await fetch('https://n8n.rmstudio.app/webhook/crea-sessione-stripe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Errore durante la creazione della sessione di pagamento Stripe");
        const data = await res.json();
        const redirectUrl = data.url || data.checkout_url || data.session_url;
        
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            throw new Error("URL di checkout mancante nella risposta del server");
        }
    } catch (err) {
        console.error("Errore avvio Stripe NexusAI:", err);
        alert("Impossibile aprire il checkout sicuro. Riprova tra qualche istante.");
        window.location.hash = '#pricing';
    }
}

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    renderNexusPrices();
    fetchNexusLivePricing();
});

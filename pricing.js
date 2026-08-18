/**
 * NexusAI - Live Pricing & Stripe Checkout Engine
 * RM Studio Universal Engine
 */
const NEXUS_PRICES = {
  base: { id: "base", name: "Nexus Base Plan", price: 49 },
  pro:  { id: "pro",  name: "Nexus Pro Plan",  price: 99 }
};

async function initNexusPricing() {
  try {
    const res = await fetch("https://zqkqlhosyjvxdwfjmwwb.supabase.co/rest/v1/saas_pricing?saas=eq.nexus&select=*");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(item => {
          const pid = (item.plan_id || "").toLowerCase();
          if (NEXUS_PRICES[pid]) {
            NEXUS_PRICES[pid].price = Number(item.price);
          }
        });
      }
    }
  } catch (e) {
    console.warn("Utilizzo prezzi locali per NexusAI:", e);
  }

  const elBase = document.getElementById("price-base-val");
  const elPro = document.getElementById("price-pro-val");
  if (elBase) elBase.innerText = `€${NEXUS_PRICES.base.price}`;
  if (elPro) elPro.innerText = `€${NEXUS_PRICES.pro.price}`;
}

async function avviaCheckoutNexus(planKey = "base", email = "") {
  const plan = NEXUS_PRICES[planKey] || NEXUS_PRICES.base;
  const origin = window.location.origin;

  const payload = {
    progetto: "NexusAI",
    portal_type: "nexus",
    title: `NexusAI • ${plan.name}`,
    price: plan.price,
    ricarica_tipo: planKey,
    email: email || undefined,
    agency_id: email ? `lead_${email}` : "checkout_diretto",
    project_id: email ? `lead_${email}` : "checkout_diretto",
    origin: origin,
    success_url: `${origin}/config.html?success=true&plan=${planKey}`,
    cancel_url: `${origin}/#pricing`
  };

  try {
    const res = await fetch("https://n8n.rmstudio.app/webhook/crea-sessione-stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Errore creazione sessione");
    const data = await res.json();
    const redirectUrl = data.url || data.checkout_url || data.session_url;

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      throw new Error("URL Stripe non ricevuto");
    }
  } catch (err) {
    console.error("Errore checkout NexusAI:", err);
    window.location.hash = "#pricing";
  }
}

document.addEventListener("DOMContentLoaded", initNexusPricing);

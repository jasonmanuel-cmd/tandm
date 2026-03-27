const UI = {
    container: document.getElementById('bot-container'),
    messages: document.getElementById('bot-messages'),
    form: document.getElementById('bot-form'),
    input: document.getElementById('bot-input'),
    toggle: document.getElementById('bot-toggle')
};

const PERSONA = {
    name: "T&M LOGISTICS",
    neighborhoods: ["Seven Oaks", "Rosedale", "Stockdale", "Oildale", "Downtown", "Westchester", "Silver Creek"],
    responses: {
        intro: "👋 T&M here. We’re currently clearing loads in Bakersfield—just reclaim your space. What are we hauling today?",
        garage: "That clutter’s been sitting too long—let’s open that space back up. T&M’s father-son team can be there tomorrow, possibly today if the route’s light. We handle everything, no sorting needed.",
        construction: "That material pile slows everything down. We move fast—load, sweep, clear. T&M handles construction haul-offs all over Bakersfield. Want to see if the guys can add you to tomorrow’s route?",
        estate: "These clean-outs take coordination—we keep it tight and respectful. The father-son crew handles full clearances so families don’t have to. Morning or afternoon work better for you?",
        hazard: "We don’t handle chemicals or biohazards, but we can point you to the right disposal site. What else can we help you clear?",
        pricing: "We price by load and type—the guys finalize it in person so you only pay for what’s actually hauled. When others send crews, T&M sends family.",
        generic: "Space reclaimed is peace of mind. We bring both. What’s the project size? (e.g., A few items, Half a trailer, Full trailer)",
        cta: "Fastest way to lock your slot is to call <b>(661) 996-6950</b>. We can usually get someone out same day—just depends on the load size."
    }
};

function addMessage(text, isBot = true) {
    if (!UI.messages) return;
    const msg = document.createElement('div');
    msg.className = `message ${isBot ? 'bot' : 'user'}`;
    msg.innerHTML = `
        ${isBot ? `<span style="font-size: 0.65rem; font-weight: 800; color: var(--primary); display: block; margin-bottom: 4px; letter-spacing: 1.5px;">T&M LOGISTICS</span>` : ''}
        <div>${text}</div>
    `;
    UI.messages.appendChild(msg);
    UI.messages.scrollTop = UI.messages.scrollHeight;
}

function solve(input) {
    const raw = input.toLowerCase();
    let res = "";

    if (raw.includes("garage") || raw.includes("attic")) res = PERSONA.responses.garage;
    else if (raw.includes("construct") || raw.includes("debris") || raw.includes("remodel")) res = PERSONA.responses.construction;
    else if (raw.includes("estate") || raw.includes("probate")) res = PERSONA.responses.estate;
    else if (raw.includes("price") || raw.includes("estimate") || raw.includes("how much")) res = PERSONA.responses.pricing;
    else if (raw.includes("paint") || raw.includes("bio") || raw.includes("hazard")) res = PERSONA.responses.hazard;
    else res = PERSONA.responses.generic;

    // Local injection
    if (Math.random() > 0.6) {
        const nb = PERSONA.neighborhoods[Math.floor(Math.random() * PERSONA.neighborhoods.length)];
        res += ` We're moving between <b>${nb}</b> pickups right now.`;
    }

    setTimeout(() => {
        addMessage(res);
        setTimeout(() => addMessage(PERSONA.responses.cta), 1500);
    }, 1000);
}

if (UI.form) {
    UI.form.onsubmit = (e) => {
        e.preventDefault();
        const v = UI.input.value.trim();
        if (!v) return;
        addMessage(v, false);
        UI.input.value = '';
        solve(v);
    };
}

if (UI.toggle) UI.toggle.onclick = () => UI.container.classList.toggle('active');
window.toggleBot = () => UI.container.classList.add('active');

// Auto-start
setTimeout(() => addMessage(PERSONA.responses.intro), 2500);

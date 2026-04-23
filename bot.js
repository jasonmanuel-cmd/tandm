const UI = {
    container: document.getElementById('bot-container'),
    messages: document.getElementById('bot-messages'),
    form: document.getElementById('bot-form'),
    input: document.getElementById('bot-input'),
    toggle: document.getElementById('bot-toggle')
};

let externalChatToggle = null;

const PERSONA = {
    name: "T&M Hauling",
    // Fallback keyword responses if API is unavailable
    fallback: {
        garage: "That clutter's been sitting too long — let's open that space back up. T&M's father-son team can be there tomorrow, possibly today. We handle everything, no sorting needed.",
        construction: "That material pile slows everything down. We move fast — load, sweep, clear. T&M handles construction haul-offs all over Bakersfield. Want to see if we can add you to tomorrow's route?",
        estate: "These clean-outs take coordination — we keep it tight and respectful. The father-son crew handles full clearances so families don't have to. Morning or afternoon work better for you?",
        pricing: "We price by load and type — the guys finalize it in person so you only pay for what's actually hauled. Text a photo to (661) 996-6951 for a fast estimate.",
        hazard: "We don't handle chemicals or biohazards, but we can point you to the right disposal site. What else can we help you clear?",
        generic: "We’re Bakersfield’s local father–son crew — fast quotes, full-service load-out, and we sweep when we’re done. Call or text <b>(661) 996-6951</b> with a photo for the quickest answer.",
        cta: "Fastest lead: <b>text a photo</b> to (661) 996-6951. To book a crew date: open <b>contact.html</b> (estimate vs $30 hold). Same-day depends on the route — say your neighborhood."
    },
    intro: "Hi — T&M Hauling. Father–son crew in Bakersfield. Text a photo to <b>(661) 996-6951</b> for a fast quote, or say <b>book</b> if you want to lock a date ($30 hold applies to your total). What are we hauling?"
};

// Conversation history for Claude context
const conversationHistory = [];

function addMessage(text, isBot = true) {
    if (!UI.messages) return;
    const msg = document.createElement('div');
    msg.className = `message ${isBot ? 'bot' : 'user'}`;
    msg.innerHTML = `
        ${isBot ? `<span style="font-size: 0.65rem; font-weight: 800; color: var(--primary); display: block; margin-bottom: 4px; letter-spacing: 1.5px;">T&amp;M HAULING</span>` : ''}
        <div>${text}</div>
    `;
    UI.messages.appendChild(msg);
    UI.messages.scrollTop = UI.messages.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message bot';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <span style="font-size: 0.65rem; font-weight: 800; color: var(--primary); display: block; margin-bottom: 4px; letter-spacing: 1.5px;">T&amp;M HAULING</span>
        <div style="display:flex; gap:4px; align-items:center; padding: 4px 0;">
            <span style="width:6px;height:6px;border-radius:50%;background:var(--primary);animation:typingDot 1s infinite 0s"></span>
            <span style="width:6px;height:6px;border-radius:50%;background:var(--primary);animation:typingDot 1s infinite 0.2s"></span>
            <span style="width:6px;height:6px;border-radius:50%;background:var(--primary);animation:typingDot 1s infinite 0.4s"></span>
        </div>
    `;
    if (!document.getElementById('typing-keyframes')) {
        const style = document.createElement('style');
        style.id = 'typing-keyframes';
        style.textContent = '@keyframes typingDot{0%,80%,100%{opacity:0.2}40%{opacity:1}}';
        document.head.appendChild(style);
    }
    UI.messages.appendChild(indicator);
    UI.messages.scrollTop = UI.messages.scrollHeight;
    return indicator;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

// Keyword fallback (used if API call fails)
function fallbackResponse(input) {
    const raw = input.toLowerCase();
    if (raw.includes("garage") || raw.includes("attic")) return PERSONA.fallback.garage;
    if (raw.includes("construct") || raw.includes("debris") || raw.includes("remodel")) return PERSONA.fallback.construction;
    if (raw.includes("estate") || raw.includes("probate")) return PERSONA.fallback.estate;
    if (raw.includes("price") || raw.includes("estimate") || raw.includes("how much") || raw.includes("cost")) return PERSONA.fallback.pricing;
    if (raw.includes("paint") || raw.includes("bio") || raw.includes("hazard") || raw.includes("chemical")) return PERSONA.fallback.hazard;
    return PERSONA.fallback.generic;
}

async function getAIResponse(userMessage) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMessage,
                history: conversationHistory.slice(-6)
            })
        });

        if (!response.ok) throw new Error('API error');

        const data = await response.json();
        if (data.reply) {
            // Store in history for context
            conversationHistory.push({ role: 'user', content: userMessage });
            conversationHistory.push({ role: 'assistant', content: data.reply });
            return data.reply;
        }
        throw new Error('No reply');
    } catch {
        // Graceful fallback to keyword matching
        return fallbackResponse(userMessage);
    }
}

async function handleUserMessage(text) {
    addMessage(text, false);
    const indicator = showTypingIndicator();

    const reply = await getAIResponse(text);

    removeTypingIndicator();
    addMessage(reply);
}

if (UI.form) {
    UI.form.onsubmit = async (e) => {
        e.preventDefault();
        const v = UI.input.value.trim();
        if (!v) return;
        UI.input.value = '';
        UI.input.disabled = true;
        await handleUserMessage(v);
        UI.input.disabled = false;
        UI.input.focus();
    };
}

if (UI.toggle) UI.toggle.onclick = () => UI.container.classList.toggle('active');
window.toggleBot = () => {
    if (typeof externalChatToggle === 'function') {
        externalChatToggle();
        return;
    }
    if (UI.container) UI.container.classList.add('active');
};

// Auto-start greeting (no timeout needed — user opens chat manually via button)
// The greeting appears when the bot container becomes visible
document.addEventListener('DOMContentLoaded', () => {
    if (UI.messages && UI.messages.children.length === 0) {
        addMessage(PERSONA.intro);
    }
});

function initExternalLiveChat() {
    const cfg = window.TM_LIVE_CHAT || {};
    if (!cfg || !cfg.enabled) return;

    // Tawk.to integration (recommended for this site: no rebuild needed, lightweight embed)
    if (cfg.provider === 'tawk' && cfg.propertyId) {
        const s1 = document.createElement('script');
        s1.async = true;
        s1.src = `https://embed.tawk.to/${cfg.propertyId}/${cfg.widgetId || '1'}`;
        s1.charset = 'UTF-8';
        s1.setAttribute('crossorigin', '*');
        document.head.appendChild(s1);

        // Keep local assistant as fallback until widget is available.
        externalChatToggle = function () {
            if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
                window.Tawk_API.maximize();
                return;
            }
            if (UI.container) UI.container.classList.add('active');
        };
    }
}

initExternalLiveChat();

const BOT_STATES = {
    INTRO: 'INTRO',
    ITEM_TYPE: 'ITEM_TYPE',
    VOLUME: 'VOLUME',
    COMPLETE: 'COMPLETE'
};

let currentState = BOT_STATES.INTRO;
let userData = {
    city: 'Bakersfield',
    item: '',
    volume: ''
};

const UI = {
    container: document.getElementById('bot-container'),
    messages: document.getElementById('bot-messages'),
    form: document.getElementById('bot-form'),
    input: document.getElementById('bot-input'),
    toggle: document.getElementById('bot-toggle')
};

function addMessage(text, isBot = true) {
    if (!UI.messages) return;
    const msg = document.createElement('div');
    msg.className = `message ${isBot ? 'bot' : 'user'} glass`;
    msg.innerHTML = `
        ${isBot ? '<i class="fa-solid fa-robot" style="font-size: 0.8rem; margin-bottom: 5px; display: block; opacity: 0.6;"></i>' : ''}
        <div>${text}</div>
    `;
    UI.messages.appendChild(msg);
    UI.messages.scrollTop = UI.messages.scrollHeight;
}

async function initBot() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.city) userData.city = data.city;
    } catch (e) { 
        console.log('Location bypass'); 
    }

    setTimeout(() => {
        addMessage(`👋 Hey! T&M here. We're currently clearing loads in <b>${userData.city}</b>. Ready to get that junk gone?`);
        setTimeout(() => {
            addMessage("What are we looking at? (e.g., Couch, Garage Cleanout, Yard Waste)");
            currentState = BOT_STATES.ITEM_TYPE;
        }, 1000);
    }, 1500);
}

if (UI.form) {
    UI.form.onsubmit = (e) => {
        e.preventDefault();
        const val = UI.input.value.trim();
        if (!val) return;

        addMessage(val, false);
        UI.input.value = '';
        processBotFlow(val);
    };
}

function processBotFlow(input) {
    switch (currentState) {
        case BOT_STATES.ITEM_TYPE:
            userData.item = input;
            addMessage(`Got it. A ${input}. Roughly how much space does it take? (e.g., A few items, Half a trailer, Full trailer)`);
            currentState = BOT_STATES.VOLUME;
            break;
            
        case BOT_STATES.VOLUME:
            userData.volume = input;
            addMessage("Perfect. Based on that, I'd ballpark that between <b>$85 - $250</b>, but I can give you a firm price if you text me a photo.");
            setTimeout(() => {
                addMessage("Tap below to text us a photo and get a guaranteed quote in 5 mins! 👇");
                const link = document.createElement('div');
                link.innerHTML = `<a href="sms:+16619966950" class="btn btn-red" style="width:100%; margin-top:10px; display:block; text-align:center;"><i class="fa-solid fa-camera"></i> TEXT PHOTOS NOW</a>`;
                UI.messages.appendChild(link);
                UI.messages.scrollTop = UI.messages.scrollHeight;
            }, 1000);
            currentState = BOT_STATES.COMPLETE;
            break;
        
        case BOT_STATES.COMPLETE:
            addMessage("Feel free to text me at 661-996-6950 if you have more questions!");
            break;
    }
}

if (UI.toggle) {
    UI.toggle.onclick = () => {
        UI.container.classList.toggle('active');
    };
}

// Global toggle for other buttons
window.toggleBot = () => {
    UI.container.classList.add('active');
};

initBot();

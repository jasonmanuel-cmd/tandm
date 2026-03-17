const BOT_STATES = {
    IDLE: 'IDLE',
    ASKING_ZIP: 'ASKING_ZIP',
    ASKING_PHOTOS: 'ASKING_PHOTOS',
    ESTIMATING: 'ESTIMATING',
    BOOKING: 'BOOKING'
};

let currentState = BOT_STATES.ASKING_ZIP;
let userData = {
    zip: '',
    photos: []
};

const VALID_ZIPS = ["93301", "93302", "93303", "93304", "93305", "93306", "93307", "93308", "93309", "93311", "93312", "93313", "93314"];

function addMessage(text, isBot = true) {
    const container = document.getElementById('bot-messages');
    const msg = document.createElement('div');
    msg.className = `message ${isBot ? 'bot' : 'user'} glass`;
    msg.style.alignSelf = isBot ? 'flex-start' : 'flex-end';
    msg.style.padding = '0.75rem 1rem';
    msg.style.fontSize = '0.9rem';
    msg.style.maxWidth = '80%';
    if (!isBot) msg.style.background = 'var(--primary)';
    msg.innerHTML = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

function processInput() {
    const input = document.getElementById('bot-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, false);
    input.value = '';

    setTimeout(() => handleState(text), 500);
}

function handleState(text) {
    switch (currentState) {
        case BOT_STATES.ASKING_ZIP:
            if (VALID_ZIPS.includes(text)) {
                userData.zip = text;
                addMessage(`Great! I see you're in the <strong>${text}</strong> area. T&M's father-son crew is active near you today.`);
                addMessage("To give you a ballpark estimate, what are you hauling? (Or text a photo to <strong>661-996-6950</strong> for an immediate price)");
                currentState = BOT_STATES.ESTIMATING;
            } else {
                addMessage("We primarily serve Greater Bakersfield. Try a local 93xxx ZIP?");
            }
            break;

        case BOT_STATES.ESTIMATING:
            addMessage("Got it. Our <strong>16ft high-capacity trailer</strong> handles big jobs in one trip. Typical Bakersfield rates:");
            addMessage("• Small loads: <strong>$85-$150</strong><br>• Half Trailer: <strong>$250-$400</strong><br>• Full Trailer: <strong>$600-$750</strong>");
            addMessage("Would you like to schedule a firm quote or have us call you?");
            currentState = BOT_STATES.BOOKING;
            break;

        case BOT_STATES.BOOKING:
            addMessage("Excellent. A specialist will reach out to confirm a window. Could you leave your <strong>Phone Number</strong>?");
            break;

        default:
            addMessage("I'm here to help! Would you like to start over or call us directly?");
    }
}

// Global enter listener
document.getElementById('bot-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processInput();
});

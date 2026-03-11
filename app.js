const startBtn = document.getElementById('start-btn');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const voiceIndicator = document.getElementById('voice-indicator');
const statusText = voiceIndicator.querySelector('.status-text');
const srcSelect = document.getElementById('source-lang-select');
const targetSelect = document.getElementById('target-lang-select');
const swapBtn = document.getElementById('swap-languages');

let isListening = false;
let recognition;

// Initialize Web Speech API
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isListening = true;
        startBtn.classList.add('listening');
        startBtn.querySelector('.btn-text').textContent = 'Stop Listening';
        voiceIndicator.classList.add('listening');
        statusText.textContent = 'Listening...';
    };

    recognition.onend = () => {
        isListening = false;
        startBtn.classList.remove('listening');
        startBtn.querySelector('.btn-text').textContent = 'Start Listening';
        voiceIndicator.classList.remove('listening');
        statusText.textContent = 'Ready';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const fullText = finalTranscript || interimTranscript;
        if (fullText) {
            sourceText.value = fullText;
            debounceTranslate(fullText);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        statusText.textContent = 'Error: ' + event.error;
        stopListening();
    };
} else {
    alert('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
}

// Translation Logic
let translateTimeout;
function debounceTranslate(text) {
    clearTimeout(translateTimeout);
    translateTimeout = setTimeout(() => {
        translateText(text);
    }, 500);
}

async function translateText(text) {
    if (!text.trim()) return;

    // Extract language codes from the select values (e.g., 'en-US' -> 'en')
    const srcLang = srcSelect.value.split('-')[0];
    const targetLang = targetSelect.value.split('-')[0];

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcLang}|${targetLang}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.responseData) {
            targetText.value = data.responseData.translatedText;
        }
    } catch (error) {
        console.error('Translation error:', error);
        targetText.value = 'Translation failed. Please check your connection.';
    }
}

// Event Listeners
startBtn.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

swapBtn.addEventListener('click', () => {
    const tempValue = srcSelect.value;
    srcSelect.value = targetSelect.value;
    targetSelect.value = tempValue;

    // Clear fields on swap
    sourceText.value = '';
    targetText.value = '';

    // Restart recognition if it was active
    if (isListening) {
        stopListening();
        startListening();
    }
});

function startListening() {
    recognition.lang = srcSelect.value;
    recognition.start();
}

function stopListening() {
    recognition.stop();
}

// Allow typing to translate as well
sourceText.addEventListener('input', () => {
    debounceTranslate(sourceText.value);
});

const startBtn = document.getElementById('start-btn');
const toggleBtn = document.getElementById('toggle-lang');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const voiceIndicator = document.getElementById('voice-indicator');
const statusText = voiceIndicator.querySelector('.status-text');
const srcLabel = document.getElementById('src-label');
const targetLabel = document.getElementById('target-label');
const srcLangName = document.getElementById('source-lang-name');
const targetLangName = document.getElementById('target-lang-name');

let isListening = false;
let recognition;
let currentMode = 'en-fi'; // 'en-fi' or 'fi-en'

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
    }, 500); // Wait for 500ms of silence before translating
}

async function translateText(text) {
    if (!text.trim()) return;

    const [src, target] = currentMode.split('-');
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${target}`;

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

toggleBtn.addEventListener('click', () => {
    if (currentMode === 'en-fi') {
        currentMode = 'fi-en';
        srcLabel.textContent = 'FI';
        targetLabel.textContent = 'EN';
        srcLangName.textContent = 'Finnish';
        targetLangName.textContent = 'English';
        sourceText.placeholder = 'Aloita puhuminen...';
        targetText.placeholder = 'Käännös ilmestyy tähän...';
    } else {
        currentMode = 'en-fi';
        srcLabel.textContent = 'EN';
        targetLabel.textContent = 'FI';
        srcLangName.textContent = 'English';
        targetLangName.textContent = 'Finnish';
        sourceText.placeholder = 'Start speaking...';
        targetText.placeholder = 'Translation will appear here...';
    }
    
    // Update recognition language
    if (isListening) {
        stopListening();
        startListening();
    }
    
    // Clear fields on toggle
    sourceText.value = '';
    targetText.value = '';
});

function startListening() {
    const lang = currentMode === 'en-fi' ? 'en-US' : 'fi-FI';
    recognition.lang = lang;
    recognition.start();
}

function stopListening() {
    recognition.stop();
}

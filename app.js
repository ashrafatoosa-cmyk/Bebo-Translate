const startBtn = document.getElementById('start-btn');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const voiceIndicator = document.getElementById('voice-indicator');
const statusText = voiceIndicator.querySelector('.status-text');
const srcSelect = document.getElementById('source-lang-select');
const targetSelect = document.getElementById('target-lang-select');
const swapBtn = document.getElementById('swap-languages');
const ttsToggle = document.getElementById('tts-toggle');
const video = document.getElementById('webcam');

let isListening = false;
let recognition;
let speechStream = null;

// Initialize Camera
async function initCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('MediaDevices API not supported in this browser.');
        statusText.textContent = 'Camera not supported in this browser.';
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user"
            },
            audio: false
        });

        if (video) {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                console.log('Camera started successfully');
            };
        }
    } catch (err) {
        console.error('Error accessing camera:', err);
        let errorMsg = 'Could not access camera.';
        if (err.name === 'NotAllowedError') errorMsg = 'Camera permission denied. Please allow access in browser settings.';
        else if (err.name === 'NotFoundError') errorMsg = 'No camera found on this device.';
        else if (err.name === 'NotReadableError') errorMsg = 'Camera is already in use by another application.';

        statusText.textContent = errorMsg;
        alert(errorMsg);
    }
}

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
            if (finalTranscript) {
                translateText(finalTranscript, true);
            } else {
                debounceTranslate(interimTranscript);
            }
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
        translateText(text, false);
    }, 1000);
}

async function translateText(text, shouldSpeak) {
    if (!text.trim()) return;

    const srcLang = srcSelect.value.split('-')[0];
    const targetLang = targetSelect.value.split('-')[0];

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcLang}|${targetLang}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.responseData) {
            const translated = data.responseData.translatedText;
            targetText.value = translated;

            if (shouldSpeak && ttsToggle.checked) {
                speakText(translated, targetSelect.value);
            }
        }
    } catch (error) {
        console.error('Translation error:', error);
        targetText.value = 'Translation failed.';
    }
}

// Text-to-Speech Logic
function speakText(text, lang) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Find a matching voice for the target language (best effort)
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
        if (voice) utterance.voice = voice;

        window.speechSynthesis.speak(utterance);
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
    sourceText.value = '';
    targetText.value = '';
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

// Initialize on page load
initCamera();

// Allow typing to translate
sourceText.addEventListener('input', () => {
    debounceTranslate(sourceText.value);
});

/* =============================================
   RAAIT Voice Clone — App Logic
   ============================================= */

const VOICE_DURATION = 60;
const ROLE_DURATION = 20;
const BAR_COUNT = 40;

let voiceBlob = null;
let roleBlob = null;
let agentId = null;

let audioContext = null;
let analyser = null;
let mediaStream = null;
let scriptProcessor = null;
let recordedSamples = [];
let isRecording = false;
let animationFrameId = null;

// ---- SCREEN NAVIGATION ----

function showScreen(id) {
  document.querySelectorAll('.s').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  const screens = ['idle', 'step1', 'step2', 'loading', 'step4'];
  const idx = screens.indexOf(id);
  document.querySelectorAll('.dots span').forEach((dot, i) => {
    dot.classList.remove('on', 'done');
    if (i === idx) dot.classList.add('on');
    else if (i < idx) dot.classList.add('done');
  });
}

// ---- AUDIO VISUALIZER ----

function createBars(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('div');
    bar.classList.add('b');
    container.appendChild(bar);
  }
}

function startVisualizer(containerId) {
  const container = document.getElementById(containerId);
  const bars = container.querySelectorAll('.b');
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function draw() {
    analyser.getByteFrequencyData(dataArray);
    const step = Math.floor(dataArray.length / BAR_COUNT);
    for (let i = 0; i < BAR_COUNT; i++) {
      const value = dataArray[i * step];
      const height = Math.max(3, (value / 255) * 52);
      bars[i].style.height = height + 'px';
    }
    animationFrameId = requestAnimationFrame(draw);
  }
  draw();
}

function stopVisualizer() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// ---- COUNTDOWN ----

function startCountdown(elementId, duration, onDone) {
  const textEl = document.getElementById(elementId + '-text');
  const circleEl = document.getElementById(elementId + '-circle');
  const circumference = 226;
  let remaining = duration;

  textEl.textContent = remaining;
  circleEl.style.strokeDashoffset = '0';

  const interval = setInterval(() => {
    remaining--;
    textEl.textContent = remaining;
    const progress = 1 - (remaining / duration);
    circleEl.style.strokeDashoffset = (circumference * progress).toString();

    if (remaining <= 0) {
      clearInterval(interval);
      if (onDone) onDone();
    }
  }, 1000);

  return interval;
}

// ---- PCM WAV RECORDING ----

async function startRecording(visualizerId) {
  recordedSamples = [];
  isRecording = true;

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: 48000
    }
  });

  audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
  const source = audioContext.createMediaStreamSource(mediaStream);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
  scriptProcessor.onaudioprocess = (e) => {
    if (!isRecording) return;
    const channelData = e.inputBuffer.getChannelData(0);
    recordedSamples.push(new Float32Array(channelData));
  };

  source.connect(scriptProcessor);
  scriptProcessor.connect(audioContext.destination);

  createBars(visualizerId);
  startVisualizer(visualizerId);
}

function stopRecording() {
  isRecording = false;
  stopVisualizer();

  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }

  const totalLength = recordedSamples.reduce((acc, chunk) => acc + chunk.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of recordedSamples) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const sampleRate = audioContext ? audioContext.sampleRate : 48000;

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  return encodeWAV(merged, sampleRate);
}

// ---- STEP 1: VOICE SAMPLE ----

let step1CountdownId = null;

async function startStep1() {
  showScreen('step1');

  try {
    await startRecording('visualizer1');

    step1CountdownId = startCountdown('countdown1', VOICE_DURATION, () => {
      finishStep1();
    });
  } catch (err) {
    document.getElementById('step1-error').textContent = 'Microfoon toegang geweigerd: ' + err.message;
  }
}

function finishStep1() {
  if (step1CountdownId) {
    clearInterval(step1CountdownId);
    step1CountdownId = null;
  }
  voiceBlob = stopRecording();
  showScreen('step2');
  startStep2();
}

// ---- STEP 2: ROLE DESCRIPTION ----

let step2CountdownId = null;

async function startStep2() {
  try {
    await startRecording('visualizer2');

    step2CountdownId = startCountdown('countdown2', ROLE_DURATION, () => {
      finishStep2();
    });
  } catch (err) {
    document.getElementById('step2-error').textContent = 'Microfoon fout: ' + err.message;
  }
}

function finishStep2() {
  if (step2CountdownId) {
    clearInterval(step2CountdownId);
    step2CountdownId = null;
  }
  roleBlob = stopRecording();
  createAgent();
}

// ---- CREATE AGENT ----

async function createAgent() {
  showScreen('loading');

  const formData = new FormData();
  formData.append('voice_sample', voiceBlob, 'voice_sample.wav');
  formData.append('role_audio', roleBlob, 'role_audio.wav');

  try {
    const res = await fetch('/api/clone-voice', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.agent_id) {
      agentId = data.agent_id;
      showConversation();
    } else {
      showScreen('step1');
      document.getElementById('step1-error').textContent = 'Er ging iets mis: ' + (data.error || 'Probeer opnieuw');
    }
  } catch (err) {
    showScreen('step1');
    document.getElementById('step1-error').textContent = 'Verbindingsfout: ' + err.message;
  }
}

// ---- CONVERSATION ----

function showConversation() {
  showScreen('step4');
  const container = document.getElementById('convai-widget');
  container.innerHTML = '';

  const widget = document.createElement('elevenlabs-convai');
  widget.setAttribute('agent-id', agentId);
  container.appendChild(widget);
}

// ---- RESET ----

function resetApp() {
  voiceBlob = null;
  roleBlob = null;
  agentId = null;
  document.getElementById('step1-error').textContent = '';
  document.getElementById('step2-error').textContent = '';
  showScreen('idle');
}

// ---- INIT ----

document.addEventListener('DOMContentLoaded', () => {
  showScreen('idle');
});

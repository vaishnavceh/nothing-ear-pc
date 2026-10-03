let currentAnc = 1;
let currentBass = false;

document.addEventListener('DOMContentLoaded', async () => {
  // Setup Window Actions
  document.getElementById('expand-btn').addEventListener('click', () => {
    window.desktopAPI?.showMainWindow();
  });

  document.getElementById('close-btn').addEventListener('click', () => {
    window.desktopAPI?.hideWidgetWindow();
  });

  const pinBtn = document.getElementById('pin-btn');
  pinBtn.addEventListener('click', async () => {
    const isPinned = await window.desktopAPI?.togglePinWidget();
    if (isPinned) {
      pinBtn.classList.add('active');
    } else {
      pinBtn.classList.remove('active');
    }
  });

  // Check initial pinned state
  const isPinned = await window.desktopAPI?.isWidgetPinned();
  if (isPinned) {
    pinBtn.classList.add('active');
  } else {
    pinBtn.classList.remove('active');
  }

  // Subscribe to real-time state updates from main process / device
  window.desktopAPI?.onStateUpdate((state) => {
    updateWidgetState(state);
  });
});

function updateWidgetState(state) {
  // Connection status & Title
  const statusDot = document.getElementById('status-dot');
  const titleEl = document.getElementById('device-title');
  const connectBtn = document.getElementById('connect-btn');

  if (state.connected) {
    statusDot.classList.add('connected');
    titleEl.innerText = state.modelName || 'NOTHING EAR';
    connectBtn.style.display = 'none';
  } else {
    statusDot.classList.remove('connected');
    titleEl.innerText = 'DISCONNECTED';
    connectBtn.style.display = 'block';
  }

  // Battery Left
  const valLeft = document.getElementById('val-left');
  const barLeft = document.getElementById('bar-left');
  if (state.batteryLeft && state.batteryLeft !== 'DISCONNECTED' && state.batteryLeft !== '--') {
    valLeft.innerText = state.batteryLeft + '%';
    barLeft.style.width = Math.min(100, Math.max(0, parseInt(state.batteryLeft))) + '%';
  } else {
    valLeft.innerText = '--';
    barLeft.style.width = '0%';
  }

  // Battery Case
  const valCase = document.getElementById('val-case');
  const barCase = document.getElementById('bar-case');
  if (state.batteryCase && state.batteryCase !== 'DISCONNECTED' && state.batteryCase !== '--') {
    valCase.innerText = state.batteryCase + '%';
    barCase.style.width = Math.min(100, Math.max(0, parseInt(state.batteryCase))) + '%';
  } else {
    valCase.innerText = '--';
    barCase.style.width = '0%';
  }

  // Battery Right
  const valRight = document.getElementById('val-right');
  const barRight = document.getElementById('bar-right');
  if (state.batteryRight && state.batteryRight !== 'DISCONNECTED' && state.batteryRight !== '--') {
    valRight.innerText = state.batteryRight + '%';
    barRight.style.width = Math.min(100, Math.max(0, parseInt(state.batteryRight))) + '%';
  } else {
    valRight.innerText = '--';
    barRight.style.width = '0%';
  }

  // ANC mode pills
  currentAnc = state.ancMode;
  document.getElementById('anc-on').classList.remove('active');
  document.getElementById('anc-trans').classList.remove('active');
  document.getElementById('anc-off').classList.remove('active');

  if (state.ancMode === 4 || state.ancMode === 3 || state.ancMode === 5 || state.ancMode === 6) {
    document.getElementById('anc-on').classList.add('active');
  } else if (state.ancMode === 2) {
    document.getElementById('anc-trans').classList.add('active');
  } else {
    document.getElementById('anc-off').classList.add('active');
  }

  // Bass Enhance
  currentBass = !!state.bassEnhance;
  const bassBtn = document.getElementById('bass-btn');
  if (currentBass) {
    bassBtn.classList.add('active');
  } else {
    bassBtn.classList.remove('active');
  }

  // Active EQ Profile name
  const activeName = state.activePresetName || (state.isDiracOpteo ? "DIRAC" : "BALANCED");
  const eqNameEl = document.getElementById("eq-name");
  if (eqNameEl) {
    eqNameEl.innerText = activeName.toUpperCase().slice(0, 8);
  }
}

const EQ_PRESET_CYCLE = ["dirac", "jazz", "rock", "classical", "semi_classical", "romantic", "vocal", "pop", "edm", "gaming"];
let currentEqIndex = 0;

function cycleStudioEQ() {
  currentEqIndex = (currentEqIndex + 1) % EQ_PRESET_CYCLE.length;
  const key = EQ_PRESET_CYCLE[currentEqIndex];
  window.desktopAPI?.sendWidgetCommand('cycleEQ', key);
  const eqNameEl = document.getElementById("eq-name");
  if (eqNameEl) {
    eqNameEl.innerText = key.toUpperCase().slice(0, 8);
  }
}

function setANC(level) {
  currentAnc = level;
  window.desktopAPI?.sendWidgetCommand('setANC', level);

  // Optimistic UI update
  document.getElementById('anc-on').classList.toggle('active', level === 4);
  document.getElementById('anc-trans').classList.toggle('active', level === 2);
  document.getElementById('anc-off').classList.toggle('active', level === 1);
}

function toggleBass() {
  currentBass = !currentBass;
  window.desktopAPI?.sendWidgetCommand('setBass', currentBass ? 3 : 0);
  document.getElementById('bass-btn').classList.toggle('active', currentBass);
}

function openAndConnect() {
  window.desktopAPI?.showMainWindow();
  window.desktopAPI?.sendWidgetCommand('scanConnect');
}

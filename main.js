const { app, BrowserWindow, ipcMain, Tray, Menu, screen, globalShortcut, Notification } = require('electron');
const path = require('path');

// Performance & Fast Startup Optimizations
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('v8-cache-options', 'code');
app.commandLine.appendSwitch('disable-http-cache');

let mainWindow = null;
let widgetWindow = null;
let tray = null;
let isWidgetPinned = true;
let currentState = {
  connected: false,
  modelName: 'Nothing Ear',
  sku: '',
  batteryLeft: '--',
  batteryRight: '--',
  batteryCase: '--',
  ancMode: 1, // 1: off, 2: transparent, 4: on
  bassEnhance: 0,
  isDiracOpteo: false,
  supportsDirac: false,
  activePresetName: 'Dirac',
  isChargingL: false,
  isChargingR: false,
  isChargingC: false
};

function showToastNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'Nothing Ear PC',
      body: body || '',
      icon: path.join(__dirname, 'res', 'icons', '64x64.png'),
      silent: true
    }).show();
  }
}

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 820,
    minWidth: 800,
    minHeight: 700,
    backgroundColor: '#21201f',
    title: 'Nothing Ear PC',
    icon: path.join(__dirname, 'res', 'icons', '256x256.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'res', 'index.html'));

  mainWindow.on('close', (event) => {
    // If widget or tray is open, minimize to tray / hide instead of hard exit
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createWidgetWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Widget dimensions
  const widgetWidth = 360;
  const widgetHeight = 185;

  // Default position: bottom-right corner with 24px margin
  const posX = screenWidth - widgetWidth - 24;
  const posY = screenHeight - widgetHeight - 24;

  widgetWindow = new BrowserWindow({
    width: widgetWidth,
    height: widgetHeight,
    x: posX,
    y: posY,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: isWidgetPinned,
    skipTaskbar: false,
    hasShadow: true,
    title: 'Ear Widget',
    icon: path.join(__dirname, 'res', 'icons', '256x256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  widgetWindow.loadFile(path.join(__dirname, 'widget', 'widget.html'));

  widgetWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      widgetWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'res', 'icons', '32x32.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Nothing Ear PC & Widget');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Toggle Widget',
      click: () => {
        if (widgetWindow) {
          if (widgetWindow.isVisible()) {
            widgetWindow.hide();
          } else {
            widgetWindow.show();
          }
        }
      }
    },
    {
      label: 'Always On Top (Widget)',
      type: 'checkbox',
      checked: isWidgetPinned,
      click: (item) => {
        isWidgetPinned = item.checked;
        if (widgetWindow) widgetWindow.setAlwaysOnTop(isWidgetPinned);
      }
    },
    {
      label: 'Start with Windows',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({
          openAtLogin: item.checked,
          args: ['--hidden']
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  // Setup Bluetooth Web Serial Handler
  const { session } = require('electron');

  session.defaultSession.on('select-serial-port', (event, portList, webContents, callback) => {
    event.preventDefault();
    console.log('Bluetooth Serial Devices discovered:', portList);

    const SPP_UUID = 'aeac4a03-dff5-498f-843a-34487cf133eb';

    // Prioritize Nothing/CMF Earbuds matching SPP UUID or friendly names
    const matchingPort = portList.find(p => {
      const serviceId = (p.bluetoothServiceClassId || '').toLowerCase();
      const name = (p.displayName || p.portName || '').toLowerCase();
      return (
        serviceId === SPP_UUID ||
        name.includes('ear') ||
        name.includes('cmf') ||
        name.includes('nothing') ||
        name.includes('buds')
      );
    });

    if (matchingPort) {
      console.log('Auto-connecting to matched port:', matchingPort);
      const devName = matchingPort.displayName || matchingPort.portName || 'CMF Buds 2';
      let detectedModelKey = 'donphan';
      let detectedSku = '54';
      const lower = devName.toLowerCase();
      if (lower.includes('pro 2')) {
        detectedModelKey = 'espeon';
        detectedSku = '76';
      } else if (lower.includes('buds 2') || lower.includes('cmf buds') || (lower.includes('cmf') && lower.includes('buds'))) {
        detectedModelKey = 'donphan';
        detectedSku = '54';
      } else if (lower.includes('buds pro')) {
        detectedModelKey = 'corsola';
        detectedSku = '30';
      } else if (lower.includes('ear (a)') || lower.includes('ear a')) {
        detectedModelKey = 'cleffa';
        detectedSku = '63';
      } else if (lower.includes('ear (2)') || lower.includes('ear 2')) {
        detectedModelKey = 'two';
        detectedSku = '17';
      } else if (lower.includes('ear (stick)') || lower.includes('stick')) {
        detectedModelKey = 'sticks';
        detectedSku = '14';
      } else if (lower.includes('neckband')) {
        detectedModelKey = 'crobat';
        detectedSku = '48';
      } else if (lower.includes('ear (1)') || lower.includes('ear 1')) {
        detectedModelKey = 'one';
        detectedSku = '01';
      } else if (lower.includes('ear')) {
        detectedModelKey = 'twos';
        detectedSku = '61';
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('device-detected', {
          displayName: devName,
          modelKey: detectedModelKey,
          sku: detectedSku
        });
      }
      callback(matchingPort.portId);
    } else if (portList.length > 0) {
      console.log('Connecting to first available port:', portList[0]);
      callback(portList[0].portId);
    } else {
      console.log('No serial ports found');
      callback('');
    }
  });

  session.defaultSession.setDevicePermissionHandler((details) => {
    return details.deviceType === 'serial';
  });

  createMainWindow();
  createWidgetWindow();
  createTray();

  // Register Global Shortcuts
  try {
    globalShortcut.register('CommandOrControl+Shift+A', () => {
      let nextAnc = 1;
      if (currentState.ancMode === 1) nextAnc = 2;
      else if (currentState.ancMode === 2) nextAnc = 4;
      else nextAnc = 1;
      currentState.ancMode = nextAnc;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('widget-command-exec', { cmd: 'setANC', payload: nextAnc });
      }
      const names = { 4: 'ANC Active', 2: 'Transparency', 1: 'ANC Off' };
      showToastNotification('Noise Control', names[nextAnc] || 'ANC Off');
    });

    globalShortcut.register('CommandOrControl+Shift+D', () => {
      currentState.isDiracOpteo = !currentState.isDiracOpteo;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('widget-command-exec', { cmd: 'setDiracOpteo' });
      }
      showToastNotification('Dirac OPTEO™', currentState.isDiracOpteo ? 'Dirac OPTEO Enabled' : 'Dirac OPTEO Disabled');
    });

    globalShortcut.register('CommandOrControl+Shift+B', () => {
      const nextBass = currentState.bassEnhance ? 0 : 3;
      currentState.bassEnhance = nextBass;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('widget-command-exec', { cmd: 'setBass', payload: nextBass });
      }
      showToastNotification('Bass Enhance', nextBass > 0 ? 'Bass Boost Enabled' : 'Bass Boost Off');
    });

    const EQ_PRESETS = ['dirac', 'jazz', 'rock', 'classical', 'semi_classical', 'romantic', 'vocal', 'pop', 'edm', 'deep_bass', 'gaming', 'cinematic', 'acoustic', 'balanced'];
    let currentEqIdx = 0;
    globalShortcut.register('CommandOrControl+Shift+E', () => {
      currentEqIdx = (currentEqIdx + 1) % EQ_PRESETS.length;
      const key = EQ_PRESETS[currentEqIdx];
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('widget-command-exec', { cmd: 'cycleEQ', payload: key });
      }
      showToastNotification('Studio Equalizer', `Preset: ${key.toUpperCase().replace('_', ' ')}`);
    });

    globalShortcut.register('CommandOrControl+Shift+W', () => {
      if (widgetWindow) {
        if (widgetWindow.isVisible()) widgetWindow.hide();
        else widgetWindow.show();
      }
    });
  } catch (err) {
    console.error('Failed to register global shortcuts:', err);
  }

  // IPC Event Handlers
  ipcMain.on('state-to-widget', (event, state) => {
    currentState = { ...currentState, ...state };
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('state-update', currentState);
    }
  });

  ipcMain.on('widget-command', (event, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('widget-command-exec', data);
    }
  });

  ipcMain.on('show-main-window', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  ipcMain.on('show-widget-window', () => {
    if (widgetWindow) {
      widgetWindow.show();
    }
  });

  ipcMain.on('hide-widget-window', () => {
    if (widgetWindow) {
      widgetWindow.hide();
    }
  });

  ipcMain.on('resize-widget', (event, { width, height }) => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.setSize(width, height);
    }
  });

  ipcMain.handle('toggle-pin-widget', () => {
    isWidgetPinned = !isWidgetPinned;
    if (widgetWindow) {
      widgetWindow.setAlwaysOnTop(isWidgetPinned);
    }
    return isWidgetPinned;
  });

  ipcMain.handle('is-widget-pinned', () => isWidgetPinned);

  ipcMain.on('close-app', () => {
    app.isQuitting = true;
    app.quit();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

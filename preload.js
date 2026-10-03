const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  // Sync from Main Controller to Widget
  sendStateToWidget: (state) => ipcRenderer.send('state-to-widget', state),
  onStateUpdate: (callback) => ipcRenderer.on('state-update', (event, state) => callback(state)),

  // Commands from Widget to Main Controller
  sendWidgetCommand: (cmd, payload) => ipcRenderer.send('widget-command', { cmd, payload }),
  onWidgetCommand: (callback) => ipcRenderer.on('widget-command-exec', (event, data) => callback(data)),

  // Window management
  showMainWindow: () => ipcRenderer.send('show-main-window'),
  showWidgetWindow: () => ipcRenderer.send('show-widget-window'),
  hideWidgetWindow: () => ipcRenderer.send('hide-widget-window'),
  togglePinWidget: () => ipcRenderer.invoke('toggle-pin-widget'),
  isWidgetPinned: () => ipcRenderer.invoke('is-widget-pinned'),
  onDeviceDetected: (callback) => ipcRenderer.on('device-detected', (event, data) => callback(data)),
  closeApp: () => ipcRenderer.send('close-app')
});

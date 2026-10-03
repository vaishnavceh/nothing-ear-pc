# Nothing Ear PC & Desktop Widget (Studio Edition)

![Nothing Ear PC Logo](res/icons/256x256.png)

A high-performance standalone Windows desktop application and floating desktop widget for **Nothing** and **CMF by Nothing** earbuds. Features native Bluetooth RFCOMM integration, hardware-level **Dirac OPTEO™** calibration, an **Inbuilt Studio Equalizer Engine** with 15+ curated sound profiles, and global system shortcuts.

---

## ✨ Features

* **Desktop Widget Mode**:
  * Minimalist Nothing OS dark acrylic floating dock.
  * Real-time battery gauges for **Left Bud**, **Right Bud**, and **Case**.
  * 1-click **ANC mode cycler** (*Noise Cancellation / Transparency / Off*).
  * 1-click **Dirac OPTEO™** toggle and **Bass Boost**.
  * Dedicated **Studio EQ Profile switcher** pill.
  * Always-on-top pin toggle and free desktop dragging.

* **Inbuilt Studio Equalizer Engine**:
  * 15+ curated audio profiles mapped directly to earbud hardware DSP:
    * 🎷 **Jazz** • 🎸 **Rock** • 🎻 **Classical** • 🪕 **Semi-Classical** • 🌹 **Romantic / Ballad**
    * 🎤 **Vocal / Clear Voice** • 🎧 **Pop** • ⚡ **Electronic / EDM** • 🔊 **Deep Bass**
    * 🎮 **Gaming / FPS Footsteps** • 🎬 **Cinematic Movie** • 🪵 **Acoustic Warmth**
    * 🎛️ **Dirac OPTEO™ Linear Reference**

* **Direct Hardware Audio Control**:
  * Active Noise Cancellation (High, Mid, Low, Adaptive, Transparency, Off).
  * Ultra Bass Enhance amplifier.
  * Low Latency Gaming Mode.
  * In-Ear Detection & Ear Tip Fit Test.
  * Find My Earbuds acoustic chime.
  * Touch & Pinch Gesture customization.

* **Windows PC Integration & Global Shortcuts**:
  * `Ctrl + Shift + A` → Cycle ANC modes
  * `Ctrl + Shift + D` → Toggle Dirac OPTEO™
  * `Ctrl + Shift + E` → Cycle Studio Equalizer presets
  * `Ctrl + Shift + B` → Toggle Bass Boost
  * `Ctrl + Shift + W` → Show / Hide Desktop Widget
  * Windows native toast notifications for sound profile changes and low battery alerts.
  * Launch on Windows Startup (minimized to system tray).

---

## 🎧 Supported Devices

* **CMF Buds 2** & **CMF Buds** (Base `B168` • Dirac OPTEO™)
* **CMF Buds Pro 2** (Base `B172` • Dirac OPTEO™)
* **CMF Buds Pro** (Base `B163`)
* **CMF Neckband Pro** (Base `B164`)
* **Nothing Ear (2024 / Ear 3)** (Base `B171`)
* **Nothing Ear (a)** (Base `B162`)
* **Nothing Ear (2)** (Base `B155`)
* **Nothing Ear (stick)** (Base `B157`)
* **Nothing Ear (open)** (Base `B174`)
* **Nothing Ear (1)** (Base `B181`)

---

## 🚀 Building & Running

### Prerequisites
* Windows 10 / 11
* Node.js 18+ (tested on Node v24)

### Development
```bash
# Install dependencies
npm install

# Run application in development
npm start
```

### Packaging Standalone `.exe`
```bash
# Package into standalone portable Windows executable
npm run dist
```
The compiled single-file portable executable is generated in:
`dist/Nothing Ear PC 1.0.0.exe`

---

## 📄 License
This application is open source and published under the GNU General Public License v3.0 (GPLv3).

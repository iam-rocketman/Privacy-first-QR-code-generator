# QR Code Generator Free 📱✨

A 100% free, open-source, and privacy-first **Contact QR Code Generator** with SVG vector and high-resolution PNG (up to 4096px) export. Built with a clean, light-tone, accessible interface for a general audience. 

No subscriptions, zero paywalls, no tracking, and **100% ad-free**. Fully installable as an offline **Progressive Web App (PWA)** on mobile and desktop!

🔗 **GitHub Repository**: [iam-rocketman/Privacy-first-QR-code-generator](https://github.com/iam-rocketman/Privacy-first-QR-code-generator)

---

## 💡 Why This Project?

Most QR code generators on the internet are freemium traps, lock features behind paywalls, inject ads, or redirect scans through private tracking servers. 

**QR Code Generator Free** was built to solve this:
- **100% Free Forever**: All sizes, SVG vector exports, and high-DPI PNGs are completely free.
- **Zero Ads**: Clean, friendly interface with zero clutter or popups.
- **Client-Side Privacy**: All QR codes are generated directly in your browser using JavaScript. No database, no telemetry, and zero contact information ever leaves your device.
- **Works Offline (PWA)**: Install directly to your iPhone, Android, or PC/Mac home screen and use it anytime without an internet connection.

---

## 🚀 Features

- **Standard Contact Card Support (vCard 3.0)**:
  - Universal scanning compatibility with **iOS Camera & Contacts**, **Android**, **macOS**, and **Outlook**.
  - All standard fields supported:
    - 👤 **First Name** & **Last Name**
    - 🏢 **Organization / Company**
    - 💼 **Job Title**
    - 📍 **Position (Work / Department)**
    - 📞 **Phone (Work)**
    - ✉️ **Email**
    - 🌐 **Website**
- **Crisp Export Options**:
  - 📐 **Vector SVG**: Scalable vector graphics with infinite sharpness — perfect for business cards, brochures, laser cutting, and print shops.
  - 🖼️ **High-Resolution PNG**: Crisp pixel dimensions from **256px** up to **4096px** print resolution.
  - 🔲 **Transparent Background**: Supported for both SVG and PNG exports.
- **Customizable Styling**:
  - Pattern Shapes: Classic Square, Soft Rounded, or Modern Dots.
  - Color Picker: Customizable foreground and background colors with instant swatches.
  - Outer border padding (margin) & error correction levels (L, M, Q, H).
- **Interactive Tools**:
  - 📱 **Live Contact Card Preview**: See how the contact appears on a smartphone.
  - 📋 **Copy to Clipboard**: Copy high-res PNG image or contact data in 1 click.
  - 💾 **Download .vcf File**: Direct contact file export.
- **Installable PWA**:
  - Install as a native-like app on Android, iOS, Windows, Mac, or Linux.
  - Full offline capability powered by Service Worker caching.

---

## 📲 How to Install as an App (PWA)

### On Desktop (Chrome / Edge / Brave):
1. Open the website in your browser.
2. Click the **"Install App"** button in the top menu bar or click the install icon in the browser address bar.

### On Android:
1. Open the website in Chrome or your default browser.
2. Tap the **"Install App"** banner or tap browser menu (⋮) &rarr; **"Install app"** / **"Add to Home screen"**.

### On iPhone / iPad (Safari):
1. Open the website in Safari.
2. Tap the **Share** button (⎋) at the bottom.
3. Scroll down and tap **"Add to Home Screen"** (⊕), then tap **Add**.

---

## 💻 Local Testing & Preview

Run locally with any simple HTTP server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 📁 File Structure

```
├── index.html                 # Clean, light-tone UI layout & form
├── manifest.json              # PWA Web App Manifest
├── sw.js                      # PWA Service Worker for offline caching
├── css/
│   └── style.css              # Light-tone design system, friendly colors & responsive grid
├── js/
│   ├── qrcode.min.js          # Client-side QR engine
│   └── app.js                 # Contact compiler, SVG/PNG renderer & PWA install prompts
└── assets/
    ├── icon.svg               # Scalable app icon
    ├── favicon.svg            # Browser tab icon
    ├── icon-192.png           # 192x192 PWA icon
    └── icon-512.png           # 512x512 PWA icon
```

---

## 📄 License

MIT License. 100% Free and Open-Source.

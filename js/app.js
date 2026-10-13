/**
 * QR Code Generator Free - Client Application Logic
 * 100% Free, Ad-Free, Open-Source & Privacy-First (Client-Side Rendering)
 * Supports RFC 2426 vCard 3.0, vector SVG, high-res PNG (up to 4096px), and PWA offline install
 */

(function () {
  'use strict';

  // --- State Configuration ---
  const state = {
    firstName: 'Alex',
    lastName: 'Morgan',
    organization: 'Acme Corp',
    jobTitle: 'Lead Designer',
    position: 'Design & Innovation Team',
    phone: '+1 (555) 789-0123',
    email: 'alex@example.com',
    website: 'https://mywebsite.com',

    // QR Configuration
    size: 1024,
    ecLevel: 'M', // L, M, Q, H
    margin: 2, // Quiet zone modules
    patternStyle: 'square', // square, rounded, dots
    fgColor: '#0F172A',
    bgColor: '#FFFFFF',
    transparentBg: false,
    
    // Cached QR object & vcard string
    currentVCard: '',
    currentQr: null
  };

  // --- PWA Installation Deferred Prompt ---
  let deferredPrompt = null;

  // --- DOM Elements ---
  const elements = {
    // Inputs
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    organization: document.getElementById('organization'),
    jobTitle: document.getElementById('jobTitle'),
    position: document.getElementById('position'),
    phone: document.getElementById('phone'),
    email: document.getElementById('email'),
    website: document.getElementById('website'),

    // Quick Action Buttons
    fillSampleBtn: document.getElementById('fillSampleBtn'),
    clearFieldsBtn: document.getElementById('clearFieldsBtn'),

    // Size controls
    sizePresets: document.getElementById('sizePresets'),
    sizeSlider: document.getElementById('sizeSlider'),
    customSizeInput: document.getElementById('customSizeInput'),
    currentSizeLabel: document.getElementById('currentSizeLabel'),
    pngBtnSizeText: document.getElementById('pngBtnSizeText'),
    qrMetaResolution: document.getElementById('qrMetaResolution'),

    // Pattern and EC controls
    moduleStyleGroup: document.getElementById('moduleStyleGroup'),
    ecLevelGroup: document.getElementById('ecLevelGroup'),
    marginGroup: document.getElementById('marginGroup'),

    // Color controls
    fgColorPicker: document.getElementById('fgColorPicker'),
    fgColorText: document.getElementById('fgColorText'),
    fgSwatches: document.getElementById('fgSwatches'),
    bgColorPicker: document.getElementById('bgColorPicker'),
    bgColorText: document.getElementById('bgColorText'),
    transparentBg: document.getElementById('transparentBg'),

    // Display & Preview
    qrOutput: document.getElementById('qrOutput'),
    qrDisplayFrame: document.getElementById('qrDisplayFrame'),
    qrEmptyPlaceholder: document.getElementById('qrEmptyPlaceholder'),
    qrMetaModules: document.getElementById('qrMetaModules'),

    // Export Buttons
    downloadSvgBtn: document.getElementById('downloadSvgBtn'),
    downloadPngBtn: document.getElementById('downloadPngBtn'),
    copyImageBtn: document.getElementById('copyImageBtn'),
    downloadVcfBtn: document.getElementById('downloadVcfBtn'),
    testScanBtn: document.getElementById('testScanBtn'),

    // Tabs
    tabNavBtns: document.querySelectorAll('.tab-nav-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Mockup
    mockAvatar: document.getElementById('mockAvatar'),
    mockName: document.getElementById('mockName'),
    mockJob: document.getElementById('mockJob'),
    mockCompany: document.getElementById('mockCompany'),
    mockDept: document.getElementById('mockDept'),
    mockPhoneLink: document.getElementById('mockPhoneLink'),
    mockPhoneText: document.getElementById('mockPhoneText'),
    mockEmailLink: document.getElementById('mockEmailLink'),
    mockEmailText: document.getElementById('mockEmailText'),
    mockWebLink: document.getElementById('mockWebLink'),
    mockWebText: document.getElementById('mockWebText'),

    // Code Inspector
    vcardRawOutput: document.getElementById('vcardRawOutput'),
    copyVcardBtn: document.getElementById('copyVcardBtn'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer'),

    // Canvas
    exportCanvas: document.getElementById('exportCanvas'),

    // Theme Toggle
    themeToggleBtn: document.getElementById('themeToggleBtn'),

    // PWA Elements
    pwaFloatingPrompt: document.getElementById('pwaFloatingPrompt'),
    pwaPromptInstallBtn: document.getElementById('pwaPromptInstallBtn'),
    pwaPromptCloseBtn: document.getElementById('pwaPromptCloseBtn'),
    installAppHeaderBtn: document.getElementById('installAppHeaderBtn'),
    iosInstallModal: document.getElementById('iosInstallModal'),
    closeIosModalBtn: document.getElementById('closeIosModalBtn'),
    dismissIosModalBtn: document.getElementById('dismissIosModalBtn')
  };

  // --- Utility: Escaping for RFC 2426 vCard 3.0 ---
  function escapeVCard(value) {
    if (!value) return '';
    return String(value)
      .trim()
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  // --- Build vCard 3.0 Formatted String ---
  function buildVCard3(data) {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0'
    ];

    const fn = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
    const lastNameEsc = escapeVCard(data.lastName);
    const firstNameEsc = escapeVCard(data.firstName);

    // Formatted Name (Mandatory in vCard 3.0)
    if (fn) {
      lines.push(`FN:${escapeVCard(fn)}`);
      lines.push(`N:${lastNameEsc};${firstNameEsc};;;`);
    } else {
      lines.push(`FN:Contact`);
      lines.push(`N:;;;;`);
    }

    // Organization & Department / Position
    if (data.organization || data.position) {
      const orgParts = [];
      if (data.organization) orgParts.push(escapeVCard(data.organization));
      if (data.position) orgParts.push(escapeVCard(data.position));
      lines.push(`ORG:${orgParts.join(';')}`);
    }

    // Job Title
    if (data.jobTitle) {
      lines.push(`TITLE:${escapeVCard(data.jobTitle)}`);
    }

    // Work Role / Position
    if (data.position) {
      lines.push(`ROLE:${escapeVCard(data.position)}`);
    }

    // Work Phone
    if (data.phone) {
      lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(data.phone)}`);
    }

    // Work Email
    if (data.email) {
      lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCard(data.email)}`);
    }

    // Website
    if (data.website) {
      let url = data.website.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      lines.push(`URL:${escapeVCard(url)}`);
    }

    // Timestamp
    lines.push(`REV:${new Date().toISOString()}`);
    lines.push('END:VCARD');

    // Standard RFC 2426 CRLF line endings
    return lines.join('\r\n');
  }

  // --- Helper: Check if module belongs to finder pattern ---
  function isFinderPattern(row, col, moduleCount) {
    // Top-left finder
    if (row < 7 && col < 7) return true;
    // Top-right finder
    if (row < 7 && col >= moduleCount - 7) return true;
    // Bottom-left finder
    if (row >= moduleCount - 7 && col < 7) return true;
    return false;
  }

  // --- Generate SVG String ---
  function generateSvg(qr, options) {
    const moduleCount = qr.getModuleCount();
    const margin = options.margin;
    const totalModules = moduleCount + margin * 2;
    const size = options.size;
    const cellSize = size / totalModules;
    const fg = options.fgColor;
    const bg = options.bgColor;
    const style = options.patternStyle;

    let svgParts = [];
    svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="geometricPrecision">`);

    // Background rect
    if (!options.transparentBg) {
      svgParts.push(`<rect width="100%" height="100%" fill="${bg}"/>`);
    }

    // Group for modules
    svgParts.push(`<g fill="${fg}">`);

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          const x = (c + margin) * cellSize;
          const y = (r + margin) * cellSize;
          const isFinder = isFinderPattern(r, c, moduleCount);

          if (isFinder || style === 'square') {
            // Standard crisp square
            svgParts.push(`<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${cellSize.toFixed(3)}" height="${cellSize.toFixed(3)}"/>`);
          } else if (style === 'rounded') {
            const rx = (cellSize * 0.35).toFixed(3);
            svgParts.push(`<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${cellSize.toFixed(3)}" height="${cellSize.toFixed(3)}" rx="${rx}"/>`);
          } else if (style === 'dots') {
            const cx = (x + cellSize / 2).toFixed(3);
            const cy = (y + cellSize / 2).toFixed(3);
            const radius = (cellSize * 0.44).toFixed(3);
            svgParts.push(`<circle cx="${cx}" cy="${cy}" r="${radius}"/>`);
          }
        }
      }
    }

    svgParts.push(`</g>`);
    svgParts.push(`</svg>`);

    return svgParts.join('\n');
  }

  // --- Render to HTML5 Canvas (for high-DPI PNG) ---
  function renderToCanvas(canvas, qr, options) {
    const moduleCount = qr.getModuleCount();
    const margin = options.margin;
    const totalModules = moduleCount + margin * 2;
    const size = options.size;
    const cellSize = size / totalModules;
    const fg = options.fgColor;
    const bg = options.bgColor;
    const style = options.patternStyle;

    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Reset & Clear
    ctx.clearRect(0, 0, size, size);

    // Draw Background
    if (!options.transparentBg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
    }

    // Draw Modules
    ctx.fillStyle = fg;

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          const x = (c + margin) * cellSize;
          const y = (r + margin) * cellSize;
          const isFinder = isFinderPattern(r, c, moduleCount);

          if (isFinder || style === 'square') {
            ctx.fillRect(x, y, cellSize, cellSize);
          } else if (style === 'rounded') {
            const radius = cellSize * 0.35;
            ctx.beginPath();
            ctx.roundRect(x, y, cellSize, cellSize, radius);
            ctx.fill();
          } else if (style === 'dots') {
            const radius = cellSize * 0.44;
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  // --- Render QR Code ---
  function updateQRCode() {
    // Collect form state
    state.firstName = elements.firstName.value.trim();
    state.lastName = elements.lastName.value.trim();
    state.organization = elements.organization.value.trim();
    state.jobTitle = elements.jobTitle.value.trim();
    state.position = elements.position.value.trim();
    state.phone = elements.phone.value.trim();
    state.email = elements.email.value.trim();
    state.website = elements.website.value.trim();

    // Generate RFC 2426 vCard string
    const vcard = buildVCard3(state);
    state.currentVCard = vcard;

    // Update raw code viewer
    elements.vcardRawOutput.textContent = vcard;

    // Update Digital Phone Mockup
    updateMockup();

    // Check if at least one field has text
    const hasData = state.firstName || state.lastName || state.organization || state.phone || state.email || state.website;
    if (!hasData) {
      elements.qrOutput.innerHTML = '';
      elements.qrOutput.classList.add('hidden');
      elements.qrEmptyPlaceholder.classList.remove('hidden');
      elements.qrMetaModules.textContent = 'Version: Auto';
      elements.qrDisplayFrame.style.backgroundColor = '#FFFFFF';
      elements.qrDisplayFrame.style.backgroundImage = 'none';
      state.currentQr = null;
      return;
    }
    elements.qrOutput.classList.remove('hidden');
    elements.qrEmptyPlaceholder.classList.add('hidden');

    try {
      // Initialize qrcode-generator: Type 0 (auto-detect version)
      const qr = window.qrcode(0, state.ecLevel);
      qr.addData(vcard);
      qr.make();
      state.currentQr = qr;

      const moduleCount = qr.getModuleCount();
      elements.qrMetaModules.textContent = `Grid: ${moduleCount}×${moduleCount} (${state.ecLevel} 15%)`;

      // Generate SVG for interactive display frame (preview size 280px)
      const previewSvg = generateSvg(qr, {
        ...state,
        size: 280
      });

      elements.qrOutput.innerHTML = previewSvg;

      // Update frame background color according to transparency
      elements.qrDisplayFrame.style.backgroundColor = state.transparentBg ? 'transparent' : state.bgColor;
      if (state.transparentBg) {
        elements.qrDisplayFrame.style.backgroundImage = 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)';
        elements.qrDisplayFrame.style.backgroundSize = '16px 16px';
        elements.qrDisplayFrame.style.backgroundPosition = '0 0, 0 8px, 8px -8px, -8px 0px';
      } else {
        elements.qrDisplayFrame.style.backgroundImage = 'none';
      }

      // Save to localStorage
      saveState();

    } catch (err) {
      console.error('Error generating QR code:', err);
      showToast('Error compiling QR code. Try reducing text size or lowering EC.', 'error');
    }
  }

  // --- Update Phone Mockup UI ---
  function updateMockup() {
    const fn = [state.firstName, state.lastName].filter(Boolean).join(' ').trim() || 'Your Name';
    elements.mockName.textContent = fn;

    // Initials Avatar
    const i1 = state.firstName ? state.firstName.charAt(0).toUpperCase() : '';
    const i2 = state.lastName ? state.lastName.charAt(0).toUpperCase() : '';
    elements.mockAvatar.textContent = (i1 + i2) || 'QR';

    // Job Title & Company
    elements.mockJob.textContent = state.jobTitle || 'Job Title';
    elements.mockCompany.textContent = state.organization || 'Organization / Company';
    elements.mockDept.textContent = state.position || 'Department / Role';

    // Phone
    if (state.phone) {
      elements.mockPhoneText.textContent = state.phone;
      elements.mockPhoneLink.href = `tel:${state.phone.replace(/[^0-9+]/g, '')}`;
      elements.mockPhoneLink.style.display = 'flex';
    } else {
      elements.mockPhoneLink.style.display = 'none';
    }

    // Email
    if (state.email) {
      elements.mockEmailText.textContent = state.email;
      elements.mockEmailLink.href = `mailto:${state.email}`;
      elements.mockEmailLink.style.display = 'flex';
    } else {
      elements.mockEmailLink.style.display = 'none';
    }

    // Website
    if (state.website) {
      let web = state.website.trim();
      elements.mockWebText.textContent = web;
      if (!/^https?:\/\//i.test(web)) web = 'https://' + web;
      elements.mockWebLink.href = web;
      elements.mockWebLink.style.display = 'flex';
    } else {
      elements.mockWebLink.style.display = 'none';
    }
  }

  // --- Download Helper ---
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // --- Filename Generator ---
  function getSafeFilename(extension) {
    const name = [state.firstName, state.lastName].filter(Boolean).join('_').toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'contact';
    return `qr_free_${name}_${state.size}px.${extension}`;
  }

  // --- Export SVG ---
  function downloadSvg() {
    if (!state.currentQr) {
      showToast('Please enter contact details first', 'error');
      return;
    }

    const svgContent = generateSvg(state.currentQr, {
      ...state,
      size: state.size
    });

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, getSafeFilename('svg'));
    showToast(`Downloaded vector SVG (${state.size}×${state.size})!`);
  }

  // --- Export PNG ---
  function downloadPng() {
    if (!state.currentQr) {
      showToast('Please enter contact details first', 'error');
      return;
    }

    renderToCanvas(elements.exportCanvas, state.currentQr, {
      ...state,
      size: state.size
    });

    elements.exportCanvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, getSafeFilename('png'));
        showToast(`Downloaded PNG at ${state.size} × ${state.size} px!`);
      } else {
        showToast('Failed to export PNG', 'error');
      }
    }, 'image/png');
  }

  // --- Copy Image to Clipboard ---
  async function copyImageToClipboard() {
    if (!state.currentQr) {
      showToast('Please enter contact details first', 'error');
      return;
    }

    try {
      renderToCanvas(elements.exportCanvas, state.currentQr, {
        ...state,
        size: Math.min(state.size, 1024)
      });

      elements.exportCanvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('Could not convert image to blob', 'error');
          return;
        }
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showToast('QR Code image copied to clipboard!');
      }, 'image/png');
    } catch (err) {
      console.warn('Clipboard write error:', err);
      showToast('Clipboard access unavailable or unsupported in this browser', 'error');
    }
  }

  // --- Export .vcf File ---
  function downloadVcf() {
    if (!state.currentVCard) {
      showToast('Please enter contact info first', 'error');
      return;
    }

    const blob = new Blob([state.currentVCard], { type: 'text/vcard;charset=utf-8' });
    const name = [state.firstName, state.lastName].filter(Boolean).join('_').toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'contact';
    downloadBlob(blob, `${name}.vcf`);
    showToast('Downloaded .vcf file (vCard 3.0)!');
  }

  // --- Copy Raw vCard Text ---
  async function copyVCardText() {
    if (!state.currentVCard) return;
    try {
      await navigator.clipboard.writeText(state.currentVCard);
      showToast('vCard text copied to clipboard!');
    } catch (err) {
      showToast('Clipboard write failed', 'error');
    }
  }

  // --- Simulate Scan ---
  function simulateScan() {
    if (!state.firstName && !state.lastName && !state.phone && !state.email) {
      showToast('Enter contact details to simulate scan', 'error');
      return;
    }
    const name = [state.firstName, state.lastName].filter(Boolean).join(' ') || 'Contact';
    showToast(`Scanned: Add "${name}" to Contacts`);
    switchTab('cardTab');
  }

  // --- Size Change Handler ---
  function setSize(newSize) {
    const size = Math.max(128, Math.min(4096, parseInt(newSize, 10) || 1024));
    state.size = size;

    // Update controls
    elements.sizeSlider.value = size;
    elements.customSizeInput.value = size;
    elements.currentSizeLabel.textContent = `${size} × ${size} px`;
    elements.pngBtnSizeText.textContent = `Download ${size}px PNG`;
    elements.qrMetaResolution.textContent = `Export Size: ${size} × ${size} px`;

    // Update active pill button
    const pills = elements.sizePresets.querySelectorAll('.pill-btn');
    pills.forEach((btn) => {
      if (parseInt(btn.dataset.size, 10) === size) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    updateQRCode();
  }

  // --- Toast Notification System ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconSvg = type === 'success'
      ? `<svg class="icon-sm toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`
      : `<svg class="icon-sm toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.25s forwards';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // --- Tab Navigation ---
  function switchTab(tabId) {
    elements.tabNavBtns.forEach((btn) => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    elements.tabPanes.forEach((pane) => {
      if (pane.id === tabId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  // --- Sample Demo Fill ---
  function fillSampleData() {
    elements.firstName.value = 'Alex';
    elements.lastName.value = 'Morgan';
    elements.organization = elements.organization;
    elements.organization.value = 'Acme Corp';
    elements.jobTitle.value = 'Lead Designer';
    elements.position.value = 'Design & Innovation Team';
    elements.phone.value = '+1 (555) 789-0123';
    elements.email.value = 'alex@example.com';
    elements.website.value = 'https://mywebsite.com';

    updateQRCode();
    showToast('Loaded sample contact details!');
  }

  // --- Clear Form ---
  function clearFields() {
    elements.firstName.value = '';
    elements.lastName.value = '';
    elements.organization.value = '';
    elements.jobTitle.value = '';
    elements.position.value = '';
    elements.phone.value = '';
    elements.email.value = '';
    elements.website.value = '';

    updateQRCode();
    showToast('Cleared all fields');
  }

  // --- Persistence with localStorage ---
  function saveState() {
    try {
      const data = {
        firstName: state.firstName,
        lastName: state.lastName,
        organization: state.organization,
        jobTitle: state.jobTitle,
        position: state.position,
        phone: state.phone,
        email: state.email,
        website: state.website,
        size: state.size,
        ecLevel: state.ecLevel,
        patternStyle: state.patternStyle,
        fgColor: state.fgColor,
        bgColor: state.bgColor,
        margin: state.margin,
        transparentBg: state.transparentBg
      };
      localStorage.setItem('qr_free_state', JSON.stringify(data));
    } catch (e) {
      // Ignore quota issues
    }
  }

  function loadSavedState() {
    try {
      const saved = localStorage.getItem('qr_free_state');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.firstName !== undefined) elements.firstName.value = data.firstName;
        if (data.lastName !== undefined) elements.lastName.value = data.lastName;
        if (data.organization !== undefined) elements.organization.value = data.organization;
        if (data.jobTitle !== undefined) elements.jobTitle.value = data.jobTitle;
        if (data.position !== undefined) elements.position.value = data.position;
        if (data.phone !== undefined) elements.phone.value = data.phone;
        if (data.email !== undefined) elements.email.value = data.email;
        if (data.website !== undefined) elements.website.value = data.website;

        if (data.size) setSize(data.size);
        if (data.ecLevel) state.ecLevel = data.ecLevel;
        if (data.patternStyle) state.patternStyle = data.patternStyle;
        if (data.fgColor) {
          state.fgColor = data.fgColor;
          elements.fgColorPicker.value = data.fgColor;
          elements.fgColorText.value = data.fgColor;
        }
        if (data.bgColor) {
          state.bgColor = data.bgColor;
          elements.bgColorPicker.value = data.bgColor;
          elements.bgColorText.value = data.bgColor;
        }
        if (data.transparentBg !== undefined) {
          state.transparentBg = data.transparentBg;
          elements.transparentBg.checked = data.transparentBg;
        }
        if (data.margin !== undefined) state.margin = data.margin;

        // Sync EC buttons
        elements.ecLevelGroup.querySelectorAll('.segment-btn').forEach((b) => {
          b.classList.toggle('active', b.dataset.ec === state.ecLevel);
        });

        // Sync Pattern buttons
        elements.moduleStyleGroup.querySelectorAll('.segment-btn').forEach((b) => {
          b.classList.toggle('active', b.dataset.style === state.patternStyle);
        });

        // Sync Margin buttons
        elements.marginGroup.querySelectorAll('.segment-btn').forEach((b) => {
          b.classList.toggle('active', parseInt(b.dataset.margin, 10) === state.margin);
        });
      } else {
        fillSampleData();
      }
    } catch (e) {
      fillSampleData();
    }
  }

  // --- Theme Setup (Defaults to Light Tone) ---
  function initTheme() {
    const savedTheme = localStorage.getItem('qr_free_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    elements.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('qr_free_theme', next);
    });
  }

  // --- PWA Setup & Install Prompt Logic ---
  function initPWA() {
    // Register Service Worker for offline support
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => console.log('PWA ServiceWorker registered:', reg.scope))
          .catch((err) => console.warn('PWA ServiceWorker error:', err));
      });
    }

    // Capture install prompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Reveal install button in header
      if (elements.installAppHeaderBtn) {
        elements.installAppHeaderBtn.classList.remove('hidden');
      }

      // Reveal floating card prompt after a short delay if not dismissed
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed && elements.pwaFloatingPrompt) {
        setTimeout(() => {
          if (!sessionStorage.getItem('pwa_prompt_dismissed') && elements.pwaFloatingPrompt) {
            elements.pwaFloatingPrompt.classList.remove('hidden');
          }
        }, 1800);
      }
    });

    // Handle App Installed event
    window.addEventListener('appinstalled', () => {
      showToast('App installed successfully! Enjoy offline use. 🎉');
      if (elements.installAppHeaderBtn) elements.installAppHeaderBtn.classList.add('hidden');
      if (elements.pwaFloatingPrompt) elements.pwaFloatingPrompt.classList.add('hidden');
      deferredPrompt = null;
    });

    // Helper: Trigger install
    async function promptInstall() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          showToast('Installing app... 🎉');
          if (elements.installAppHeaderBtn) elements.installAppHeaderBtn.classList.add('hidden');
          if (elements.pwaFloatingPrompt) elements.pwaFloatingPrompt.classList.add('hidden');
        }
        deferredPrompt = null;
      } else {
        // Fallback for iOS Safari or already installed
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS && elements.iosInstallModal) {
          elements.iosInstallModal.classList.remove('hidden');
        } else {
          showToast('To install, open your browser menu and choose "Add to Home Screen" or "Install App"');
        }
      }
    }

    // Header install button click
    if (elements.installAppHeaderBtn) {
      elements.installAppHeaderBtn.addEventListener('click', promptInstall);
    }

    // Floating prompt install button click
    if (elements.pwaPromptInstallBtn) {
      elements.pwaPromptInstallBtn.addEventListener('click', promptInstall);
    }

    // Floating prompt dismiss click
    if (elements.pwaPromptCloseBtn) {
      elements.pwaPromptCloseBtn.addEventListener('click', () => {
        if (elements.pwaFloatingPrompt) elements.pwaFloatingPrompt.classList.add('hidden');
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
      });
    }

    // iOS Modal close handlers
    if (elements.closeIosModalBtn) {
      elements.closeIosModalBtn.addEventListener('click', () => {
        elements.iosInstallModal.classList.add('hidden');
      });
    }
    if (elements.dismissIosModalBtn) {
      elements.dismissIosModalBtn.addEventListener('click', () => {
        elements.iosInstallModal.classList.add('hidden');
      });
    }
    if (elements.iosInstallModal) {
      elements.iosInstallModal.addEventListener('click', (e) => {
        if (e.target === elements.iosInstallModal) {
          elements.iosInstallModal.classList.add('hidden');
        }
      });
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Form Inputs - Live sync on every keystroke
    const inputFields = [
      elements.firstName,
      elements.lastName,
      elements.organization,
      elements.jobTitle,
      elements.position,
      elements.phone,
      elements.email,
      elements.website
    ];

    inputFields.forEach((input) => {
      input.addEventListener('input', updateQRCode);
    });

    // Sample & Clear
    elements.fillSampleBtn.addEventListener('click', fillSampleData);
    elements.clearFieldsBtn.addEventListener('click', clearFields);

    // Size Presets
    elements.sizePresets.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (btn && btn.dataset.size) {
        setSize(btn.dataset.size);
      }
    });

    // Slider & Number Input
    elements.sizeSlider.addEventListener('input', (e) => setSize(e.target.value));
    elements.customSizeInput.addEventListener('change', (e) => setSize(e.target.value));

    // Module Style Segmented Control
    elements.moduleStyleGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.segment-btn');
      if (btn && btn.dataset.style) {
        elements.moduleStyleGroup.querySelectorAll('.segment-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.patternStyle = btn.dataset.style;
        updateQRCode();
      }
    });

    // EC Level Segmented Control
    elements.ecLevelGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.segment-btn');
      if (btn && btn.dataset.ec) {
        elements.ecLevelGroup.querySelectorAll('.segment-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.ecLevel = btn.dataset.ec;
        updateQRCode();
      }
    });

    // Margin Segmented Control
    elements.marginGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.segment-btn');
      if (btn && btn.dataset.margin) {
        elements.marginGroup.querySelectorAll('.segment-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.margin = parseInt(btn.dataset.margin, 10);
        updateQRCode();
      }
    });

    // Foreground Color Picker & Text
    elements.fgColorPicker.addEventListener('input', (e) => {
      state.fgColor = e.target.value;
      elements.fgColorText.value = e.target.value;
      updateQRCode();
    });

    elements.fgColorText.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        state.fgColor = val;
        elements.fgColorPicker.value = val;
        updateQRCode();
      }
    });

    // Color Swatches
    elements.fgSwatches.addEventListener('click', (e) => {
      const btn = e.target.closest('.swatch-btn');
      if (btn && btn.dataset.color) {
        const color = btn.dataset.color;
        state.fgColor = color;
        elements.fgColorPicker.value = color;
        elements.fgColorText.value = color;
        updateQRCode();
      }
    });

    // Background Color Picker & Text
    elements.bgColorPicker.addEventListener('input', (e) => {
      state.bgColor = e.target.value;
      elements.bgColorText.value = e.target.value;
      updateQRCode();
    });

    elements.bgColorText.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        state.bgColor = val;
        elements.bgColorPicker.value = val;
        updateQRCode();
      }
    });

    // Transparent Background Checkbox
    elements.transparentBg.addEventListener('change', (e) => {
      state.transparentBg = e.target.checked;
      updateQRCode();
    });

    // Download & Export Handlers
    elements.downloadSvgBtn.addEventListener('click', downloadSvg);
    elements.downloadPngBtn.addEventListener('click', downloadPng);
    elements.copyImageBtn.addEventListener('click', copyImageToClipboard);
    elements.downloadVcfBtn.addEventListener('click', downloadVcf);
    elements.testScanBtn.addEventListener('click', simulateScan);
    elements.copyVcardBtn.addEventListener('click', copyVCardText);

    // Tab Navigation
    elements.tabNavBtns.forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  // --- GitHub Repository Link Binding ---
  const GITHUB_REPO_URL = 'https://github.com/iam-rocketman/Privacy-first-QR-code-generator';

  function initLinks() {
    const ghHeader = document.getElementById('githubRepoLink');
    if (ghHeader) {
      ghHeader.href = GITHUB_REPO_URL;
      ghHeader.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer');
      });
    }
    const ghFooter = document.getElementById('footerGithubLink');
    if (ghFooter) {
      ghFooter.href = GITHUB_REPO_URL;
      ghFooter.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer');
      });
    }
  }

  // --- Initialize Application ---
  function init() {
    initTheme();
    initPWA();
    initLinks();
    setupEventListeners();
    loadSavedState();
    updateQRCode();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

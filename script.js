/**
 * RADIO GRAVITY — EXPERIMENTAL AUDIOVISUAL ENGINE
 * Real-time Web Audio API Analysis, Generative Three.js WebGL Scene, Dual Spectrum Oscilloscope
 * Performance Optimized: Adaptive Mobile Geometry, Battery Saver, prefers-reduced-motion
 */

(function () {
  'use strict';

  // System capability checks
  const isMobile = window.innerWidth < 768;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =========================================================================
  // 1. Audio Streaming Core & Web Audio Frequency Analyzer
  // =========================================================================
  const audio = document.getElementById('miRadio');
  const btnHeroPlay = document.getElementById('btnHeroPlay');
  const btnMasterPlay = document.getElementById('btnMasterPlay');
  const btnDockPlay = document.getElementById('btnDockPlay');
  const btnNavListen = document.getElementById('btnNavListen');
  const vinylDisc = document.getElementById('vinylCenterDisc');
  const masterPlayIcon = document.getElementById('masterPlayIcon');
  const heroPlayText = document.getElementById('heroPlayText');
  const playerConnectionStatus = document.getElementById('playerConnectionStatus');
  const dockLiveStatus = document.getElementById('dockLiveStatus');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumePercent = document.getElementById('volumePercent');
  const btnMute = document.getElementById('btnMute');
  const muteIcon = document.getElementById('muteIcon');
  const floatingDock = document.getElementById('floatingDock');

  let isPlaying = false;
  let previousVolume = 0.85;

  // Web Audio Context & Synthesizer
  let audioCtx = null;
  let analyser = null;
  let rawFreqData = null;
  const FFT_SIZE = 128;

  if (audio) {
    audio.volume = 0.85;
  }

  // Play/Pause Icons SVG
  const SVG_PLAY = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  const SVG_PAUSE = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
  const heroPlayIcon = btnHeroPlay ? btnHeroPlay.querySelector('svg') : null;

  function setLoadingState(message) {
    const text = message || 'Conectando al streaming...';
    if (heroPlayText) {
      heroPlayText.textContent = 'Conectando...';
    }
    if (btnNavListen) {
      btnNavListen.innerHTML = '<span class="live-beacon live-beacon-orange pulse-fast"></span> Conectando...';
    }
    if (playerConnectionStatus) {
      playerConnectionStatus.innerHTML = `<span class="live-beacon live-beacon-orange pulse-fast"></span> ${text}`;
    }
    if (dockLiveStatus) {
      dockLiveStatus.innerHTML = '<span class="live-beacon live-beacon-orange pulse-fast"></span> CONECTANDO';
    }
  }

  function setErrorState(message) {
    isPlaying = false;
    const text = message || 'Error al conectar con el streaming';

    if (heroPlayIcon) {
      heroPlayIcon.innerHTML = SVG_PLAY;
    }
    if (heroPlayText) {
      heroPlayText.textContent = 'Reintentar Transmisión';
    }
    if (masterPlayIcon) {
      masterPlayIcon.innerHTML = SVG_PLAY;
    }
    if (btnNavListen) {
      btnNavListen.innerHTML = '<span class="live-beacon live-beacon-red"></span> Reintentar';
    }
    if (btnDockPlay) {
      const dockSvg = btnDockPlay.querySelector('svg');
      if (dockSvg) dockSvg.innerHTML = SVG_PLAY;
    }
    if (vinylDisc) {
      vinylDisc.classList.remove('spinning-vinyl');
    }
    if (playerConnectionStatus) {
      playerConnectionStatus.innerHTML = `<span class="live-beacon live-beacon-red"></span> ${text} (Toca para reintentar)`;
    }
    if (dockLiveStatus) {
      dockLiveStatus.innerHTML = '<span class="live-beacon live-beacon-red"></span> ERROR';
    }
  }

  function updatePlayUI(playing) {
    isPlaying = playing;

    if (heroPlayIcon) {
      heroPlayIcon.innerHTML = playing ? SVG_PAUSE : SVG_PLAY;
    }

    if (heroPlayText) {
      heroPlayText.textContent = playing ? 'Pausar Transmisión' : 'Escuchar en Vivo';
    }

    if (masterPlayIcon) {
      masterPlayIcon.innerHTML = playing ? SVG_PAUSE : SVG_PLAY;
    }

    if (btnNavListen) {
      btnNavListen.innerHTML = playing
        ? '<span class="live-beacon live-beacon-green"></span> Pausar'
        : '<span class="live-beacon"></span> En Vivo';
    }

    if (btnDockPlay) {
      const dockSvg = btnDockPlay.querySelector('svg');
      if (dockSvg) dockSvg.innerHTML = playing ? SVG_PAUSE : SVG_PLAY;
    }

    if (vinylDisc) {
      if (playing && !prefersReducedMotion) {
        vinylDisc.classList.add('spinning-vinyl');
      } else {
        vinylDisc.classList.remove('spinning-vinyl');
      }
    }

    if (playerConnectionStatus) {
      playerConnectionStatus.innerHTML = playing
        ? '<span class="live-beacon live-beacon-green"></span> Transmitiendo en directo'
        : '<span class="live-beacon"></span> Transmisión pausada';
    }

    if (dockLiveStatus) {
      dockLiveStatus.innerHTML = playing
        ? '<span class="live-beacon live-beacon-green"></span> EN VIVO'
        : '<span class="live-beacon"></span> PAUSADO';
    }
  }

  async function togglePlayback() {
    if (!audio) return;

    if (audio.paused) {
      setLoadingState('Conectando al streaming...');

      try {
        await audio.play();
        updatePlayUI(true);
      } catch (err) {
        console.warn('Playback error or policy restriction:', err);
        setErrorState('Toca para iniciar reproducción');
      }
    } else {
      audio.pause();
      updatePlayUI(false);
    }
  }

  [btnHeroPlay, btnMasterPlay, btnDockPlay, btnNavListen].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      togglePlayback();
    });
  });

  if (audio) {
    audio.addEventListener('loadstart', () => {
      if (!audio.paused) setLoadingState('Conectando al streaming...');
    });
    audio.addEventListener('waiting', () => {
      setLoadingState('Sincronizando buffer...');
    });
    audio.addEventListener('stalled', () => {
      if (!audio.paused) setLoadingState('Esperando datos de streaming...');
    });
    audio.addEventListener('playing', () => {
      updatePlayUI(true);
    });
    audio.addEventListener('pause', () => {
      updatePlayUI(false);
    });
    audio.addEventListener('error', () => {
      console.error('Audio stream error:', audio.error);
      setErrorState('Fallo al conectar con el servidor de streaming');
    });
  }

  // Volume slider
  if (volumeSlider) {
    volumeSlider.value = 85;
    volumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 100;
      if (audio) audio.volume = val;
      if (volumePercent) volumePercent.textContent = `${Math.round(val * 100)}%`;
      updateMuteUI(val === 0);
    });
  }

  function updateMuteUI(muted) {
    if (!muteIcon) return;
    if (muted) {
      muteIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      `;
    } else {
      muteIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      `;
    }
  }

  if (btnMute) {
    btnMute.addEventListener('click', () => {
      if (!audio) return;
      if (audio.muted || audio.volume === 0) {
        audio.muted = false;
        audio.volume = previousVolume > 0 ? previousVolume : 0.85;
        if (volumeSlider) volumeSlider.value = Math.round(audio.volume * 100);
        if (volumePercent) volumePercent.textContent = `${Math.round(audio.volume * 100)}%`;
        updateMuteUI(false);
      } else {
        previousVolume = audio.volume;
        audio.muted = true;
        if (volumeSlider) volumeSlider.value = 0;
        if (volumePercent) volumePercent.textContent = '0%';
        updateMuteUI(true);
      }
    });
  }

  // =========================================================================
  // 2. Frequency Analysis & Synthesis Pipeline
  // =========================================================================
  const FREQ_BINS = isMobile ? 36 : 54;
  const currentFrequencies = new Float32Array(FREQ_BINS);
  const peakFrequencies = new Float32Array(FREQ_BINS);

  function getAudioData() {
    let hasRealData = false;
    if (analyser && rawFreqData && isPlaying) {
      analyser.getByteFrequencyData(rawFreqData);
      let sum = 0;
      for (let i = 0; i < rawFreqData.length; i++) sum += rawFreqData[i];
      if (sum > 0) hasRealData = true;
    }

    const t = Date.now() * 0.005;

    for (let i = 0; i < FREQ_BINS; i++) {
      let target = 0;
      if (isPlaying) {
        if (hasRealData) {
          const idx = Math.floor((i / FREQ_BINS) * rawFreqData.length);
          target = rawFreqData[idx] / 255.0;
        } else {
          const bass = Math.sin(t * 1.8 + i * 0.12) * 0.5 + 0.5;
          const mids = Math.cos(t * 3.2 - i * 0.28) * 0.5 + 0.5;
          const highs = Math.sin(t * 5.4 + i * 0.45) * 0.5 + 0.5;
          const falloff = 1 - Math.pow(i / FREQ_BINS, 0.7) * 0.5;
          target = (bass * 0.5 + mids * 0.3 + highs * 0.2) * falloff;
        }
      } else {
        target = 0.04 + Math.sin(t * 0.4 + i * 0.15) * 0.02;
      }

      currentFrequencies[i] += (target - currentFrequencies[i]) * 0.22;

      if (currentFrequencies[i] > peakFrequencies[i]) {
        peakFrequencies[i] = currentFrequencies[i];
      } else {
        peakFrequencies[i] = Math.max(0, peakFrequencies[i] - 0.008);
      }
    }

    return currentFrequencies;
  }

  // =========================================================================
  // 3. Hero Mini Wave Oscilloscope Canvas
  // =========================================================================
  const miniWaveCanvas = document.getElementById('heroMiniWaveCanvas');
  let miniCtx = null;

  if (miniWaveCanvas) {
    miniCtx = miniWaveCanvas.getContext('2d');
    function resizeMiniCanvas() {
      const rect = miniWaveCanvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      miniWaveCanvas.width = (rect.width - 130) * dpr;
      miniWaveCanvas.height = rect.height * dpr;
      if (miniCtx) miniCtx.scale(dpr, dpr);
    }
    resizeMiniCanvas();
    window.addEventListener('resize', resizeMiniCanvas);
  }

  function renderHeroMiniWave() {
    if (!miniCtx || !miniWaveCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = miniWaveCanvas.width / dpr;
    const h = miniWaveCanvas.height / dpr;
    const midY = h / 2;

    miniCtx.clearRect(0, 0, w, h);

    const time = Date.now() * 0.006;
    const points = isMobile ? 24 : 36;

    miniCtx.beginPath();
    miniCtx.lineWidth = 2;
    miniCtx.strokeStyle = isPlaying ? '#ff5500' : '#8b5cf6';
    miniCtx.shadowColor = isPlaying ? 'rgba(255, 85, 0, 0.8)' : 'rgba(139, 92, 246, 0.5)';
    miniCtx.shadowBlur = 6;

    for (let i = 0; i < points; i++) {
      const x = (i / (points - 1)) * w;
      let amp = isPlaying ? (currentFrequencies[i % FREQ_BINS] * (h * 0.42)) : 3;
      const y = midY + Math.sin(time + i * 0.35) * amp;
      if (i === 0) miniCtx.moveTo(x, y);
      else miniCtx.lineTo(x, y);
    }
    miniCtx.stroke();
    miniCtx.shadowBlur = 0;
  }

  // =========================================================================
  // 4. Master Player Dual Visualizer (Oscilloscope + Spectrum Equalizer)
  // =========================================================================
  const canvas = document.getElementById('visualizerCanvas');
  let ctx = null;

  if (canvas) {
    ctx = canvas.getContext('2d');
    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      if (ctx) ctx.scale(dpr, dpr);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  let isPageVisible = true;
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
  });

  function renderMasterVisualizer() {
    if (!isPageVisible) {
      setTimeout(renderMasterVisualizer, 150);
      return;
    }

    if (!ctx || !canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.clearRect(0, 0, width, height);

    const freqData = getAudioData();
    const barCount = FREQ_BINS;
    const barWidth = Math.max(2, (width / barCount) - 2.5);

    // 1) Oscilloscope Vector Wave Line
    const time = Date.now() * 0.005;
    ctx.beginPath();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = isPlaying ? 'rgba(56, 189, 248, 0.85)' : 'rgba(139, 92, 246, 0.4)';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
    ctx.shadowBlur = 6;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + 2.5) + barWidth / 2;
      const waveAmp = isPlaying ? freqData[i] * 18 : 3;
      const y = (height * 0.32) + Math.sin(time + i * 0.3) * waveAmp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2) Multi-band Equalizer Bars with Peak Hold
    for (let i = 0; i < barCount; i++) {
      const barHeight = Math.max(3, freqData[i] * (height * 0.85));
      const x = i * (barWidth + 2.5);
      const y = height - barHeight;

      const gradient = ctx.createLinearGradient(0, height, 0, y);
      gradient.addColorStop(0, '#1d4ed8');
      gradient.addColorStop(0.35, '#8b5cf6');
      gradient.addColorStop(0.7, '#ec4899');
      gradient.addColorStop(1, '#ff5500');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]) : ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();

      if (isPlaying) {
        const peakY = height - Math.max(4, peakFrequencies[i] * (height * 0.85));
        ctx.fillStyle = '#ff6e00';
        ctx.fillRect(x, peakY - 2, barWidth, 2);
      }
    }

    renderHeroMiniWave();
    requestAnimationFrame(renderMasterVisualizer);
  }
  renderMasterVisualizer();

  // =========================================================================
  // 5. Dynamic Program Schedule & Live Broadcaster
  // =========================================================================
  const showPrograms = [
    {
      id: 'despertador',
      title: 'El Despertador',
      hoursText: '08:00 - 12:00',
      startHour: 8,
      endHour: 12,
      genre: 'Música y actualidad',
      desc: 'El arranque de tu día con energía, novedades y buena música.'
    },
    {
      id: 'tardes',
      title: 'Tardes de Éxitos',
      hoursText: '14:00 - 18:00',
      startHour: 14,
      endHour: 18,
      genre: 'Éxitos del momento',
      desc: 'Los temas más escuchados, estrenos y los éxitos que marcan el ritmo de tu tarde.'
    },
    {
      id: 'nocturna',
      title: 'Ruta Nocturna',
      hoursText: '20:00 - 00:00',
      startHour: 20,
      endHour: 24,
      genre: 'Música electrónica y relax',
      desc: 'Sesiones suaves, electrónica melódica y un clima relajado para cerrar la jornada.'
    }
  ];

  function evaluateCurrentShow() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeVal = currentHour + currentMinute / 60;

    let activeShow = null;

    for (const prog of showPrograms) {
      if (timeVal >= prog.startHour && timeVal < prog.endHour) {
        activeShow = prog;
        break;
      }
    }

    if (!activeShow) {
      activeShow = {
        id: 'nonstop',
        title: 'Gravity Non-Stop',
        hoursText: 'Transmisión Continua',
        genre: 'Música continua 24 horas',
        desc: 'Música las 24 horas del día sin interrupciones entre programas.'
      };
    }

    const currentShowTitleEl = document.getElementById('currentShowTitle');
    const currentShowDescEl = document.getElementById('currentShowDesc');
    const dockTrackTitleEl = document.getElementById('dockTrackTitle');

    if (currentShowTitleEl) currentShowTitleEl.textContent = activeShow.title;
    if (currentShowDescEl) currentShowDescEl.textContent = `${activeShow.hoursText} • ${activeShow.genre}`;
    if (dockTrackTitleEl) dockTrackTitleEl.textContent = activeShow.title;

    const scheduleRows = document.querySelectorAll('.schedule-row');
    scheduleRows.forEach(row => {
      const rowId = row.getAttribute('data-program-id');
      const badge = row.querySelector('.schedule-badge-status');

      if (!row.hasAttribute('data-default-badge') && badge) {
        row.setAttribute('data-default-badge', badge.textContent.trim());
      }

      if (rowId === activeShow.id) {
        row.classList.add('active-now');
        if (badge) badge.innerHTML = '<span class="live-beacon live-beacon-green"></span> AL AIRE AHORA';
      } else {
        row.classList.remove('active-now');
        if (badge) badge.textContent = row.getAttribute('data-default-badge') || 'DE LUNES A VIERNES';
      }
    });
  }

  evaluateCurrentShow();
  setInterval(evaluateCurrentShow, 30000);

  // =========================================================================
  // 6. Avant-Garde 3D WebGL Audiovisual Scene (Three.js) — Responsive & Adaptive
  // =========================================================================
  function init3DScene() {
    const container = document.getElementById('canvas3dContainer');
    const canvas3d = document.getElementById('canvas3d');
    if (!container || !canvas3d || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    function updateCameraZ() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = height < 550 && width > height;

      if (isLandscape) {
        camera.position.z = 6.0;
      } else if (width < 480) {
        camera.position.z = 8.6;
      } else if (width < 768) {
        camera.position.z = 8.0;
      } else if (width < 1024) {
        camera.position.z = 7.4;
      } else {
        camera.position.z = 6.8;
      }
    }
    updateCameraZ();

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas3d,
      alpha: true,
      antialias: !isMobile, // antialias on desktop, disabled on mobile for maximum battery savings
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Cap pixel ratio to 1.5 on mobile to avoid 4x fragment shader load
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));

    // Studio Multi-Chromatic Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(5, 6, 5);
    scene.add(keyLight);

    // Rim 1: Ultramarine Blue
    const blueRimLight = new THREE.PointLight(0x1d4ed8, 3.5, 25);
    blueRimLight.position.set(-6, -3, 3);
    scene.add(blueRimLight);

    // Rim 2: Cyber Magenta
    const magentaRimLight = new THREE.PointLight(0xec4899, 3.0, 25);
    magentaRimLight.position.set(5, -4, -3);
    scene.add(magentaRimLight);

    // Core Accent: Intense Orange
    const orangeAccentLight = new THREE.PointLight(0xff5500, 3.8, 20);
    orangeAccentLight.position.set(0, 4, 3);
    scene.add(orangeAccentLight);

    // Fill: Electric Violet
    const violetFillLight = new THREE.PointLight(0x8b5cf6, 2.5, 25);
    violetFillLight.position.set(-3, 5, -4);
    scene.add(violetFillLight);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1) Central Liquid Chrome & Glass Metamorphic Torus Knot (Adaptive Segments)
    const tubularSegments = isMobile ? 70 : 140;
    const radialSegments = isMobile ? 18 : 28;
    const knotGeometry = new THREE.TorusKnotGeometry(1.45, 0.38, tubularSegments, radialSegments, 2, 3);
    const knotMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.92,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.98,
      transmission: 0.28,
      opacity: 0.96,
      transparent: true,
      wireframe: false
    });
    const knotMesh = new THREE.Mesh(knotGeometry, knotMaterial);
    mainGroup.add(knotMesh);

    // 2) Orbital Resonance Ring: Ultramarine Blue
    const ringSegs = isMobile ? 64 : 120;
    const ring1Geometry = new THREE.TorusGeometry(2.35, 0.024, 12, ringSegs);
    const ring1Material = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.6
    });
    const ring1Mesh = new THREE.Mesh(ring1Geometry, ring1Material);
    ring1Mesh.rotation.x = Math.PI * 0.35;
    ring1Mesh.rotation.y = Math.PI * 0.15;
    mainGroup.add(ring1Mesh);

    // 3) Orbital Resonance Ring: Cyber Magenta
    const ring2Geometry = new THREE.TorusGeometry(2.55, 0.018, 12, ringSegs);
    const ring2Material = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0xd946ef,
      emissiveIntensity: 0.5
    });
    const ring2Mesh = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2Mesh.rotation.x = -Math.PI * 0.28;
    ring2Mesh.rotation.y = Math.PI * 0.32;
    mainGroup.add(ring2Mesh);

    // 4) Equator Fiery Orange Gyro Ring
    const ring3Geometry = new THREE.TorusGeometry(2.72, 0.012, 12, ringSegs);
    const ring3Material = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0xff5500,
      emissiveIntensity: 0.7
    });
    const ring3Mesh = new THREE.Mesh(ring3Geometry, ring3Material);
    ring3Mesh.rotation.x = Math.PI * 0.5;
    mainGroup.add(ring3Mesh);

    // 5) Cosmic Audiovisual Particle Field (Adaptive count)
    const particleCount = isMobile ? 60 : 180;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 8.5;
      positions[i + 1] = (Math.random() - 0.5) * 6.5;
      positions[i + 2] = (Math.random() - 0.5) * 6.5;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffa366,
      size: isMobile ? 0.045 : 0.038,
      transparent: true,
      opacity: 0.75
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Pointer Interactivity with Lerp
    let targetRotationX = 0;
    let targetRotationY = 0;

    function onPointerMove(e) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.95;
      targetRotationX = y * 0.75;
    }

    container.addEventListener('mousemove', onPointerMove, { passive: true });
    container.addEventListener('touchmove', onPointerMove, { passive: true });

    function onResize() {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      updateCameraZ();
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize);

    // Observer to pause rendering when offscreen
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    observer.observe(container);

    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible || !isPageVisible) return;

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth inertia
      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.06;
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.06;

      if (prefersReducedMotion) {
        renderer.render(scene, camera);
        return;
      }

      // Real audio energy extraction for 3D modulation
      const bassEnergy = currentFrequencies[2] || 0.1;
      const midEnergy = currentFrequencies[16] || 0.1;
      const trebleEnergy = currentFrequencies[30] || 0.1;

      const speedMultiplier = isPlaying ? (1.2 + bassEnergy * 0.8) : 0.7;

      knotMesh.rotation.y += delta * 0.35 * speedMultiplier;
      knotMesh.rotation.z += delta * 0.25 * speedMultiplier;

      ring1Mesh.rotation.z -= delta * 0.5 * speedMultiplier;
      ring2Mesh.rotation.z += delta * 0.4 * speedMultiplier;
      ring3Mesh.rotation.z += delta * 0.3 * speedMultiplier;

      particleSystem.rotation.y += delta * (0.05 + bassEnergy * 0.1);

      if (isPlaying) {
        const scaleVal = 1 + bassEnergy * 0.08 + Math.sin(elapsedTime * 4) * 0.02;
        knotMesh.scale.set(scaleVal, scaleVal, scaleVal);

        orangeAccentLight.intensity = 3.5 + bassEnergy * 2.5;
        blueRimLight.intensity = 3.0 + midEnergy * 2.0;
        magentaRimLight.intensity = 2.8 + trebleEnergy * 2.2;
      } else {
        knotMesh.scale.set(1, 1, 1);
        orangeAccentLight.intensity = 3.0;
        blueRimLight.intensity = 2.5;
        magentaRimLight.intensity = 2.2;
      }

      renderer.render(scene, camera);
    }

    animate();
  }

  if (typeof THREE !== 'undefined') {
    init3DScene();
  } else {
    window.addEventListener('load', () => {
      if (typeof THREE !== 'undefined') init3DScene();
    });
  }

  // =========================================================================
  // 7. Sticky Floating Dock & Navigation Observers
  // =========================================================================
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (floatingDock) {
      if (scrollY > 380) {
        floatingDock.classList.add('visible');
      } else {
        floatingDock.classList.remove('visible');
      }
    }
  }, { passive: true });

  const btnDockExpand = document.getElementById('btnDockExpand');
  if (btnDockExpand) {
    btnDockExpand.addEventListener('click', () => {
      const masterSection = document.getElementById('en-vivo');
      if (masterSection) {
        masterSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // =========================================================================
  // 8. Mobile Navigation Drawer
  // =========================================================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileDrawerClose = document.getElementById('mobileDrawerClose');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileDrawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    function closeDrawer() {
      mobileDrawer.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (mobileDrawerClose) mobileDrawerClose.addEventListener('click', closeDrawer);
    mobileNavLinks.forEach(link => link.addEventListener('click', closeDrawer));
  }

  // =========================================================================
  // 9. Footer Live Timecode Display
  // =========================================================================
  function updateTimecode() {
    const timecodeEl = document.getElementById('liveTimecode');
    if (!timecodeEl) return;
    const now = new Date();
    const localHours = String(now.getHours()).padStart(2, '0');
    const localMinutes = String(now.getMinutes()).padStart(2, '0');
    timecodeEl.textContent = `Buenos Aires ${localHours}:${localMinutes}`;
  }
  setInterval(updateTimecode, 1000);
  updateTimecode();

  // =========================================================================
  // 10. Contact Form Simulation & Feedback
  // =========================================================================
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');

  if (contactForm && formFeedback) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando mensaje...';
      }

      setTimeout(() => {
        contactForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar Mensaje';
        }
        formFeedback.style.display = 'block';
        formFeedback.textContent = '✓ Mensaje enviado con éxito. ¡Gracias por comunicarte!';
        setTimeout(() => {
          formFeedback.style.display = 'none';
        }, 6000);
      }, 700);
    });
  }

})();

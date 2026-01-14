/*
  Sign2Speak Demo Website
  - Mobile navigation toggle
  - Scroll reveal animations
  - Toast helper
  - Optional text-to-speech using Web Speech API
*/

(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  const toastRoot = document.querySelector("[data-toast-root]");
  const toastInner = document.querySelector("[data-toast-inner]");

  let toastTimer = null;

  const demoStartBtn = document.querySelector("[data-demo-start]");
  const demoStopBtn = document.querySelector("[data-demo-stop]");
  const demoVideo = document.querySelector("#webcam");
  const demoCanvas = document.querySelector("#overlay");
  const demoDetected = document.querySelector("#detectedText");
  const demoHint = document.querySelector("[data-live-hint]");
  const demoStatus = document.querySelector("[data-live-status]");

  let demoHands = null;
  let demoCamera = null;
  let demoRunning = false;
  let stableLabel = "READY";
  let stableCount = 0;
  let lastSpokenAt = 0;

  function setHeaderElevation() {
    if (!header) return;
    const scrolled = window.scrollY > 4;
    header.setAttribute("data-scrolled", scrolled ? "true" : "false");
  }

  function showToast(message) {
    if (!toastRoot || !toastInner) return;

    toastInner.textContent = message;
    toastRoot.setAttribute("data-show", "true");

    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastRoot.setAttribute("data-show", "false");
    }, 2600);
  }

  function closeNav() {
    if (!navMenu || !navToggle) return;
    navMenu.setAttribute("data-open", "false");
    navToggle.setAttribute("aria-expanded", "false");
  }

  function toggleNav() {
    if (!navMenu || !navToggle) return;

    const isOpen = navMenu.getAttribute("data-open") === "true";
    navMenu.setAttribute("data-open", isOpen ? "false" : "true");
    navToggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
  }

  function initNav() {
    if (!navToggle || !navMenu) return;

    navToggle.addEventListener("click", toggleNav);

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const clickedInside = navMenu.contains(target) || navToggle.contains(target);
      if (!clickedInside) closeNav();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });

    navMenu.querySelectorAll("a[href^='#']").forEach((a) => {
      a.addEventListener("click", () => {
        closeNav();
      });
    });
  }

  function speak(text) {
    if (!text || !text.trim()) {
      showToast("Nothing to speak.");
      return;
    }

    const synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance === "undefined") {
      showToast("Text-to-speech is not supported in this browser.");
      return;
    }

    try {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.lang = "en-US";
      synth.speak(utterance);
    } catch {
      showToast("Unable to start voice output.");
    }
  }

  function initTts() {
    document.querySelectorAll("[data-tts]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sourceSelector = btn.getAttribute("data-tts-source");
        let text = "HELLO, HOW ARE YOU?";

        if (sourceSelector) {
          const sourceEl = document.querySelector(sourceSelector);
          if (sourceEl) text = sourceEl.textContent || text;
        }

        speak(text);
      });
    });
  }

  function setDemoStatus(text) {
    if (demoStatus) demoStatus.textContent = text;
  }

  function setDetectedText(text) {
    if (!demoDetected) return;
    demoDetected.textContent = text;
  }

  function isFingerExtended(landmarks, tipIndex, pipIndex) {
    return landmarks[tipIndex].y < landmarks[pipIndex].y;
  }

  function getThumbExtended(landmarks, handednessLabel) {
    const tip = landmarks[4];
    const ip = landmarks[3];
    if (handednessLabel === "Left") return tip.x < ip.x;
    return tip.x > ip.x;
  }

  function classifyGesture(landmarks, handednessLabel) {
    if (!landmarks || landmarks.length < 21) return "";

    const thumb = getThumbExtended(landmarks, handednessLabel);
    const index = isFingerExtended(landmarks, 8, 6);
    const middle = isFingerExtended(landmarks, 12, 10);
    const ring = isFingerExtended(landmarks, 16, 14);
    const pinky = isFingerExtended(landmarks, 20, 18);

    const extendedCount = [thumb, index, middle, ring, pinky].filter(Boolean).length;

    if (extendedCount === 5) return "HELLO";
    if (extendedCount === 0) return "YES";
    if (index && middle && !ring && !pinky) return "THANK YOU";
    if (index && !middle && !ring && !pinky) return "NO";
    if (thumb && !index && !middle && !ring && !pinky) return "OK";
    return "DETECTING...";
  }

  function updateStableLabel(nextLabel) {
    if (!nextLabel) return;

    if (nextLabel === stableLabel) {
      stableCount = Math.min(60, stableCount + 1);
    } else {
      stableLabel = nextLabel;
      stableCount = 1;
    }

    if (stableCount >= 8) {
      setDetectedText(stableLabel);
      setDemoStatus(stableLabel === "DETECTING..." ? "Hand detected" : `Hand detected: ${stableLabel}`);

      const now = Date.now();
      if (
        stableLabel !== "DETECTING..." &&
        stableLabel !== "READY" &&
        stableLabel !== "" &&
        now - lastSpokenAt > 4500
      ) {
        lastSpokenAt = now;
      }
    }
  }

  async function startLiveDemo() {
    if (!demoVideo || !demoCanvas || !demoStartBtn || !demoStopBtn) return;
    if (demoRunning) return;

    if (!window.isSecureContext) {
      showToast("Camera requires a secure context. Please run this page on https or localhost.");
      setDemoStatus("Blocked (not secure)");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Camera is not supported in this browser.");
      setDemoStatus("Unsupported");
      return;
    }

    if (typeof window.Hands === "undefined") {
      showToast("MediaPipe Hands failed to load. Check your internet connection.");
      setDemoStatus("MediaPipe not loaded");
      return;
    }

    demoRunning = true;
    demoStartBtn.setAttribute("disabled", "true");
    demoStopBtn.removeAttribute("disabled");
    if (demoHint) demoHint.textContent = "Starting…";
    setDemoStatus("Starting");

    try {
      demoHands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      demoHands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      demoHands.onResults((results) => {
        if (!demoRunning) return;

        const ctx = demoCanvas.getContext("2d");
        if (!ctx) return;

        const w = demoVideo.videoWidth || 1280;
        const h = demoVideo.videoHeight || 720;
        if (demoCanvas.width !== w) demoCanvas.width = w;
        if (demoCanvas.height !== h) demoCanvas.height = h;

        ctx.save();
        ctx.clearRect(0, 0, demoCanvas.width, demoCanvas.height);

        const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
        if (!hasHand) {
          updateStableLabel("DETECTING...");
          if (demoHint) demoHint.textContent = "Show your hand in the frame";
          setDemoStatus("No hand detected");
          ctx.restore();
          return;
        }

        if (demoHint) demoHint.textContent = "";

        const landmarks = results.multiHandLandmarks[0];
        const handednessLabel =
          (results.multiHandedness && results.multiHandedness[0] && results.multiHandedness[0].label) || "Right";

        if (typeof window.drawConnectors === "function" && typeof window.drawLandmarks === "function") {
          window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
            color: "#8b5cf6",
            lineWidth: 3,
          });
          window.drawLandmarks(ctx, landmarks, {
            color: "#5b6cff",
            lineWidth: 2,
            radius: 3,
          });
        }

        const label = classifyGesture(landmarks, handednessLabel);
        updateStableLabel(label);

        ctx.restore();
      });

      demoCamera = new window.Camera(demoVideo, {
        onFrame: async () => {
          if (!demoHands) return;
          await demoHands.send({ image: demoVideo });
        },
        width: 1280,
        height: 720,
      });

      await demoCamera.start();
      if (demoHint) demoHint.textContent = "Show your hand in the frame";
      setDemoStatus("Camera on");
      setDetectedText("DETECTING...");
    } catch (err) {
      demoRunning = false;
      demoStartBtn.removeAttribute("disabled");
      demoStopBtn.setAttribute("disabled", "true");
      if (demoHint) demoHint.textContent = "Click “Turn On Webcam” to start";

      const name = err && typeof err === "object" && "name" in err ? String(err.name) : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        showToast("Camera permission denied. Please allow camera access and try again.");
        setDemoStatus("Permission denied");
      } else {
        showToast("Unable to start the camera.");
        setDemoStatus("Error");
      }
    }
  }

  function stopLiveDemo() {
    if (!demoVideo || !demoCanvas || !demoStartBtn || !demoStopBtn) return;
    if (!demoRunning) return;

    demoRunning = false;

    try {
      if (demoCamera && typeof demoCamera.stop === "function") demoCamera.stop();
    } catch {
      // no-op
    }

    try {
      const stream = demoVideo.srcObject;
      if (stream && typeof stream === "object" && "getTracks" in stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      // no-op
    }

    demoVideo.srcObject = null;
    demoCamera = null;

    try {
      if (demoHands && typeof demoHands.close === "function") demoHands.close();
    } catch {
      // no-op
    }
    demoHands = null;

    const ctx = demoCanvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, demoCanvas.width, demoCanvas.height);

    stableLabel = "READY";
    stableCount = 0;
    setDetectedText("READY");
    setDemoStatus("Idle");
    if (demoHint) demoHint.textContent = "Click “Turn On Webcam” to start";

    demoStopBtn.setAttribute("disabled", "true");
    demoStartBtn.removeAttribute("disabled");
  }

  function initLiveDemo() {
    if (!demoStartBtn || !demoStopBtn) return;
    demoStartBtn.addEventListener("click", startLiveDemo);
    demoStopBtn.addEventListener("click", stopLiveDemo);
  }

  function initToasts() {
    document.querySelectorAll("[data-toast]").forEach((el) => {
      el.addEventListener("click", () => {
        const msg = el.getAttribute("data-toast") || "";
        showToast(msg);
      });
    });
  }

  function initReveal() {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!els.length) return;

    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      els.forEach((el) => el.setAttribute("data-in", "true"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = Number(el.getAttribute("data-delay") || 0);

          window.setTimeout(() => {
            el.setAttribute("data-in", "true");
          }, delay);

          io.unobserve(el);
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
  }

  function initInPageFocusFix() {
    // Improves keyboard accessibility when jumping to anchors.
    document.querySelectorAll("a[href^='#']").forEach((a) => {
      a.addEventListener("click", () => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;

        window.setTimeout(() => {
          const canFocus = target instanceof HTMLElement;
          if (canFocus) {
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
            // Remove tabindex after focus so it doesn't stay in tab order.
            window.setTimeout(() => target.removeAttribute("tabindex"), 0);
          }
        }, 0);
      });
    });
  }

  setHeaderElevation();
  window.addEventListener("scroll", setHeaderElevation, { passive: true });

  initNav();
  initToasts();
  initTts();
  initLiveDemo();
  initReveal();
  initInPageFocusFix();
})();

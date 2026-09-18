(() => {
  "use strict";

  const CONFIG = {
    autoAdvanceBuffer: 850,
    interactionFallback: 11000,
    holdDuration: 1450,
    dragDistance: 125
  };

  const state = {
    started: false,
    current: 0,
    advancing: false,
    interactionDone: false,
    fallbackTimer: null,
    holdTimer: null,
    holdStarted: 0
  };

  const scenes = [...document.querySelectorAll(".scene[data-scene]")];
  const gate = document.getElementById("gate");
  const startButton = document.getElementById("startButton");
  const music = document.getElementById("music");
  const progressBar = document.getElementById("progressBar");
  const sceneNumber = document.getElementById("sceneNumber");
  const lightButton = document.getElementById("lightButton");
  const dragTarget = document.getElementById("dragTarget");
  const finalButton = document.getElementById("finalButton");
  const finalMessage = document.getElementById("finalMessage");

  // ---------- Star field ----------
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d", { alpha: true });
  let stars = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(150, Math.floor(innerWidth / 3.2)) }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.35 + .2,
      a: Math.random() * .65 + .2,
      s: Math.random() * .08 + .015
    }));
  }

  function drawStars(t = 0) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const s of stars) {
      s.y -= s.s;
      if (s.y < -5) s.y = innerHeight + 5;
      const twinkle = s.a + Math.sin(t * .001 + s.x) * .12;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 238, ${Math.max(.05, twinkle)})`;
      ctx.fill();
    }
    requestAnimationFrame(drawStars);
  }
  resizeCanvas();
  addEventListener("resize", resizeCanvas);
  requestAnimationFrame(drawStars);

  // ---------- Scene controller ----------
  function setActive(index) {
    scenes.forEach((scene, i) => scene.classList.toggle("active", i === index));
    state.current = index;
    state.interactionDone = false;
    sceneNumber.textContent = String(index + 1).padStart(2, "0");
    progressBar.style.width = `${((index + 1) / scenes.length) * 100}%`;
    clearTimeout(state.fallbackTimer);

    const scene = scenes[index];
    const requiresInteraction = scene.dataset.requiresInteraction === "true";
    if (requiresInteraction) {
      state.fallbackTimer = setTimeout(() => {
        if (!state.interactionDone && index !== scenes.length - 1) {
          completeInteraction();
        }
      }, CONFIG.interactionFallback);
    } else {
      const duration = Number(scene.dataset.duration || 0);
      if (duration > 0) {
        state.fallbackTimer = setTimeout(() => nextScene(), duration + CONFIG.autoAdvanceBuffer);
      }
    }
  }

  function nextScene() {
    if (!state.started || state.advancing || state.current >= scenes.length - 1) return;
    state.advancing = true;
    const next = state.current + 1;
    scenes[next].scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      setActive(next);
      state.advancing = false;
    }, 650);
  }

  function completeInteraction() {
    state.interactionDone = true;
    clearTimeout(state.fallbackTimer);
    if (state.current === 2) {
      lightButton.closest(".scene").classList.add("touched");
      lightButton.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.28)" },
        { transform: "scale(.9)" },
        { transform: "scale(1)" }
      ], { duration: 1100, easing: "cubic-bezier(.16,1,.3,1)" });
      setTimeout(nextScene, 900);
    } else if (state.current === 5) {
      scenes[5].classList.add("uncovered");
      setTimeout(nextScene, 1500);
    }
  }

  // ---------- Music gate ----------
  startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    try {
      await music.play();
      state.started = true;
      gate.classList.add("hidden");
      setActive(0);
      // Put the first scene immediately beneath the gate.
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (error) {
      startButton.disabled = false;
      startButton.querySelector("span:last-child").textContent = "tap again to enter";
    }
  });

  // ---------- Touch interaction ----------
  lightButton.addEventListener("click", completeInteraction);

  // ---------- Drag-to-reveal ----------
  let dragStartX = null;
  let dragStartLeft = 2;
  let dragging = false;

  function updateDrag(clientX) {
    if (dragStartX === null) return;
    const dx = Math.max(0, Math.min(CONFIG.dragDistance, clientX - dragStartX));
    const max = dragTarget.clientWidth - 42;
    const left = Math.min(max, dragStartLeft + dx);
    dragTarget.querySelector(".drag-handle").style.left = `${left}px`;
    if (dx >= CONFIG.dragDistance * .88) completeInteraction();
  }

  dragTarget.addEventListener("pointerdown", e => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartLeft = parseFloat(getComputedStyle(dragTarget.querySelector(".drag-handle")).left) || 2;
    dragTarget.setPointerCapture(e.pointerId);
  });
  dragTarget.addEventListener("pointermove", e => { if (dragging) updateDrag(e.clientX); });
  dragTarget.addEventListener("pointerup", () => { dragging = false; dragStartX = null; });
  dragTarget.addEventListener("pointercancel", () => { dragging = false; dragStartX = null; });
  dragTarget.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      completeInteraction();
    }
  });

  // ---------- Final hold ----------
  function setHoldProgress(percent) {
    finalButton.style.setProperty("--hold", `${Math.min(100, percent)}%`);
  }

  function startHold() {
    if (state.current !== 7 || state.interactionDone) return;
    state.holdStarted = performance.now();
    clearInterval(state.holdTimer);
    state.holdTimer = setInterval(() => {
      const percent = ((performance.now() - state.holdStarted) / CONFIG.holdDuration) * 100;
      setHoldProgress(percent);
      if (percent >= 100) {
        clearInterval(state.holdTimer);
        state.interactionDone = true;
        document.querySelector(".final-scene").classList.add("revealed");
        finalMessage.setAttribute("aria-hidden", "false");
        if (navigator.vibrate) navigator.vibrate([25, 45, 80]);
      }
    }, 16);
  }

  function stopHold() {
    if (state.interactionDone) return;
    clearInterval(state.holdTimer);
    setHoldProgress(0);
  }

  finalButton.addEventListener("pointerdown", e => {
    e.preventDefault();
    finalButton.setPointerCapture(e.pointerId);
    startHold();
  });
  finalButton.addEventListener("pointerup", stopHold);
  finalButton.addEventListener("pointercancel", stopHold);
  finalButton.addEventListener("pointerleave", stopHold);
  finalButton.addEventListener("keydown", e => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      startHold();
    }
  });
  finalButton.addEventListener("keyup", e => {
    if (e.key === " " || e.key === "Enter") stopHold();
  });

  // ---------- Graceful manual navigation ----------
  let scrollLockUntil = 0;
  const observer = new IntersectionObserver(entries => {
    if (!state.started || Date.now() < scrollLockUntil) return;
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const index = scenes.indexOf(visible.target);
    if (index !== -1 && Math.abs(index - state.current) <= 1) setActive(index);
  }, { threshold: [.65] });

  scenes.forEach(s => observer.observe(s));

  // Wheel / swipe shouldn't fight the cinematic progression.
  addEventListener("wheel", () => { scrollLockUntil = Date.now() + 250; }, { passive: true });
  addEventListener("touchmove", () => { scrollLockUntil = Date.now() + 250; }, { passive: true });

  // Start at gate; the story remains inaccessible until audio.play() succeeds.
  setActive(0);
})();

const loader = document.querySelector(".loader");
const dots = document.querySelector(".loading-dots");
const replayButton = document.querySelector(".replay");
const flipbooks = document.querySelectorAll("[data-flipbook]");
const markerCanvas = document.querySelector(".marker-trail");
const markerToggle = document.querySelector(".marker-toggle");
const coverCharacter = document.querySelector(".book-page__character");
const foodTokens = document.querySelectorAll(".food-token");
const contactForm = document.querySelector(".contact-form");
const contactResponse = document.querySelector(".contact-response");

let dotsTimer;
let openTimer;
let revealTimer;
let finishTimer;

function playLoader() {
  window.clearInterval(dotsTimer);
  window.clearTimeout(openTimer);
  window.clearTimeout(revealTimer);
  window.clearTimeout(finishTimer);
  loader.classList.remove("is-opening");
  loader.classList.remove("is-revealing");
  loader.classList.remove("is-finished");
  dots.textContent = ".";

  let dotCount = 1;
  dotsTimer = window.setInterval(() => {
    dotCount = (dotCount % 3) + 1;
    dots.textContent = ".".repeat(dotCount);
  }, 430);

  openTimer = window.setTimeout(() => {
    window.clearInterval(dotsTimer);
    dots.textContent = "...";
    loader.classList.add("is-opening");
  }, 3300);

  revealTimer = window.setTimeout(() => {
    loader.classList.add("is-revealing");
  }, 4300);

  finishTimer = window.setTimeout(() => {
    loader.classList.add("is-finished");
  }, 5000);
}

replayButton?.addEventListener("click", playLoader);

window.addEventListener("load", playLoader);

flipbooks.forEach((flipbook) => {
  const sheets = [...flipbook.querySelectorAll(".flip-sheet")];
  let activeIndex = 0;
  let isTurning = false;

  flipbook.addEventListener("click", (event) => {
    const control = event.target.closest("[data-flip], [data-flip-index]");
    if (!control || isTurning) return;
    const direction = control.dataset.flip;
    const requestedIndex = Number.parseInt(control.dataset.flipIndex, 10);
    const nextIndex = Number.isNaN(requestedIndex)
      ? activeIndex + (direction === "next" ? 1 : -1)
      : requestedIndex;
    if (!sheets[nextIndex]) return;

    isTurning = true;
    const outgoing = sheets[activeIndex];
    const incoming = sheets[nextIndex];
    outgoing.classList.add("is-fading-out");

    window.setTimeout(() => {
      outgoing.classList.remove("is-active", "is-fading-out");
      incoming.classList.add("is-active", "is-fading-in");
      activeIndex = nextIndex;
      window.setTimeout(() => {
        incoming.classList.remove("is-fading-in");
        isTurning = false;
      }, 300);
    }, 240);
  });
});

if (markerCanvas) {
  const markerContext = markerCanvas.getContext("2d");
  const markerPoints = [];
  const trailDuration = 420;
  let markerEnabled = true;

  function resizeMarkerCanvas() {
    const ratio = window.devicePixelRatio || 1;
    markerCanvas.width = Math.round(innerWidth * ratio);
    markerCanvas.height = Math.round(innerHeight * ratio);
    markerContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  window.addEventListener("resize", resizeMarkerCanvas);
  resizeMarkerCanvas();

  window.addEventListener("pointermove", (event) => {
    if (!markerEnabled || event.pointerType !== "mouse") return;
    const now = performance.now();
    const previous = markerPoints.at(-1);
    if (previous) {
      const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
      const steps = Math.min(12, Math.max(1, Math.ceil(distance / 4)));
      for (let step = 1; step <= steps; step += 1) {
        const progress = step / steps;
        markerPoints.push({
          x: previous.x + (event.clientX - previous.x) * progress,
          y: previous.y + (event.clientY - previous.y) * progress,
          time: now,
        });
      }
    } else {
      markerPoints.push({ x: event.clientX, y: event.clientY, time: now });
    }
    while (markerPoints.length > 180) markerPoints.shift();
  });

  function drawMarkerTrail(now) {
    while (markerPoints[0] && now - markerPoints[0].time > trailDuration) {
      markerPoints.shift();
    }

    markerContext.clearRect(0, 0, innerWidth, innerHeight);
    markerContext.lineWidth = 17;
    markerContext.lineCap = "round";
    markerContext.lineJoin = "round";

    if (markerPoints.length > 1) {
      const lastPoint = markerPoints.at(-1);
      const stoppedAge = Math.min(1, (now - lastPoint.time) / trailDuration);
      markerContext.strokeStyle = `rgba(255, 99, 71, ${0.22 * (1 - stoppedAge)})`;
      markerContext.beginPath();
      markerContext.moveTo(markerPoints[0].x, markerPoints[0].y);
      for (let index = 1; index < markerPoints.length - 1; index += 1) {
        const current = markerPoints[index];
        const next = markerPoints[index + 1];
        markerContext.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
      }
      markerContext.lineTo(lastPoint.x, lastPoint.y);
      markerContext.stroke();
    }

    requestAnimationFrame(drawMarkerTrail);
  }

  markerToggle?.addEventListener("click", () => {
    markerEnabled = !markerEnabled;
    markerPoints.length = 0;
    markerContext.clearRect(0, 0, innerWidth, innerHeight);
    document.body.classList.toggle("marker-off", !markerEnabled);
    markerToggle.setAttribute("aria-pressed", String(markerEnabled));
    markerToggle.setAttribute("aria-label", markerEnabled ? "マーカーの軌跡をオフにする" : "マーカーの軌跡をオンにする");
    markerToggle.querySelector(".marker-toggle__text").textContent = markerEnabled ? "マーカー ON" : "マーカー OFF";
  });

  requestAnimationFrame(drawMarkerTrail);
}

if (coverCharacter && foodTokens.length) {
  let reactionTimer;

  function reactToToken(food) {
    if (food.classList.contains("is-eaten")) return;
    food.classList.add("is-eaten");
    const dislikesItem = food.dataset.reaction === "dislike";
    coverCharacter.src = dislikesItem ? coverCharacter.dataset.dislikeSrc : coverCharacter.dataset.fedSrc;
    coverCharacter.alt = dislikesItem
      ? "苦手なものを嫌そうに避けているキャラクター"
      : "食べて満足し、お腹をさすっているキャラクター";
    coverCharacter.classList.toggle("is-fed", !dislikesItem);
    coverCharacter.classList.toggle("is-disliked", dislikesItem);
    window.clearTimeout(reactionTimer);
    reactionTimer = window.setTimeout(() => {
      foodTokens.forEach((token) => {
        token.classList.remove("is-eaten");
        token.style.left = "";
        token.style.top = "";
        token.style.right = "";
        token.style.bottom = "";
      });
      coverCharacter.src = coverCharacter.dataset.defaultSrc;
      coverCharacter.alt = "食べ物を待っているキャラクター";
      coverCharacter.classList.remove("is-fed", "is-disliked");
    }, 2800);
  }

  foodTokens.forEach((food) => {
    let pointerId;
    let offsetX = 0;
    let offsetY = 0;
    let moved = false;

    food.addEventListener("pointerdown", (event) => {
      if (food.classList.contains("is-eaten")) return;
      const foodRect = food.getBoundingClientRect();
      const parentRect = food.offsetParent.getBoundingClientRect();
      pointerId = event.pointerId;
      moved = false;
      offsetX = event.clientX - foodRect.left;
      offsetY = event.clientY - foodRect.top;
      food.style.left = `${foodRect.left - parentRect.left}px`;
      food.style.top = `${foodRect.top - parentRect.top}px`;
      food.style.right = "auto";
      food.style.bottom = "auto";
      food.classList.add("is-dragging");
      food.setPointerCapture(pointerId);
    });

    food.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId || !food.hasPointerCapture(pointerId)) return;
      const parentRect = food.offsetParent.getBoundingClientRect();
      const nextLeft = event.clientX - parentRect.left - offsetX;
      const nextTop = event.clientY - parentRect.top - offsetY;
      food.style.left = `${Math.min(parentRect.width - food.offsetWidth, Math.max(0, nextLeft))}px`;
      food.style.top = `${Math.min(parentRect.height - food.offsetHeight, Math.max(0, nextTop))}px`;
      moved = true;
    });

    food.addEventListener("pointerup", (event) => {
      if (event.pointerId !== pointerId) return;
      food.releasePointerCapture(pointerId);
      food.classList.remove("is-dragging");
      const foodRect = food.getBoundingClientRect();
      const characterRect = coverCharacter.getBoundingClientRect();
      const foodCenterX = foodRect.left + foodRect.width / 2;
      const foodCenterY = foodRect.top + foodRect.height / 2;
      const isOverCharacter = foodCenterX >= characterRect.left && foodCenterX <= characterRect.right
        && foodCenterY >= characterRect.top && foodCenterY <= characterRect.bottom;

      if (isOverCharacter) {
        reactToToken(food);
      } else {
        food.style.left = "";
        food.style.top = "";
        food.style.right = "";
        food.style.bottom = "";
      }
      pointerId = undefined;
    });

    food.addEventListener("pointercancel", () => {
      food.classList.remove("is-dragging");
      food.style.left = "";
      food.style.top = "";
      food.style.right = "";
      food.style.bottom = "";
      pointerId = undefined;
      moved = false;
    });

    food.addEventListener("click", () => {
      if (!moved) reactToToken(food);
      moved = false;
    });
  });
}

if (contactForm && contactResponse) {
  const kanaInput = document.querySelector("#contact-kana");
  const messageInput = document.querySelector("#contact-message");
  const combinedMessage = document.querySelector("#contact-combined-message");
  const status = contactForm.querySelector(".contact-form__status");
  let formSubmitted = false;

  contactForm.addEventListener("submit", () => {
    combinedMessage.value = `ふりがな：${kanaInput.value}\n\n要件：\n${messageInput.value}`;
    status.textContent = "送信しています…";
    formSubmitted = true;
  });

  contactResponse.addEventListener("load", () => {
    if (!formSubmitted) return;
    status.textContent = "送信しました。ありがとうございます！";
    contactForm.reset();
    formSubmitted = false;
  });
}

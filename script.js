const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Build the layered heart used by the hero's 3D scene.
const heartStack = document.querySelector("#heartStack");
for (let layer = 0; layer < 16; layer += 1) {
  const heart = document.createElement("span");
  heart.className = "heart-layer";
  heart.textContent = "♥";
  heart.style.setProperty("--layer", layer);
  heartStack.appendChild(heart);
}

// Let the heart turn gently toward the pointer.
const heartScene = document.querySelector("#heartScene");
if (!prefersReducedMotion) {
  heartScene.addEventListener("pointermove", (event) => {
    const bounds = heartScene.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    heartStack.style.setProperty("--scene-x", `${-8 - y * 22}deg`);
    heartStack.style.setProperty("--scene-y", `${-16 + x * 28}deg`);
  });

  heartScene.addEventListener("pointerleave", () => {
    heartStack.style.setProperty("--scene-x", "-8deg");
    heartStack.style.setProperty("--scene-y", "-16deg");
  });
}

// Reveal each section as it enters the screen.
const revealItems = document.querySelectorAll(".reveal");
if (prefersReducedMotion) {
  revealItems.forEach((item) => item.classList.add("visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealItems.forEach((item) => observer.observe(item));
}

// Animate the picture wall into depth, then tilt each photo.
const photoWall = document.querySelector("#photoWall");
const wallCards = [...document.querySelectorAll(".wall-photo")];
wallCards.forEach((card, index) => {
  card.style.setProperty("--wall-delay", `${index * 75}ms`);
});

if (prefersReducedMotion) {
  photoWall.classList.add("wall-ready", "wall-settled");
} else {
  const wallObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      photoWall.classList.add("wall-ready");
      window.setTimeout(() => photoWall.classList.add("wall-settled"), 1300);
      wallObserver.disconnect();
    },
    { threshold: 0.08 }
  );
  wallObserver.observe(photoWall);
}

if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  wallCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty("--wall-rx", `${y * -9}deg`);
      card.style.setProperty("--wall-ry", `${x * 11}deg`);
      card.style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
      card.style.setProperty("--shine-y", `${(y + 0.5) * 100}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--wall-rx", "0deg");
      card.style.setProperty("--wall-ry", "0deg");
    });
  });
}

// Give the letter a soft paper-like tilt on larger screens.
const letterCard = document.querySelector("#letterCard");
if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  letterCard.addEventListener("pointermove", (event) => {
    const bounds = letterCard.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    letterCard.style.setProperty("--letter-x", `${y * -4}deg`);
    letterCard.style.setProperty("--letter-y", `${x * 5}deg`);
  });

  letterCard.addEventListener("pointerleave", () => {
    letterCard.style.setProperty("--letter-x", "0deg");
    letterCard.style.setProperty("--letter-y", "0deg");
  });
}

// Add light, varied hearts behind the final message.
const finaleHearts = document.querySelector("#finaleHearts");
for (let index = 0; index < 18; index += 1) {
  const heart = document.createElement("span");
  heart.className = "float-heart";
  heart.textContent = "♥";
  heart.style.left = `${5 + Math.random() * 90}%`;
  heart.style.fontSize = `${0.7 + Math.random() * 1.5}rem`;
  heart.style.setProperty("--duration", `${7 + Math.random() * 8}s`);
  heart.style.setProperty("--delay", `${-Math.random() * 12}s`);
  heart.style.setProperty("--drift", `${-60 + Math.random() * 120}px`);
  heart.style.setProperty("--blur", `${Math.random() * 2}px`);
  finaleHearts.appendChild(heart);
}

// Load the photos included with the site.
const memoryPhotos = [...document.querySelectorAll(".memory-photo")];
const savedPhotoPaths = [
  "photos/memory-1.jpg",
  "photos/memory-2.jpg",
  "photos/memory-3.jpg",
  "photos/memory-4.jpg",
  "photos/memory-5.jpg",
  "photos/memory-6.jpg",
  "photos/memory-7.jpg",
  "photos/memory-8.jpg",
  "photos/memory-9.jpg",
];

function showPhoto(photo, source, label) {
  const art = photo.closest(".wall-image");
  photo.onload = () => {
    art.classList.add("has-photo");
  };
  photo.onerror = () => {
    art.classList.remove("has-photo");
    photo.removeAttribute("src");
  };
  photo.alt = label;
  photo.src = source;
}

savedPhotoPaths.forEach((path, index) => {
  showPhoto(memoryPhotos[index], path, `共同回忆第${index + 1}张`);
});

// Open each placeholder message inside an accessible note window.
const memoryDialog = document.querySelector("#memoryDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogMessage = document.querySelector("#dialogMessage");
const dialogClose = document.querySelector("#dialogClose");

document.querySelectorAll(".memory-open").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".wall-photo");
    dialogTitle.textContent = card.dataset.title;
    dialogMessage.textContent = card.dataset.message;
    memoryDialog.showModal();
  });
});

dialogClose.addEventListener("click", () => memoryDialog.close());

memoryDialog.addEventListener("click", (event) => {
  if (event.target === memoryDialog) memoryDialog.close();
});

document.documentElement.classList.add("site-ready");

const fallbackItems = [
  "Has made a game before",
  "Likes co-op games",
  "Has joined a game jam",
  "Can draw pixel art",
  "Has used Unity",
  "Has used Godot",
  "Likes board games",
  "Has tried VR",
  "Plays an instrument",
  "Likes puzzle games",
  "Likes horror games",
  "Can model in Blender",
  "Has written a story or comic",
  "Knows JavaScript",
  "Knows C#",
  "Has a favorite speedrun",
  "Has played a student-made game",
  "Designed an original character",
  "Is interested in UI/UX",
  "Has made music for a project",
  "Likes roguelikes",
  "Has worked on a team project",
  "Wants to work in games",
  "Has a cool bug-fixing story",
  "Has used version control",
  "Has made a pixel art sprite",
  "Has made a game with friends",
  "Has made a text adventure",
  "Has made a platformer"
];

const STORAGE_KEY = "sectionbingo-card-v1";
const boardEl = document.querySelector("#bingo-board");
const boardWrapEl = document.querySelector(".board-wrap");
const statusEl = document.querySelector("#status");
const newCardBtn = document.querySelector("#new-card-btn");
const clearNamesBtn = document.querySelector("#clear-names-btn");
const undoClearBtn = document.querySelector("#undo-clear-btn");
const exportBtn = document.querySelector("#export-btn");
const celebrationBannerEl = document.querySelector("#celebration-banner");
const celebrationLayerEl = document.querySelector("#celebration-layer");

let allPrompts = [];
let wasComplete = false;
let lastClearedNames = null;
let state = {
  prompts: [],
  names: {}
};

function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function isCardComplete() {
  return (
    state.prompts.length === 9
    && state.prompts.every((_, index) => Boolean(String(state.names[index] ?? "").trim()))
  );
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateUndoButton() {
  const canUndo = Boolean(lastClearedNames && Object.keys(lastClearedNames).length);
  undoClearBtn.disabled = !canUndo;
}

function clearUndoHistory() {
  lastClearedNames = null;
  updateUndoButton();
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);
    if (
      !Array.isArray(parsed.prompts)
      || parsed.prompts.length !== 9
      || typeof parsed.names !== "object"
      || parsed.names === null
      || Array.isArray(parsed.names)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function makeCard() {
  state = {
    prompts: shuffle(allPrompts).slice(0, 9),
    names: {}
  };

  clearUndoHistory();
  saveState();
  renderBoard();
  statusEl.textContent = "Fresh card ready — tap any square to add a name.";
}

function clearNames() {
  if (!Object.keys(state.names).length) {
    statusEl.textContent = "There are no names to clear right now.";
    return;
  }

  lastClearedNames = { ...state.names };
  updateUndoButton();
  state.names = {};
  saveState();
  renderBoard();
  statusEl.textContent = "Names cleared. Tap Undo clear to restore them.";
}

function undoClearNames() {
  if (!lastClearedNames || !Object.keys(lastClearedNames).length) {
    statusEl.textContent = "Nothing to undo.";
    updateUndoButton();
    return;
  }

  state.names = { ...lastClearedNames };
  clearUndoHistory();
  saveState();
  renderBoard();
  statusEl.textContent = "Names restored.";
}

function editName(index, prompt) {
  const currentValue = state.names[index] ?? "";
  const answer = window.prompt(
    `Who matches this prompt?\n\n${prompt}\n\nLeave blank to clear the name.`,
    currentValue
  );

  if (answer === null) {
    return;
  }

  const cleaned = answer.trim();

  if (cleaned) {
    state.names[index] = cleaned;
    statusEl.textContent = `${cleaned} added.`;
  } else {
    delete state.names[index];
    statusEl.textContent = "Name cleared.";
  }

  clearUndoHistory();
  saveState();
  renderBoard();
}

function triggerCelebration() {
  celebrationLayerEl.innerHTML = "";

  for (let index = 0; index < 24; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--delay", `${Math.random() * 0.18}s`);
    piece.style.setProperty("--duration", `${850 + Math.random() * 500}ms`);
    piece.style.setProperty("--hue", `${110 + Math.random() * 90}`);
    celebrationLayerEl.appendChild(piece);
  }

  window.setTimeout(() => {
    celebrationLayerEl.innerHTML = "";
  }, 1600);
}

function updateBoardState() {
  const complete = isCardComplete();

  boardEl.classList.toggle("completed", complete);
  boardWrapEl.classList.toggle("complete", complete);
  celebrationBannerEl.hidden = !complete;

  if (complete && !wasComplete) {
    triggerCelebration();
    statusEl.textContent = "🎉 Bingo complete! Export your card to save it.";
  }

  wasComplete = complete;
}

function renderBoard() {
  boardEl.innerHTML = "";

  state.prompts.forEach((prompt, index) => {
    const cell = document.createElement("button");
    const savedName = String(state.names[index] ?? "").trim();

    cell.type = "button";
    cell.className = `bingo-cell${savedName ? " filled" : ""}`;
    cell.setAttribute("aria-label", `${prompt}${savedName ? `, matched by ${savedName}` : ""}`);

    const promptText = document.createElement("span");
    promptText.className = "prompt";
    promptText.textContent = prompt;

    const footer = document.createElement("span");
    footer.className = savedName ? "name-chip" : "tap-hint";
    footer.textContent = savedName || "Tap to add a name";

    cell.append(promptText, footer);
    cell.addEventListener("click", () => editName(index, prompt));
    boardEl.appendChild(cell);
  });

  updateBoardState();
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }

      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let trimmed = visibleLines[maxLines - 1];

    while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }

    visibleLines[maxLines - 1] = `${trimmed}…`;
  }

  visibleLines.forEach((line, lineIndex) => {
    ctx.fillText(line, x, y + lineIndex * lineHeight);
  });
}

async function renderCardToBlob() {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1600;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is unavailable.");
  }

  const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, "#f8fbff");
  background.addColorStop(1, "#e7f1ff");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2457c5";
  ctx.font = "700 28px Arial";
  ctx.fillText("UCSC • CMPM 121 • CSGD", 90, 90);

  ctx.fillStyle = "#17324d";
  ctx.font = "700 58px Arial";
  ctx.fillText("Icebreaker Bingo", 90, 165);

  ctx.font = "28px Arial";
  ctx.fillStyle = "#466382";
  ctx.fillText("Find classmates who match each square.", 90, 215);

  const paddingX = 90;
  const top = 280;
  const gap = 24;
  const cellSize = (canvas.width - (paddingX * 2) - (gap * 2)) / 3;

  state.prompts.forEach((prompt, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = paddingX + (column * (cellSize + gap));
    const y = top + (row * (cellSize + gap));
    const savedName = String(state.names[index] ?? "").trim();
    const filled = Boolean(savedName);

    drawRoundedRect(ctx, x, y, cellSize, cellSize, 28);
    ctx.fillStyle = filled ? "#e8f8ef" : "#ffffff";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = filled ? "#1f8f57" : "#cfe0ff";
    ctx.stroke();

    ctx.fillStyle = filled ? "#145435" : "#17324d";
    ctx.font = "700 31px Arial";
    drawWrappedText(ctx, prompt, x + 26, y + 48, cellSize - 52, 38, 4);

    drawRoundedRect(ctx, x + 22, y + cellSize - 86, cellSize - 44, 56, 28);
    ctx.fillStyle = filled ? "#1f8f57" : "#eef4ff";
    ctx.fill();

    ctx.fillStyle = filled ? "#ffffff" : "#466382";
    ctx.font = filled ? "800 28px Arial" : "600 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(savedName || "Add a name", x + (cellSize / 2), y + cellSize - 58, cellSize - 60);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  });

  if (isCardComplete()) {
    drawRoundedRect(ctx, 90, 1450, canvas.width - 180, 78, 20);
    ctx.fillStyle = "#e8f8ef";
    ctx.fill();
    ctx.fillStyle = "#145435";
    ctx.font = "800 30px Arial";
    ctx.fillText("🎉 Bingo complete!", 120, 1500);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not create PNG."));
      }
    }, "image/png");
  });
}

async function exportCard() {
  if (state.prompts.length !== 9) {
    statusEl.textContent = "Wait for the card to load before exporting.";
    return;
  }

  exportBtn.disabled = true;
  exportBtn.textContent = "Exporting…";

  try {
    const blob = await renderCardToBlob();
    const filename = `csgd-bingo-${Date.now()}.png`;
    const file = new File([blob], filename, { type: "image/png" });
    let canShareFile = false;

    try {
      canShareFile = Boolean(
        navigator.share
        && navigator.canShare
        && navigator.canShare({ files: [file] })
      );
    } catch {
      canShareFile = false;
    }

    if (canShareFile) {
      await navigator.share({
        files: [file],
        title: "CSGD Icebreaker Bingo",
        text: "My CMPM 121 bingo card"
      });
      statusEl.textContent = "Share sheet opened — you can save the image to your photos.";
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      statusEl.textContent = "PNG downloaded — save it to your photos if you want.";
    }
  } catch (error) {
    if (error && error.name === "AbortError") {
      statusEl.textContent = "Export canceled.";
    } else {
      console.error("Export failed.", error);
      statusEl.textContent = "Couldn’t export the card this time. Please try again.";
    }
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = "Export card";
  }
}

async function loadPrompts() {
  try {
    const response = await fetch("./items.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
    const cleanItems = [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];

    if (cleanItems.length < 9) {
      throw new Error("items.json needs at least 9 prompts.");
    }

    return cleanItems;
  } catch (error) {
    console.warn("Falling back to built-in prompts.", error);
    statusEl.textContent = "Using built-in sample prompts. Edit items.json to customize them.";
    return fallbackItems;
  }
}

async function init() {
  allPrompts = await loadPrompts();

  const saved = loadSavedState();
  if (saved) {
    state = saved;
    renderBoard();
    statusEl.textContent = isCardComplete()
      ? "🎉 Bingo complete! Export your card to save it."
      : "Saved card restored — tap any square to edit a name.";
  } else {
    makeCard();
  }

  updateUndoButton();
  newCardBtn.addEventListener("click", makeCard);
  clearNamesBtn.addEventListener("click", clearNames);
  undoClearBtn.addEventListener("click", undoClearNames);
  exportBtn.addEventListener("click", exportCard);
}

init();

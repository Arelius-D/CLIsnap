// @ts-nocheck

const vscode = acquireVsCodeApi();

const preview = document.getElementById("preview");
const meta = document.getElementById("meta");
const themeSelect = document.getElementById("theme");
const chromeSelect = document.getElementById("chrome");
const showChrome = document.getElementById("show-chrome");
const fontSize = document.getElementById("font-size");
const fontSizeValue = document.getElementById("font-size-value");
const fontSelect = document.getElementById("font");
const lineHeight = document.getElementById("line-height");
const lineHeightValue = document.getElementById("line-height-value");
const padding = document.getElementById("padding");
const paddingValue = document.getElementById("padding-value");

let currentSvg = "";

themeSelect.addEventListener("change", () =>
  vscode.postMessage({ type: "setTheme", value: themeSelect.value })
);
chromeSelect.addEventListener("change", () =>
  vscode.postMessage({ type: "setChrome", value: chromeSelect.value })
);
showChrome.addEventListener("change", () =>
  vscode.postMessage({ type: "setShowChrome", value: showChrome.checked })
);
fontSize.addEventListener("input", () => {
  fontSizeValue.textContent = fontSize.value;
  vscode.postMessage({ type: "setFontSize", value: Number(fontSize.value) });
});
fontSize.addEventListener("change", () =>
  vscode.postMessage({ type: "commitFontSize", value: Number(fontSize.value) })
);
fontSelect.addEventListener("change", () =>
  vscode.postMessage({ type: "setFontFamily", value: fontSelect.value })
);
lineHeight.addEventListener("input", () => {
  lineHeightValue.textContent = String(Number(lineHeight.value));
  vscode.postMessage({ type: "setLineHeight", value: Number(lineHeight.value) });
});
lineHeight.addEventListener("change", () =>
  vscode.postMessage({ type: "commitLineHeight", value: Number(lineHeight.value) })
);
padding.addEventListener("input", () => {
  paddingValue.textContent = padding.value;
  vscode.postMessage({ type: "setPadding", value: Number(padding.value) });
});
padding.addEventListener("change", () =>
  vscode.postMessage({ type: "commitPadding", value: Number(padding.value) })
);

document.getElementById("save-svg").addEventListener("click", () =>
  vscode.postMessage({ type: "saveSvg" })
);
document.getElementById("save-html").addEventListener("click", () =>
  vscode.postMessage({ type: "saveHtml" })
);
document.getElementById("copy-text").addEventListener("click", () =>
  vscode.postMessage({ type: "copyText" })
);
document.getElementById("save-png").addEventListener("click", rasterise);
document.getElementById("reset").addEventListener("click", () =>
  vscode.postMessage({ type: "reset" })
);

function markDefault(select, value, suffix) {
  for (const option of select.options) {
    if (option.dataset.base === undefined) {
      option.dataset.base = option.textContent;
    }
    option.textContent =
      option.value === value ? `${option.dataset.base} ${suffix}` : option.dataset.base;
  }
}

function fillFonts(names, captured) {
  const signature = JSON.stringify([captured, names]);
  if (fontSelect.dataset.signature === signature) {
    return;
  }
  fontSelect.dataset.signature = signature;
  fontSelect.textContent = "";

  const asCaptured = document.createElement("option");
  asCaptured.value = "";
  asCaptured.textContent = captured || "Terminal font";
  fontSelect.appendChild(asCaptured);

  for (const name of names) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    fontSelect.appendChild(option);
  }
}

function rasterise() {
  if (!currentSvg) {
    return;
  }
  const svgElement = preview.querySelector("svg");
  const width = Number(svgElement.getAttribute("width"));
  const height = Number(svgElement.getAttribute("height"));
  const scale = 2;

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);
    vscode.postMessage({ type: "savePng", dataUrl: canvas.toDataURL("image/png") });
  };
  image.onerror = () => {
    vscode.postMessage({ type: "savePng" });
  };
  image.src =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(currentSvg);
}

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "rasterise") {
    rasterise();
    return;
  }
  if (message.type !== "render") {
    return;
  }
  currentSvg = message.svg;
  preview.innerHTML = message.svg;

  const s = message.state;
  if (s.targetKey) {
    themeSelect.value = s.targetKey;
  }
  markDefault(themeSelect, s.defaults.themeKey, "· captured");
  markDefault(chromeSelect, s.defaults.chromeStyle, "· your OS");
  chromeSelect.value = s.chromeStyle;
  showChrome.checked = s.showChrome;
  fontSize.value = s.fontSize;
  fontSizeValue.textContent = s.fontSize;
  fillFonts(s.fonts, s.capturedFont);
  fontSelect.value = s.fontFamily;
  markDefault(fontSelect, "", "· captured");
  lineHeight.value = s.lineHeight;
  lineHeightValue.textContent = String(Number(s.lineHeight));
  padding.value = s.padding;
  paddingValue.textContent = s.padding;
  const modified =
    s.targetKey !== s.defaults.themeKey ||
    s.chromeStyle !== s.defaults.chromeStyle ||
    s.fontSize !== s.defaults.fontSize ||
    s.fontFamily !== "" ||
    s.lineHeight !== s.defaults.lineHeight ||
    s.padding !== s.defaults.padding ||
    !s.showChrome;
  document.getElementById("reset").disabled = !modified;

  meta.textContent =
    `${s.rows} rows · font ${s.fontFamily || s.font}` +
    (modified ? " · customised" : " · as captured");
});

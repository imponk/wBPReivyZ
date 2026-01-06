const upload = document.getElementById("upload");
const canvasFoto = document.getElementById("canvasFoto");
const ctxFoto = canvasFoto.getContext("2d");
const canvasUI = document.getElementById("canvasUI");
const ctxUI = canvasUI.getContext("2d");
const downloadBtn = document.getElementById("download");

const kreditInput = document.getElementById("kreditInput");
const kreditColor = document.getElementById("kreditColor");
const invertJawapos = document.getElementById("invertJawapos");
const invertMedsos = document.getElementById("invertMedsos");
const zoomSlider = document.getElementById("zoomSlider");
const awardSelect = document.getElementById("awardSelect");
const orientationSelect = document.getElementById("orientation");

let img = null, zoomFactor = 1, offsetX = 0, offsetY = 0;
let isDragging = false, dragStartX = 0, dragStartY = 0, dragOffsetX = 0, dragOffsetY = 0;

// Rasio kanvas
const ORIENTATIONS = {
  vertical:       { width: 1080, height: 1350 }, // 4:5
  vertical_9_16:  { width: 1080, height: 1920 }, // 9:16
  horizontal:     { width: 1080, height: 608  }, // 16:9
  square:         { width: 1080, height: 1080 }, // 1:1
  three_two:      { width: 1080, height: 720  }, // 3:2
};

// Normalisasi nilai dari <select>
function normalizeMode(mode) {
  if (!mode) return "vertical";
  const m = String(mode).toLowerCase().trim();
  if (m === "3:2" || m === "three_two" || m === "three-two") return "three_two";
  if (m === "16:9" || m === "widescreen") return "horizontal";
  if (m === "1:1" || m === "square") return "square";
  if (m === "9:16" || m === "vertical_9_16" || m === "vertical-9-16" || m === "reels" || m === "shorts") return "vertical_9_16";
  if (m === "4:5" || m === "vertical" || m === "portrait") return "vertical";
  // fallback ke vertical bila tidak dikenal
  return ORIENTATIONS[m] ? m : "vertical";
}

function setOrientation(mode){
  const key = normalizeMode(mode);
  const o = ORIENTATIONS[key];
  canvasFoto.width = o.width;
  canvasFoto.height = o.height;
  canvasUI.width = o.width;
  canvasUI.height = o.height;
  offsetX = 0;
  offsetY = 0;
  drawFoto(); 
  drawUI();
}

// set awal
setOrientation(normalizeMode(orientationSelect?.value || "vertical"));

// Assets
const logoKiriBawah = new Image();
logoKiriBawah.crossOrigin = "anonymous";
logoKiriBawah.src = "assets/logo-jawapos-kotak.svg";

const logoKananAtas = new Image();
logoKananAtas.crossOrigin = "anonymous";
logoKananAtas.src = "assets/logo-jawapos-teks.svg";

const medsosLogo = new Image();
medsosLogo.crossOrigin = "anonymous";
medsosLogo.src = "assets/logo-medsos.svg";

const awardLogos = { gold: new Image(), silver: new Image(), bronze: new Image() };
awardLogos.gold.src = "assets/award-gold.png";
awardLogos.silver.src = "assets/award-silver.png";
awardLogos.bronze.src = "assets/award-bronze.png";

function rel(n){ return Math.round(Math.min(canvasFoto.width, canvasFoto.height) * n); }

function drawFoto(){
  if (!img) { ctxFoto.clearRect(0,0,canvasFoto.width,canvasFoto.height); return; }
  ctxFoto.fillStyle = "#fafafa";
  ctxFoto.fillRect(0,0,canvasFoto.width,canvasFoto.height);

  const baseScale = Math.max(canvasFoto.width / img.width, canvasFoto.height / img.height);
  const scale = baseScale * zoomFactor;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const posX = (canvasFoto.width - drawW) / 2 + offsetX;
  const posY = (canvasFoto.height - drawH) / 2 + offsetY;
  ctxFoto.drawImage(img, posX, posY, drawW, drawH);

  const orientation = normalizeMode(orientationSelect?.value);
  let scaleFactor = 1.0;
  if (orientation === "vertical" || orientation === "square") scaleFactor = 0.9;
  else if (orientation === "horizontal" || orientation === "three_two") scaleFactor = 0.8;
  else if (orientation === "vertical_9_16") scaleFactor = 0.9; // ✅ selaras dengan vertical/square

  // === LOGO TEKS (kanan atas: 50 dari kanan, 45 dari atas)
  if (logoKananAtas.complete){
    const w = Math.round(canvasFoto.width * 0.185 * scaleFactor);
    const h = logoKananAtas.height * (w / logoKananAtas.width);
    const x = canvasFoto.width - w - 50;
    const y = 45;
    ctxFoto.save();
    if (invertJawapos.checked) ctxFoto.filter = "invert(1)";
    ctxFoto.drawImage(logoKananAtas, x, y, w, h);
    ctxFoto.restore();
  }

  // === LOGO KOTAK (kiri bawah, menempel)
  if (logoKiriBawah.complete){
    const w = Math.round(canvasFoto.width * 0.093 * scaleFactor);
    const h = logoKiriBawah.height * (w / logoKiriBawah.width);
    ctxFoto.drawImage(logoKiriBawah, 0, canvasFoto.height - h, w, h);
  }

  // === LOGO MEDSOS (tengah bawah)
  if (medsosLogo.complete){
    const maxW = canvasFoto.width * 0.71;
    const sc = maxW / medsosLogo.width;
    const w = medsosLogo.width * sc;
    const h = medsosLogo.height * sc;
    const bottomGap = Math.round(canvasFoto.height * 0.12);
    ctxFoto.save();
    if (invertMedsos.checked) ctxFoto.filter = "invert(1)";
    ctxFoto.drawImage(medsosLogo, (canvasFoto.width - w)/2, canvasFoto.height - h - bottomGap, w, h);
    ctxFoto.restore();
  }

  // === KREDIT FOTO
  if (kreditInput.value){
    let marginRight, marginBottom;
    if (orientation === "horizontal" || orientation === "three_two") {
      marginRight = 50;
      marginBottom = 45;
    } else {
      marginRight = Math.round(canvasFoto.height * 0.046);
      marginBottom = marginRight;
    }
    ctxFoto.font = `bold ${Math.max(14, Math.round(canvasFoto.height * 0.016))}px Metropolis`;
    ctxFoto.fillStyle = kreditColor.value;
    const tw = ctxFoto.measureText(kreditInput.value).width;
    ctxFoto.fillText(kreditInput.value, canvasFoto.width - tw - marginRight, canvasFoto.height - marginBottom);
  }

  // === AWARD LOGO
  const type = awardSelect.value;
  if (type && awardLogos[type] && awardLogos[type].complete){
    const logo = awardLogos[type];
    const marginRight = 46;

    let awardScale = 1.0;
    let marginBottom = 150; // square default (lihat tabel terbaru: vertical 170, square 150, horizontal/3:2 90)

    if (orientation === "vertical")      marginBottom = 170;
    else if (orientation === "square")   marginBottom = 150;
    else if (orientation === "horizontal" || orientation === "three_two") {
      marginBottom = 90;
      awardScale = 1.6;
    }
    else if (orientation === "vertical_9_16") marginBottom = 170; // ✅ samakan dengan vertical

    const w = rel(0.11) * awardScale;
    const h = logo.height * (w / logo.width);

    const theta = Math.PI / 10;   // 18°
    const drop = w * Math.sin(theta); // koreksi jarak bawah karena rotasi (pivot kanan-bawah)

    const tx = canvasFoto.width - marginRight;
    const ty = canvasFoto.height - marginBottom - drop;

    ctxFoto.save();
    ctxFoto.translate(tx, ty);
    ctxFoto.rotate(-theta);
    // gambar dengan top-left (-w,-h) => pivot = kanan-bawah sebelum rotasi
    ctxFoto.drawImage(logo, -w, -h, w, h);
    ctxFoto.restore();
  }
}

// UI garis ukur
function drawUI(){
  ctxUI.clearRect(0,0,canvasUI.width,canvasUI.height);
  ctxUI.save();
  ctxUI.strokeStyle = "#000";
  ctxUI.fillStyle = "#000";
  ctxUI.font = Math.max(10, rel(0.012)) + "px Arial";
  for(let i=0;i<=24;i++){
    const y = (canvasUI.height/24)*i;
    ctxUI.beginPath(); ctxUI.moveTo(0,y); ctxUI.lineTo(rel(0.014),y); ctxUI.stroke();
    ctxUI.fillText(i, rel(0.02), y + rel(0.004));
  }
  ctxUI.restore();
}

function snapToRuler(y){
  const step = canvasFoto.height/24;
  return Math.round(y/step)*step;
}

function loadMainImageFromDataURL(dataUrl){
  const newImg = new Image();
  newImg.onload = ()=>{ img=newImg; drawFoto(); drawUI(); };
  newImg.src=dataUrl;
}

upload.addEventListener("change", e=>{
  const f = e.target.files && e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ev => loadMainImageFromDataURL(ev.target.result);
  reader.readAsDataURL(f);
});

kreditInput.addEventListener("input", drawFoto);
kreditColor.addEventListener("change", drawFoto);
invertJawapos.addEventListener("change", drawFoto);
invertMedsos.addEventListener("change", drawFoto);
awardSelect.addEventListener("change", drawFoto);
zoomSlider.addEventListener("input", ()=>{ zoomFactor = parseFloat(zoomSlider.value); drawFoto(); });

// pastikan change menangkap "3:2" maupun "three_two"
orientationSelect.addEventListener("change", (e)=>{ setOrientation(normalizeMode(e.target.value)); });

// Drag & zoom (mouse)
canvasFoto.addEventListener("mousedown", e=>{
  isDragging=true; dragStartX=e.clientX; dragStartY=e.clientY;
  dragOffsetX=offsetX; dragOffsetY=offsetY; canvasFoto.classList.add("grabbing");
});
window.addEventListener("mousemove", e=>{
  if(!isDragging) return;
  offsetX=dragOffsetX+(e.clientX-dragStartX);
  offsetY=dragOffsetY+(e.clientY-dragStartY);
  drawFoto(); drawUI();
});
window.addEventListener("mouseup", ()=>{
  if(isDragging){ offsetY=snapToRuler(offsetY); drawFoto(); drawUI(); }
  isDragging=false; canvasFoto.classList.remove("grabbing");
});

// Pinch zoom (touch)
let lastDist=0;
canvasFoto.addEventListener("touchstart",e=>{
  if(e.touches.length===2){
    lastDist=Math.hypot(
      e.touches[0].clientX-e.touches[1].clientX,
      e.touches[0].clientY-e.touches[1].clientY
    );
  }
});
canvasFoto.addEventListener("touchmove",e=>{
  if(e.touches.length===2){
    const newDist=Math.hypot(
      e.touches[0].clientX-e.touches[1].clientX,
      e.touches[0].clientY-e.touches[1].clientY
    );
    const sc=newDist/lastDist;
    zoomFactor*=sc; zoomFactor=Math.max(0.1,Math.min(2,zoomFactor));
    zoomSlider.value=zoomFactor; lastDist=newDist;
    drawFoto(); drawUI();
  }
});

// Download
downloadBtn.addEventListener("click", ()=>{
  if (!img) return alert("Belum ada gambar.");
  drawFoto();
  canvasFoto.toBlob(blob=>{
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="hasil-instagram.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },"image/jpeg",0.92);
});

// init
drawUI();
Promise.all([
  new Promise(res => logoKiriBawah.onload = res),
  new Promise(res => logoKananAtas.onload = res),
  new Promise(res => medsosLogo.onload = res),
  new Promise(res => awardLogos.gold.onload = res),
  new Promise(res => awardLogos.silver.onload = res),
  new Promise(res => awardLogos.bronze.onload = res)
]).then(() => { drawFoto(); });

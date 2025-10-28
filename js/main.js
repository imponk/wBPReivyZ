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

// Orientasi & ukuran kanvas
const ORIENTATIONS = {
  vertical:  { width: 1080, height: 1350 },   // 4:5 – rekomendasi IG
  horizontal:{ width: 1080, height: 608 }     // 16:9 – rekomendasi IG (dibulatkan)
};
function setOrientation(mode){
  const o = ORIENTATIONS[mode] || ORIENTATIONS.vertical;
  canvasFoto.width = o.width;  canvasFoto.height = o.height;
  canvasUI.width   = o.width;  canvasUI.height   = o.height;
  // reset view tapi simpan zoom agar feel-nya konsisten
  offsetX = 0;
  offsetY = 0;
  drawFoto(); drawUI();
}
setOrientation(orientationSelect?.value || "vertical");

// Logo
const logoKiriBawah = new Image();
logoKiriBawah.crossOrigin = "anonymous";
logoKiriBawah.src = "assets/logo-jawapos-kotak.svg";

const logoKananAtas = new Image();
logoKananAtas.crossOrigin = "anonymous";
logoKananAtas.src = "assets/logo-jawapos-teks.svg";

const medsosLogo = new Image();
medsosLogo.crossOrigin = "anonymous";
medsosLogo.src = "assets/logo-medsos.svg";

// Award logos
const awardLogos = {
  gold: new Image(),
  silver: new Image(),
  bronze: new Image()
};
awardLogos.gold.src = "assets/award-gold.png";
awardLogos.silver.src = "assets/award-silver.png";
awardLogos.bronze.src = "assets/award-bronze.png";

function rel(n){ // helper untuk ukuran relatif berdasarkan sisi terkecil kanvas
  return Math.round(Math.min(canvasFoto.width, canvasFoto.height) * n);
}

function drawFoto(){
  if (!img) {
    ctxFoto.clearRect(0,0,canvasFoto.width,canvasFoto.height);
    return;
  }
  ctxFoto.fillStyle = "#fafafa";
  ctxFoto.fillRect(0,0,canvasFoto.width,canvasFoto.height);

  // Foto (cover + zoom + drag)
  const baseScale = Math.max(canvasFoto.width / img.width, canvasFoto.height / img.height);
  const scale = baseScale * zoomFactor;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const posX = (canvasFoto.width - drawW) / 2 + offsetX;
  const posY = (canvasFoto.height - drawH) / 2 + offsetY;
  ctxFoto.drawImage(img, posX, posY, drawW, drawH);

  const margin = rel(0.046); // ~50px pada 1080 tinggi
  // Logo kanan atas (lebar relatif)
  if (logoKananAtas.complete){
    const w = Math.round(canvasFoto.width * 0.185);
    const h = logoKananAtas.height * (w / logoKananAtas.width);
    ctxFoto.save();
    if (invertJawapos.checked) ctxFoto.filter = "invert(1)";
    ctxFoto.drawImage(logoKananAtas, canvasFoto.width - w - margin, margin, w, h);
    ctxFoto.restore();
  }

  // Logo kiri bawah
  if (logoKiriBawah.complete){
    const w = Math.round(canvasFoto.width * 0.093);
    const h = logoKiriBawah.height * (w / logoKiriBawah.width);
    ctxFoto.drawImage(logoKiriBawah, margin * 0.3, canvasFoto.height - h, w, h);
  }

  // Logo medsos (lebar maksimal 71% lebar kanvas, dengan jarak bawah relatif)
  if (medsosLogo.complete){
    const maxW = canvasFoto.width * 0.71;
    const sc = maxW / medsosLogo.width;
    const w = medsosLogo.width * sc;
    const h = medsosLogo.height * sc;
    const bottomGap = rel(0.12); // jarak dari bawah
    ctxFoto.save();
    if (invertMedsos.checked) ctxFoto.filter = "invert(1)";
    ctxFoto.drawImage(medsosLogo, (canvasFoto.width - w)/2, canvasFoto.height - h - bottomGap, w, h);
    ctxFoto.restore();
  }

  // Kredit foto
  if (kreditInput.value){
    ctxFoto.font = `${Math.max(14, rel(0.016))}px Metropolis`;
    ctxFoto.font = 'bold ' + ctxFoto.font;
    ctxFoto.fillStyle = kreditColor.value;
    const tw = ctxFoto.measureText(kreditInput.value).width;
    ctxFoto.fillText(kreditInput.value, canvasFoto.width - tw - margin, canvasFoto.height - margin);
  }

  // Award
  const type = awardSelect.value;
  if (type && awardLogos[type] && awardLogos[type].complete){
    const logo = awardLogos[type];
    const w = rel(0.11);
    const h = logo.height * (w / logo.width);
    const ax = canvasFoto.width - margin * 2.2;
    const ay = canvasFoto.height - margin * 3.6;
    ctxFoto.save();
    ctxFoto.translate(ax, ay);
    ctxFoto.rotate(-Math.PI/10);
    ctxFoto.drawImage(logo, -w/2, -h/2, w, h);
    ctxFoto.restore();
  }
}

function drawUI(){
  ctxUI.clearRect(0,0,canvasUI.width,canvasUI.height);
  ctxUI.save();
  ctxUI.strokeStyle = "#000";
  ctxUI.fillStyle = "#000";
  ctxUI.font = Math.max(10, rel(0.012)) + "px Arial";
  for(let i=0;i<=24;i++){
    const y = (canvasUI.height/24)*i;
    ctxUI.beginPath();
    ctxUI.moveTo(0,y);
    ctxUI.lineTo(rel(0.014),y);
    ctxUI.stroke();
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
  const file=e.target.files&&e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>loadMainImageFromDataURL(ev.target.result);
  reader.readAsDataURL(file);
});

kreditInput.addEventListener("input", drawFoto);
kreditColor.addEventListener("change", drawFoto);
invertJawapos.addEventListener("change", drawFoto);
invertMedsos.addEventListener("change", drawFoto);
awardSelect.addEventListener("change", drawFoto);
zoomSlider.addEventListener("input", ()=>{ zoomFactor=parseFloat(zoomSlider.value); drawFoto(); });

// Ganti orientasi
orientationSelect.addEventListener("change", (e)=>{
  setOrientation(e.target.value);
});

// Drag
canvasFoto.addEventListener("mousedown", e=>{
  isDragging=true;dragStartX=e.clientX;dragStartY=e.clientY;
  dragOffsetX=offsetX;dragOffsetY=offsetY;
  canvasFoto.classList.add("grabbing");
});
window.addEventListener("mousemove", e=>{
  if(!isDragging)return;
  offsetX=dragOffsetX+(e.clientX-dragStartX);
  offsetY=dragOffsetY+(e.clientY-dragStartY);
  drawFoto();drawUI();
});
window.addEventListener("mouseup", ()=>{
  if(isDragging){
    offsetY=snapToRuler(offsetY);
    drawFoto();drawUI();
  }
  isDragging=false;canvasFoto.classList.remove("grabbing");
});

// Pinch zoom
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
    const scale=newDist/lastDist;
    zoomFactor*=scale;
    zoomFactor=Math.max(0.1,Math.min(2,zoomFactor));
    zoomSlider.value=zoomFactor;
    lastDist=newDist;
    drawFoto();drawUI();
  }
});

// Download hanya foto
downloadBtn.addEventListener("click", ()=>{
  if (!img) return alert("Belum ada gambar.");
  drawFoto(); // pastikan sudah tergambar
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

drawUI();
// Muat semua gambar aset saat script dijalankan
Promise.all([
    new Promise(resolve => logoKiriBawah.onload = resolve),
    new Promise(resolve => logoKananAtas.onload = resolve),
    new Promise(resolve => medsosLogo.onload = resolve),
    new Promise(resolve => awardLogos.gold.onload = resolve),
    new Promise(resolve => awardLogos.silver.onload = resolve),
    new Promise(resolve => awardLogos.bronze.onload = resolve)
]).then(() => {
    console.log("Semua aset gambar berhasil dimuat.");
    drawFoto();
});

import init, { 
  init_world, 
  update, 
  set_gravity, 
  set_targets, 
  set_morph, 
  burst,
  push_horizontal,
} from '../public/pkg/particulas.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const btnFormar = document.getElementById('formar') as HTMLButtonElement;
const btnLiberar= document.getElementById('liberar') as HTMLButtonElement;
const textoField= document.getElementById('text') as HTMLTextAreaElement;
const gravity   = document.getElementById('gravity') as HTMLInputElement;

let last = performance.now();

// estado para colorear durante morph
let morphActive = false;
let totalTargets = 0;
let circleTargetsCount = 0; // para la bola (naranja)
let starTargetsCount   = 0; // para estrellas (rojo)

function draw(positions: Float32Array | number[]) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (morphActive && totalTargets > 0) {
    // PASADA 1: partículas cuyo target cae en la parte del círculo
    ctx.beginPath();
    for (let i = 0; i < positions.length; i += 2) {
      const particleIndex = (i / 2) | 0;
      const targetIndex = particleIndex % totalTargets;
      if (targetIndex < circleTargetsCount) {
        const x = positions[i], y = positions[i + 1];
        ctx.moveTo(x + 2, y);
        ctx.arc(x, y, 2, 0, Math.PI * 2);
      }
    }
    ctx.fillStyle = '#f39c12'; // naranja círculo
    ctx.fill();

    // PASADA 2: partículas cuyo target cae en las estrellas
    ctx.beginPath();
    for (let i = 0; i < positions.length; i += 2) {
      const particleIndex = (i / 2) | 0;
      const targetIndex = particleIndex % totalTargets;
      if (targetIndex >= circleTargetsCount) {
        const x = positions[i], y = positions[i + 1];
        ctx.moveTo(x + 2, y);
        ctx.arc(x, y, 2, 0, Math.PI * 2);
      }
    }
    ctx.fillStyle = '#e02424'; // rojo estrellas
    ctx.fill();
  } else {
    // modo libre → un color
    ctx.beginPath();
    for (let i = 0; i < positions.length; i += 2) {
      const x = positions[i], y = positions[i + 1];
      ctx.moveTo(x + 2, y);
      ctx.arc(x, y, 2, 0, Math.PI * 2);
    }
    ctx.fillStyle = '#4cf';
    ctx.fill();
  }
}

function loop(now: number) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.033) dt = 0.033; // clamp
  const positions = update(dt, canvas.width, canvas.height);
  draw(positions);
  requestAnimationFrame(loop);
}

// --------- Generadores de targets ---------

// Bola de dragón 4★ (círculo con estrellas recortadas) → devuelve [targets, counts]
function createDragonBallTargets(width: number, height: number) {
  const W = 400, H = 400;  // Canvas más grande para mejor resolución
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const octx = off.getContext('2d')!;

  // Esfera naranja con gradiente
  const gradient = octx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 180);
  gradient.addColorStop(0, '#ffa726');  // Naranja más brillante en el centro
  gradient.addColorStop(0.7, '#f57c00'); // Naranja más oscuro
  gradient.addColorStop(1, '#e65100');   // Borde más oscuro
  
  octx.clearRect(0, 0, W, H);
  octx.beginPath();
  octx.arc(W/2, H/2, 180, 0, Math.PI * 2);
  octx.fillStyle = gradient;
  octx.fill();

  // Brillo superior
  const highlightGradient = octx.createRadialGradient(W/2 - 50, H/2 - 50, 0, W/2, H/2, 180);
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  octx.fillStyle = highlightGradient;
  octx.fill();

  // Función mejorada para dibujar estrellas
  const starPath = (cx: number, cy: number, r: number, points = 5) => {
    octx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const ang = (i * Math.PI) / points - Math.PI/2;
      const rr = i % 2 === 0 ? r : r * 0.4;  // Puntas más pronunciadas
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr;
      i === 0 ? octx.moveTo(x, y) : octx.lineTo(x, y);
    }
    octx.closePath();
  };

  // Dibuja las estrellas con borde
  const d = 75;  // Mayor separación entre estrellas
  const starRadius = 30;  // Estrellas más grandes
  
  // Primero los bordes negros de las estrellas
  octx.globalCompositeOperation = 'destination-over';
  octx.lineWidth = 3;
  octx.strokeStyle = '#000';
  [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
    starPath(W/2 + dx * d, H/2 + dy * d, starRadius + 2);
    octx.stroke();
  });

  // Luego el relleno rojo
  octx.fillStyle = '#dd2c00';  // Rojo más vibrante
  [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
    starPath(W/2 + dx * d, H/2 + dy * d, starRadius);
    octx.fill();
  });

  // vuelve a modo normal y pinta estrellas rojas (para muestrearlas)
  octx.globalCompositeOperation = 'source-over';
  octx.fillStyle = '#e02424';
  starPath(W/2, H/2 - d, 20);
  starPath(W/2, H/2 + d, 20);
  starPath(W/2 - d, H/2, 20);
  starPath(W/2 + d, H/2, 20);

  const img = octx.getImageData(0, 0, W, H).data;
  const scale = Math.min(width, height) / 2.5 / (W/2);  // Ajustado para mejor tamaño
  const cx = width / 2, cy = height / 2;

  const circleStep = 5;  // Más densidad en la esfera
  const starStep = 2;    // Más densidad en las estrellas
  const circle: number[] = [];
  const stars: number[] = [];

  for (let y = 0; y < H; y += circleStep) {
    for (let x = 0; x < W; x += circleStep) {
      const i = (y * W + x) * 4;
      const r = img[i], g = img[i+1], b = img[i+2], a = img[i+3];
      if (a > 10 && !(r > 200 && g < 80 && b < 80)) {
        circle.push((x - W/2) * scale + cx, (y - H/2) * scale + cy);
      }
    }
  }
  for (let y = 0; y < H; y += starStep) {
    for (let x = 0; x < W; x += starStep) {
      const i = (y * W + x) * 4;
      const r = img[i], g = img[i+1], b = img[i+2], a = img[i+3];
      if (a > 10 && r > 200 && g < 80 && b < 80) {
        stars.push((x - W/2) * scale + cx, (y - H/2) * scale + cy);
      }
    }
  }

  // shuffle simple para que no se vean rejillas perfectas
  const shuffle = (arr: number[]) => {
    for (let i = arr.length - 2; i > 0; i -= 2) {
      const j = (Math.floor(Math.random() * (i/2 + 1)) * 2);
      [arr[i], arr[j]] = [arr[j], arr[i]];
      [arr[i+1], arr[j+1]] = [arr[j+1], arr[i+1]];
    }
  };
  shuffle(circle); shuffle(stars);

  const targets = new Float32Array(circle.length + stars.length);
  targets.set(circle, 0);
  targets.set(stars, circle.length);

  return { targets, circleCount: circle.length/2, starCount: stars.length/2 };
}

// Texto “Erituzr”
function createTextTargets(text: string, width: number, height: number): Float32Array {
  const W = 800, H = 240;
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const octx = off.getContext('2d')!;

  octx.clearRect(0, 0, W, H);
  octx.fillStyle = '#ffffff';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.font = 'bold 180px system-ui, sans-serif';
  octx.fillText(text, W/2, H/2);

  const img = octx.getImageData(0, 0, W, H).data;

  // escala para que el texto quepa con margen
  const scale = Math.min(width / W, height / H) * 0.8;
  const cx = width / 2, cy = height / 2;

  const step = 4; // baja para más densidad
  const pts: number[] = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const a = img[(y * W + x) * 4 + 3];
      if (a > 10) {
        pts.push((x - W/2) * scale + cx, (y - H/2) * scale + cy);
      }
    }
  }

  // mezclar un poco
  for (let i = pts.length - 2; i > 0; i -= 2) {
    const j = (Math.floor(Math.random() * (i/2 + 1)) * 2);
    [pts[i], pts[j]] = [pts[j], pts[i]];
    [pts[i+1], pts[j+1]] = [pts[j+1], pts[i+1]];
  }

  return new Float32Array(pts);
}

// Péndulo invertido formado por partículas
function createInvertedPendulumTargets(width: number, height: number): Float32Array {
  const pts: number[] = [];
  const centerX = width / 2;
  const baseY = height * 0.7;  // Base en el 70% de la altura
  const poleHeight = height * 0.4;  // Altura del mástil
  const spacing = 8;  // Espaciado entre partículas
  
  // Base ancha (triángulo)
  const baseWidth = 120;
  for (let x = -baseWidth/2; x <= baseWidth/2; x += spacing) {
    const y = baseY - Math.abs(x/baseWidth) * 30; // Forma triangular
    pts.push(centerX + x, y);
  }
  
  // Mástil vertical (más denso en la parte superior)
  for (let y = baseY; y >= baseY - poleHeight; y -= spacing) {
    // Añadir partículas con ligera variación horizontal
    const variation = Math.min((baseY - y) / poleHeight * 15, 15);
    for (let i = -1; i <= 1; i++) {
      pts.push(centerX + i * variation, y);
    }
  }

  // Mezclar aleatoriamente para evitar patrones
  for (let i = pts.length - 2; i > 0; i -= 2) {
    const j = (Math.floor(Math.random() * (i/2 + 1)) * 2);
    [pts[i], pts[j]] = [pts[j], pts[i]];
    [pts[i+1], pts[j+1]] = [pts[j+1], pts[i+1]];
  }

  return new Float32Array(pts);
}

// --------- Estado y control de UI ---------

let currentState = 'idle'; // idle, sphere, text, pendulum

function updateButtonStates() {
  const btnPerturbar = document.getElementById('perturbar') as HTMLButtonElement;
  const btnLiberar = document.getElementById('liberar') as HTMLButtonElement;

  // Solo se pueden perturbar/liberar las partículas cuando hay una forma activa
  const hasActiveForm = currentState !== 'idle';
  btnPerturbar.disabled = !hasActiveForm;
  btnLiberar.disabled = !hasActiveForm;
}

// --------- Setup y eventos ---------

async function main() {
  await init();

  init_world(1200, canvas.width, canvas.height);
  set_gravity(parseFloat(gravity.value));
  updateButtonStates(); // Estado inicial

  gravity.addEventListener('input', () => {
    set_gravity(parseFloat(gravity.value));
  });

  btnFormar.addEventListener('click', () => {
    const { targets, circleCount, starCount } = createDragonBallTargets(canvas.width, canvas.height);
    set_targets(targets as unknown as Float32Array)
    totalTargets = circleCount + starCount;
    circleTargetsCount = circleCount;
    starTargetsCount = starCount;
    morphActive = true;
    set_morph(true);
    currentState = 'sphere';
    updateButtonStates();
  });



  const btnPendulo = document.getElementById('pendulo') as HTMLButtonElement;
  const btnPerturbar = document.getElementById('perturbar') as HTMLButtonElement;

  btnPendulo.addEventListener('click', () => {
    const targets = createInvertedPendulumTargets(canvas.width, canvas.height);
    set_targets(targets as unknown as Float32Array);
    totalTargets = targets.length / 2;
    circleTargetsCount = totalTargets; // un solo color
    starTargetsCount = 0;
    morphActive = true;
    set_morph(true);
    currentState = 'pendulum';
    updateButtonStates();
  });

  btnPerturbar.addEventListener('click', () => {
    // Aplicar una fuerza lateral uniforme
    const direction = Math.random() > 0.5 ? 1 : -1;  // Dirección aleatoria
    push_horizontal(direction * 1280);  // Fuerza moderada
  });

  btnLiberar.addEventListener('click', () => {
    morphActive = false;
    totalTargets = circleTargetsCount = starTargetsCount = 0;
    burst(255);
    set_morph(false);
    set_targets(new Float32Array(0) as unknown as Float32Array);
    currentState = 'idle';
    updateButtonStates();
  });

  textoField.addEventListener('input', () => {
    const texto = textoField.value;
    // Aquí llamas a tu función que genera los targets del texto
    const targets = createTextTargets(texto, canvas.width, canvas.height);
    set_targets(targets as any);
    set_morph(true);
  });

  requestAnimationFrame(loop);
}

main().catch(console.error);
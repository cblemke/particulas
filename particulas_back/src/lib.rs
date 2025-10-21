use wasm_bindgen::prelude::*;
use std::cell::RefCell;

#[derive(Clone)]
struct Particle {
    x: f32, y: f32,
    vx: f32, vy: f32,
    r: f32,
}

struct World {
    particles: Vec<Particle>,
    targets: Vec<f32>,   // [x0,y0, x1,y1, ...]
    morph: bool,
}

thread_local! {
    static WORLD: RefCell<Option<World>> = RefCell::new(None);
    static GRAVITY: RefCell<f32> = RefCell::new(0.0);
}

#[wasm_bindgen]
pub fn set_gravity(g: f32) {
    GRAVITY.with(|v| *v.borrow_mut() = g);
}

#[wasm_bindgen]
pub fn init_world(n: usize, width: f32, height: f32) {
    use rand::{Rng, SeedableRng};
    let mut rng = rand::rngs::StdRng::seed_from_u64(42);

    let mut particles = Vec::with_capacity(n);
    for _ in 0..n {
        let r = 2.0;
        let x = rng.gen_range(r..(width - r));
        let y = rng.gen_range(r..(height - r));
        let vx = rng.gen_range(-80.0..80.0);
        let vy = rng.gen_range(-80.0..80.0);
        particles.push(Particle { x, y, vx, vy, r });
    }

    WORLD.with(|w| {
        *w.borrow_mut() = Some(World {
            particles,
            targets: Vec::new(),
            morph: false,
        });
    });
}

#[wasm_bindgen]
pub fn set_targets(targets: Vec<f32>) {
    // Esperamos pares [x,y]. Si viene vacío, desactivamos morph.
    WORLD.with(|cell| {
        if let Some(w) = cell.borrow_mut().as_mut() {
            w.targets = targets;
            w.morph = !w.targets.is_empty();
        }
    });
}

#[wasm_bindgen]
pub fn push_horizontal(strength: f32) {
    // Semilla aleatoria para cada perturbación
    let seed = js_sys::Date::now() as u64;
    use rand::{Rng, SeedableRng};
    let mut rng = rand::rngs::StdRng::seed_from_u64(seed);

    WORLD.with(|cell| {
        if let Some(w) = cell.borrow_mut().as_mut() {
            // No desactivamos morph, queremos mantener la forma
            for p in &mut w.particles {
                // La dirección es la misma (strength) pero la magnitud varía
                let factor = rng.gen_range(0.5..1.5);  // ±50% de variación
                p.vx += strength * factor;
            }
        }
    });
}

#[wasm_bindgen]
pub fn burst(strength: f32) {
    // Semilla distinta cada vez (reloj JS del navegador)
    let seed = js_sys::Date::now() as u64;
    use rand::{Rng, SeedableRng};
    let mut rng = rand::rngs::StdRng::seed_from_u64(seed);

    WORLD.with(|cell| {
        if let Some(w) = cell.borrow_mut().as_mut() {
            // desactiva morph (si quieres, limpia targets)
            w.morph = false;
            // w.targets.clear();

            for p in &mut w.particles {
                // Dirección aleatoria uniforme
                let theta: f32 = rng.gen_range(0.0..std::f32::consts::TAU);
                // Magnitud con un poco de jitter para que no sea todo igual
                let mag: f32 = strength * rng.gen_range(0.8..1.2);

                // Puedes sumar al velocity o reemplazarlo. Yo *sumo* para que
                // conserve un poquito del movimiento que llevaba:
                p.vx += mag * theta.cos();
                p.vy += mag * theta.sin();
            }
        }
    });
}

#[wasm_bindgen]
pub fn set_morph(enable: bool) {
    WORLD.with(|cell| {
        if let Some(w) = cell.borrow_mut().as_mut() {
            w.morph = enable && !w.targets.is_empty();
        }
    });
}

#[wasm_bindgen]
pub fn update(dt: f32, width: f32, height: f32) -> Vec<f32> {
    let mut out = Vec::new();
    let g = GRAVITY.with(|v| *v.borrow());
    WORLD.with(|cell| {
        if let Some(w) = cell.borrow_mut().as_mut() {
            let friction = 0.999;

            for (i, p) in w.particles.iter_mut().enumerate() {
                if w.morph && !w.targets.is_empty() {
                    // Asigna objetivo por índice (si hay menos objetivos que partículas, reusa con módulo)
                    let ti = (2 * (i % (w.targets.len()/2))) as usize;
                    let tx = w.targets[ti];
                    let ty = w.targets[ti + 1];

                    // Fuerza tipo muelle + amortiguación
                    let k = 80.0;          // rigidez
                    let c = 12.0;          // amortiguación
                    let ax = k * (tx - p.x) - c * p.vx;
                    let ay = k * (ty - p.y) - c * p.vy;

                    p.vx += ax * dt;
                    p.vy += ay * dt;
                } else {
                    // modo libre: gravedad + rozamiento + rebotes
                    p.vy += g * dt;
                    p.vx *= friction;
                    p.vy *= friction;
                }

                // Integración y límites
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                if !w.morph {
                    // Solo rebotar en modo libre
                    if p.x - p.r <= 0.0 { p.x = p.r; p.vx = -p.vx; }
                    if p.x + p.r >= width  { p.x = width - p.r; p.vx = -p.vx; }
                    if p.y - p.r <= 0.0 { p.y = p.r; p.vy = -p.vy; }
                    if p.y + p.r >= height { p.y = height - p.r; p.vy = -p.vy; }
                }

                out.push(p.x);
                out.push(p.y);
            }
        }
    });
    out
}
# Simulador de Partículas con Rust + WebAssembly

Una simulación interactiva de partículas implementada con Rust (compilado a WebAssembly) y TypeScript. Las partículas pueden formar diferentes patrones y responder a fuerzas físicas.

![Demo del Simulador](demo.gif)

## Objetivos

  - Ejecutar backend mediante WebAssembly con el navegador
  - Ejecución y visualización de físicas sobre partículas
  - Visualización de corrección PID (Proporcional-Integral-Derivativo) 

## Características

- 🎯 Formación de patrones:
  - Esfera
  - Texto dinámico
  - Péndulo invertido
- 🌪️ Simulación física:
  - Sistema de partículas con fuerzas de atracción simulando muelles
  - Gravedad ajustable
  - Perturbaciones aleatorias con corrección PID
- 🚀 Tecnologías:
  - Rust → WebAssembly para la física
  - TypeScript para la lógica del frontend
  - Canvas para el renderizado

## Estructura del Proyecto

```
particulas/
├── particulas_back/     # Backend en Rust (compilado a WASM)
│   ├── src/
│   │   ├── lib.rs      # Lógica principal de simulación
│   │   └── utils.rs    # Utilidades
│   └── Cargo.toml      # Dependencias Rust
└── particulas_front/    # Frontend
    └── web/
        ├── src/
        │   ├── main.ts # Lógica de UI y renderizado
        │   └── style.css
        └── index.html
```

## Desarrollo Local

1. **Prerrequisitos**
   ```bash
   # Instalar wasm-pack si no está instalado
   cargo install wasm-pack
   ```

2. **Compilar WebAssembly**
   ```bash
   cd particulas_back
   wasm-pack build --target web
   ```

3. **Iniciar Frontend**
   ```bash
   cd ../particulas_front/web
   npm install
   npm run dev
   ```

## Licencia

Este proyecto está licenciado bajo Apache License 2.0 y MIT License - ver los archivos [LICENSE_APACHE](particulas_back/LICENSE_APACHE) y [LICENSE_MIT](particulas_back/LICENSE_MIT) para más detalles.

## Contribuir

Las contribuciones son bienvenidas!
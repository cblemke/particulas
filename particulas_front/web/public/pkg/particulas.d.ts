/* tslint:disable */
/* eslint-disable */
export function set_gravity(g: number): void;
export function init_world(n: number, width: number, height: number): void;
export function set_targets(targets: Float32Array): void;
export function push_horizontal(strength: number): void;
export function burst(strength: number): void;
export function set_morph(enable: boolean): void;
export function update(dt: number, width: number, height: number): Float32Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly set_gravity: (a: number) => void;
  readonly init_world: (a: number, b: number, c: number) => void;
  readonly set_targets: (a: number, b: number) => void;
  readonly push_horizontal: (a: number) => void;
  readonly burst: (a: number) => void;
  readonly set_morph: (a: number) => void;
  readonly update: (a: number, b: number, c: number) => [number, number];
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

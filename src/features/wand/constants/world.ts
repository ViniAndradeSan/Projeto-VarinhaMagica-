export const MAX_RENDER_POINTS = 80;

export const CURSOR_SIZE = 44;

/** Duração do efeito de casting na tela (ms) */
export const CAST_DISPLAY_MS = 3000;

/** Duração do estado de erro antes de resetar (ms) */
export const ERROR_DISPLAY_MS = 1500;

export const MIN_MOVE = 0.007;
export const MAX_POINTS = 24;


export const DEFAULT_LANGUAGE = "pt-BR";

export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

//--
export const N = 64;
export const MIN_RECOGNITION_SCORE = 0.55;
export const NOISE_THRESHOLD = 0.15;
export const MIN_POINTS = 6;
export const SQUARE_SIZE = 1;

export const HALF_DIAGONAL = Math.SQRT2 / 2;

export const ANGLE_RANGE = Math.PI / 4;
export const ANGLE_PRECISION = Math.PI / 90;
export const PHI = 0.5 * (-1 + Math.sqrt(5));

export const START_SAMPLES = 8;

export const DEBUG = false;
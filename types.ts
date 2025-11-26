export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  GENERATING_PREVIEW = 'GENERATING_PREVIEW',
  PREVIEW_READY = 'PREVIEW_READY',
  ERROR = 'ERROR'
}

export type Language = 'en' | 'ar';

export interface GraftDistribution {
  zone: string;
  count: number;
}

export interface AnalysisResult {
  norwoodScale: number;
  totalGrafts: number;
  distribution: GraftDistribution[];
  estimatedCostMin: number;
  estimatedCostMax: number;
  summary: string;
}

export interface HairStyleOption {
  id: string;
  label: string;
  prompt: string;
}

// We keep the IDs and prompts (which go to the AI) constant.
// Labels will be translated in the UI components.
export const HAIR_STYLE_TEMPLATES = [
  { id: 'natural', prompt: 'restore hairline with natural density matching age' },
  { id: 'dense', prompt: 'restore hairline with high density, youthful straight hairline' },
  { id: 'conservative', prompt: 'conservative restoration, slightly mature hairline' },
  { id: 'buzz', prompt: 'full head of hair with a short buzz cut style' },
];
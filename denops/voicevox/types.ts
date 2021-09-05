export type AudioQueryRes = {
  accentPhrases: AccentPhrase[];
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
};
export type AudioQueryRes422 = {
  detail: Detail[];
};
type Detail = {
  loc: string[];
  mes: string;
  type: string;
}
type AccentPhrase = {
    moras: Mora[];
    accent: number;
    pauseMora?: Mora;
};
type Mora = {
    text: string;
    consonant?: string;
    consonantLength?: number;
    vowel: string;
    vowelLength: number;
    pitch: number;
}

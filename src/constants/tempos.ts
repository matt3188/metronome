export const BUILT_IN_TEMPOS = [50, 100] as const

export const isBuiltInTempo = (bpm: number) => BUILT_IN_TEMPOS.some(tempo => tempo === bpm)

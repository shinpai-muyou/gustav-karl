import { BLOOM_CHAIN_PASSES } from "./presets/bloom-chain.js";
import { FEEDBACK_PASSES } from "./presets/feedback.js";
import { SINGLE_PASS_PASSES } from "./presets/single-pass.js";

export const PASS_PRESETS = {
  "bloom-chain": BLOOM_CHAIN_PASSES,
  feedback: FEEDBACK_PASSES,
  "single-pass": SINGLE_PASS_PASSES
};

export const DEFAULT_PASS_PRESET = "bloom-chain";

export function resolvePassConfig(presetName = DEFAULT_PASS_PRESET) {
  return PASS_PRESETS[presetName] ?? PASS_PRESETS[DEFAULT_PASS_PRESET];
}

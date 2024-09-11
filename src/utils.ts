import type { Font } from 'fontkit';

const DEFAULT_SANS_SERIF_FONT = {
  name: 'Arial',
  azAvgWidth: 934.5116279069767,
  unitsPerEm: 2048,
};
const DEFAULT_SERIF_FONT = {
  name: 'Times New Roman',
  azAvgWidth: 854.3953488372093,
  unitsPerEm: 2048,
};

function calcAverageWidth(font: Font): number | undefined {
  try {
    const avgCharacters = 'aaabcdeeeefghiijklmnnoopqrrssttuvwxyz      ';
    const hasAllChars = font
      .glyphsForString(avgCharacters)
      .flatMap(glyph => glyph.codePoints)
      .every(codePoint => font.hasGlyphForCodePoint(codePoint));

    if (!hasAllChars) return undefined;

    const widths = font.glyphsForString(avgCharacters).map(glyph => glyph.advanceWidth);
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    return totalWidth / widths.length;
  } catch {
    return undefined;
  }
}

function formatOverrideValue(val: number) {
  return Math.abs(val * 100).toFixed(2) + '%';
}

export function getFallbackMetricsFromFontFile(font: Font, category = 'serif') {
  const fallbackFont = category === 'serif' ? DEFAULT_SERIF_FONT : DEFAULT_SANS_SERIF_FONT;

  const azAvgWidth = calcAverageWidth(font);
  const { ascent, descent, lineGap, unitsPerEm } = font;

  const fallbackFontAvgWidth = fallbackFont.azAvgWidth / fallbackFont.unitsPerEm;
  let sizeAdjust = azAvgWidth ? azAvgWidth / unitsPerEm / fallbackFontAvgWidth : 1;

  return {
    ascentOverride: formatOverrideValue(ascent / (unitsPerEm * sizeAdjust)),
    descentOverride: formatOverrideValue(descent / (unitsPerEm * sizeAdjust)),
    lineGapOverride: formatOverrideValue(lineGap / (unitsPerEm * sizeAdjust)),
    fallbackFont: fallbackFont.name,
    sizeAdjust: formatOverrideValue(sizeAdjust),
  };
}

const NORMAL_WEIGHT = 400;
const BOLD_WEIGHT = 700;

function getWeightNumber(weight: string) {
  return weight === 'normal' ? NORMAL_WEIGHT : weight === 'bold' ? BOLD_WEIGHT : Number(weight);
}

function getDistanceFromNormalWeight(weight?: string) {
  if (!weight) return 0;

  const [firstWeight, secondWeight] = weight.trim().split(/ +/).map(getWeightNumber);

  if (Number.isNaN(firstWeight) || Number.isNaN(secondWeight)) {
    console.warn(`Invalid weight value in src array: \`${weight}\`.\nExpected \`normal\`, \`bold\` or a number.`);
  }
  if (!secondWeight) {
    return firstWeight - NORMAL_WEIGHT;
  }

  if (firstWeight <= NORMAL_WEIGHT && secondWeight >= NORMAL_WEIGHT) {
    return 0;
  }

  const firstWeightDistance = firstWeight - NORMAL_WEIGHT;
  const secondWeightDistance = secondWeight - NORMAL_WEIGHT;
  if (Math.abs(firstWeightDistance) < Math.abs(secondWeightDistance)) {
    return firstWeightDistance;
  }
  return secondWeightDistance;
}

export function pickFontFileForFallbackGeneration<T extends { style?: string; weight?: string }>(fontFiles: T[]): T {
  return fontFiles.reduce((usedFontFile, currentFontFile) => {
    if (!usedFontFile) return currentFontFile;

    const usedFontDistance = getDistanceFromNormalWeight(usedFontFile.weight);
    const currentFontDistance = getDistanceFromNormalWeight(currentFontFile.weight);

    if (usedFontDistance === currentFontDistance && (typeof currentFontFile.style === 'undefined' || currentFontFile.style === 'normal')) {
      return currentFontFile;
    }

    const absUsedDistance = Math.abs(usedFontDistance);
    const absCurrentDistance = Math.abs(currentFontDistance);

    if (absCurrentDistance < absUsedDistance) return currentFontFile;

    if (absUsedDistance === absCurrentDistance && currentFontDistance < usedFontDistance) {
      return currentFontFile;
    }

    return usedFontFile;
  });
}

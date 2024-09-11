import { Font, Glyph } from 'fontkit';

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
      .flatMap((glyph: Glyph) => glyph.codePoints)
      .every((codePoint: number) => font.hasGlyphForCodePoint(codePoint));

    if (!hasAllChars) return undefined;

    const widths = font.glyphsForString(avgCharacters).map((glyph: Glyph) => glyph.advanceWidth);
    const totalWidth = widths.reduce((sum: number, width: number) => sum + width, 0);
    return totalWidth / widths.length;
  } catch {
    return undefined;
  }
}

function formatOverrideValue(val: number): string {
  return Math.abs(val * 100).toFixed(2) + '%';
}
export function getFallbackMetricsFromFontFile(
  font: Font,
  category: 'serif' | 'sans-serif' = 'serif'
): {
  ascentOverride: string;
  descentOverride: string;
  lineGapOverride: string;
  fallbackFont: string;
  sizeAdjust: string;
} {
  const fallbackFont = category === 'serif' ? DEFAULT_SERIF_FONT : DEFAULT_SANS_SERIF_FONT;

  const azAvgWidth = calcAverageWidth(font);

  if (azAvgWidth === undefined) {
    return {
      ascentOverride: '0',
      descentOverride: '0',
      lineGapOverride: '0',
      fallbackFont: fallbackFont.name,
      sizeAdjust: '0',
    };
  }

  const { ascent, descent, lineGap, unitsPerEm } = font;

  const fallbackFontMetrics = {
    azAvgWidth: 600,
    unitsPerEm: 1000,
  };

  const fallbackFontAvgWidth = fallbackFontMetrics.azAvgWidth / fallbackFontMetrics.unitsPerEm;
  const sizeAdjust = azAvgWidth / unitsPerEm / fallbackFontAvgWidth;

  return {
    ascentOverride: formatOverrideValue(ascent / (unitsPerEm * sizeAdjust)),
    descentOverride: formatOverrideValue(descent / (unitsPerEm * sizeAdjust)),
    lineGapOverride: formatOverrideValue(lineGap / (unitsPerEm * sizeAdjust)),
    fallbackFont: fallbackFont.name,
    sizeAdjust: formatOverrideValue(sizeAdjust),
  };
}

export function pickFontFileForFallbackGeneration<T extends { style?: string; weight?: string }>(fontFiles: T[]): T | undefined {
  if (fontFiles.length === 0) {
    return;
  }

  const NORMAL_WEIGHT = 400;
  const BOLD_WEIGHT = 700;

  function getWeightNumber(weight: string | undefined): number {
    return weight === 'normal' ? NORMAL_WEIGHT : weight === 'bold' ? BOLD_WEIGHT : Number(weight);
  }

  function getDistanceFromNormalWeight(weight: string | undefined): number {
    if (!weight) return 0;

    const [firstWeight, secondWeight] = weight.trim().split(/ +/).map(getWeightNumber);

    if (isNaN(firstWeight) || isNaN(secondWeight)) {
      console.error(`Invalid weight value: ${weight}`);
    }

    if (!secondWeight) {
      return firstWeight - NORMAL_WEIGHT;
    }

    if (firstWeight <= NORMAL_WEIGHT && secondWeight >= NORMAL_WEIGHT) {
      return 0;
    }

    const firstWeightDistance = firstWeight - NORMAL_WEIGHT;
    const secondWeightDistance = secondWeight - NORMAL_WEIGHT;

    return Math.abs(firstWeightDistance) < Math.abs(secondWeightDistance) ? firstWeightDistance : secondWeightDistance;
  }

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

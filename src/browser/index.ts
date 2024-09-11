import { Font } from 'fontkit';
import type { CssVariable, LocalFontOptions, FontOutput } from '../types';
import { getFallbackMetricsFromFontFile, pickFontFileForFallbackGeneration } from '../utils';

let fontFromBuffer: (arg0: ArrayBuffer) => any;
try {
  const mod = require('./fontkit').default;
  fontFromBuffer = mod.default || mod;
} catch {
  /* ignore */
}

function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).slice(0, 16);
}

function detectFontFormat(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  if (uint8Array[0] === 0x77 && uint8Array[1] === 0x4f && uint8Array[2] === 0x46 && uint8Array[3] === 0x32) {
    return 'woff2';
  }
  if (uint8Array[0] === 0x77 && uint8Array[1] === 0x4f && uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
    return 'woff';
  }
  if (uint8Array[0] === 0x4f && uint8Array[1] === 0x54 && uint8Array[2] === 0x54 && uint8Array[3] === 0x4f) {
    return 'opentype';
  }
  if (uint8Array[0] === 0x00 && uint8Array[1] === 0x01 && uint8Array[2] === 0x00 && uint8Array[3] === 0x00) {
    return 'truetype';
  }
  return 'unknown';
}

function localFont<T extends CssVariable | undefined = undefined>(options: LocalFontOptions<T>): FontOutput<T> {
  const { src, display = 'swap', weight, style, adjustFontFallback = 'Arial', variable, declarations = [] } = options;

  const fontFiles = Array.isArray(src) ? src : [{ path: src, weight, style }];
  const fontCss: string[] = [];
  const fontMetadata: any[] = [];

  const fontHash = generateHash(fontFiles.map(f => f.path).join('|'));
  const fallbackFontName = `__font_Fallback_${fontHash}`;

  let variableName = `__font_${fontHash}`;
  let className = `__className_${fontHash}`;

  const appendCss = () => {
    if (adjustFontFallback !== false) {
      const fallbackFontFile = pickFontFileForFallbackGeneration(fontMetadata);
      const fallbackMetrics = getFallbackMetricsFromFontFile(fallbackFontFile, adjustFontFallback === 'Times New Roman' ? 'serif' : 'sans-serif');

      const fallbackCss = `@font-face {\n  font-family: '${fallbackFontName}';\n  src: local('${fallbackMetrics.fallbackFont}');\n  ascent-override: ${fallbackMetrics.ascentOverride};\n  descent-override: ${fallbackMetrics.descentOverride};\n  line-gap-override: ${fallbackMetrics.lineGapOverride};\n  size-adjust: ${fallbackMetrics.sizeAdjust};\n}\n`;

      fontCss.push(fallbackCss);

      const classCss = `.${className} {\n  font-family: '${variableName}', '${fallbackFontName}';\n}\n`;
      fontCss.push(classCss);

      if (variable) {
        const variableCss = `.__variable_${fontHash} {\n  ${variable}: '${variableName}', '${fallbackFontName}';\n}\n`;
        fontCss.push(variableCss);
      }
    }

    const styleId = `__font_style_${fontHash}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = fontCss.join('\n');
  };

  fontFiles.forEach(fontFile => {
    const { path: fontPath, weight: fileWeight, style: fileStyle } = fontFile;

    fetch(fontPath)
      .then(response => response.arrayBuffer())
      .then(buffer => {
        const font = fontFromBuffer?.(buffer);
        const format = detectFontFormat(buffer);
        const objectUrl = URL.createObjectURL(new Blob([buffer]));

        const fontFaceProperties = [
          ['font-family', `'${variableName}'`],
          ['src', `url(${objectUrl})${format !== 'unknown' ? ` format('${format}')` : ''}`],
          ['font-display', display],
        ];

        if (fileWeight) {
          fontFaceProperties.push(['font-weight', fileWeight]);
        }

        if (fileStyle) {
          fontFaceProperties.push(['font-style', fileStyle]);
        }

        declarations.forEach(declaration => {
          if (Array.isArray(declaration) && declaration.length === 2) {
            fontFaceProperties.push(declaration);
          } else if (typeof declaration === 'object' && 'prop' in declaration && 'value' in declaration) {
            fontFaceProperties.push([declaration.prop, declaration.value]);
          }
        });

        const css = `@font-face {\n${fontFaceProperties.map(([property, value]) => `  ${property}: ${value};`).join('\n')}\n}\n`;
        fontCss.push(css);

        fontMetadata.push(font);
        appendCss();
      })
      .catch(error => {
        console.error(`Error processing font file ${fontPath}:`, error);
      });
  });

  const output: FontOutput<T> = {
    className,
    style: {
      fontFamily: `${variableName}, ${fallbackFontName}`,
    },
  };

  if (weight) {
    output.style.fontWeight = parseInt(weight, 10);
  }

  if (style) {
    output.style.fontStyle = style;
  }

  if (variable) {
    output.variable = variable;
  }

  return output;
}

export { localFont };

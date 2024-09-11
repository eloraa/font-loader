export type CssVariable = string;

export type Display = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';

export interface FontFile {
  path: string;
  weight?: string;
  style?: string;
}

export interface LocalFontOptions<T extends CssVariable | undefined = undefined> {
  src: string | FontFile[];
  outputDir?: string;
  outputCss?: string;
  fontDir?: string;
  appendTo?: string;
  display?: Display;
  weight?: string;
  style?: string;
  adjustFontFallback?: 'Arial' | 'Times New Roman' | false;
  fallback?: string[];
  preload?: boolean;
  variable?: T;
  declarations?: Array<{
    prop: string;
    value: string;
  }>;
}

export interface FontOutput<T extends CssVariable | undefined = undefined> {
  className: string | undefined;
  style: {
    fontFamily: string;
    fontWeight?: number;
    fontStyle?: string;
  };
  variable?: T;
}

export type FontFaceProperty = [string, string];

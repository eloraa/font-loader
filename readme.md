# @eloraa/font-loader

`@eloraa/font-loader` is a TypeScript package designed to simplify self-hosting fonts and generating CSS for them. Inspired by the `next/font` package, it offers self-hosting for any font file. This enables optimal font loading with zero layout shift, utilizing the CSS `size-adjust` property.

## Installation

You can install the package using either `npm` or `pnpm`:

```bash
npm install @eloraa/font-loader --save-dev
```

or

```bash
pnpm add -D @eloraa/font-loader
```

## CLI (Recommended)

To generate a configuration file, run the following command:

```bash
npx @eloraa/font-loader generate
```

or

```bash
pnpm dlx @eloraa/font-loader generate
```

This will create a default config file (`font.config.js` or `font.config.cjs` based on the environment) in your project.

Once the config is generated, you can add a script to your `package.json` to process fonts:

```json
{
  "scripts": {
    "generate:font": "font-loader process"
  }
}
```

Alternatively, you can install `@eloraa/font-loader` globally using npm or pnpm:

```bash
npm install -g @eloraa/font-loader
```

or

```bash
pnpm add -g @eloraa/font-loader
```

After installation, you can run:

```bash
font-loader process
```

If you prefer not to install it globally, you can continue using `npx` or `pnpm dlx`:

```bash
npx @eloraa/font-loader process
```

or

```bash
pnpm dlx @eloraa/font-loader process
```

### Using the Generated CSS

Once the CSS file is generated, you can include it in your project in one of the following ways:

#### 1. Import in JavaScript/TypeScript:

```ts
import 'path/to/style.css';
```

#### 2. Add a `<link>` tag in your HTML:

```html
<link rel="stylesheet" href="path/to/style.css" />
```

There are other ways to include the generated CSS in your project, but this is the most common.

## Browser API (Not Recommended)

While `@eloraa/font-loader` provides a browser API, it is less efficient and limited compared to the Node.js and CLI versions. If you cannot use Node.js in your project, consider using the CLI tool.

### Using the Browser API:

```javascript
import { localFont } from '@eloraa/font-loader/browser';

const font = localFont({
  src: '/path-to-your-font-file.ttf',
  display: 'swap',
});
```

**Note:** The browser API appends a `<link>` tag with the generated CSS to the `<head>` of the document and cannot write files directly.

## Node.js API

**Note:** For most use cases, the Node.js API is the most flexible and powerful. However, it is intended to run only in a Node.js environment. If you attempt to use it in a browser, it will throw errors. If you need to use font loading functionality in a browser, please use the browser API provided by `@eloraa/font-loader/browser` (not recommended).

### Example Usage:

```typescript
import { localFont } from '@eloraa/font-loader';

const font = localFont({
  src: './path-to-your-font-file.ttf',
  outputCss: 'fonts.css', // optional, generates [hash].css by default
  display: 'swap',
  weight: '400', // optional
  style: 'normal', // optional
});
```

### Node.js API Options

- **src** (`string` or `string[]`): The source of the font file. Can be a single file or an array of font files with specific weights and styles.
- **outputDir** (`string`): Directory to save the font files (default: `'./fonts'`).
- **outputCss** (`string`): The name of the CSS file to generate.
- **appendTo** (`string`): Path to an existing CSS file to append the generated CSS to.
- **display** (`'auto' | 'block' | 'swap' | 'fallback' | 'optional'`): CSS font-display value (default: `'swap'`).
- **weight** (`string`): Font weight (optional, e.g., `'400'`, `'bold'`).
- **style** (`string`): Font style (optional, e.g., `'normal'`, `'italic'`).
- **adjustFontFallback** (`'Arial' | 'Times New Roman' | false`): Adjust fallback font metrics (default: `'Arial'`).
- **fallback** (`string[]`): Array of fallback fonts.
- **preload** (`boolean`): Preload the font (optional).
- **variable** (`string`): CSS variable to use for the font (optional).

### Example with Multiple Fonts

```ts
import { localFont } from '@eloraa/font-loader';

const font = localFont({
  src: [
    { path: './path-to-your-regular-font.ttf', weight: '400' },
    { path: './path-to-your-bold-font.ttf', weight: '700' },
  ],
  outputCss: 'my-fonts.css',
  display: 'swap',
  preload: true,
  variable: '--my-font-variable',
});
```

This will create a CSS file (`my-fonts.css`) with the appropriate `@font-face` declarations for each font file. The font can then be used via the generated CSS class or variable.

## API

### `localFont(options)`

The `localFont` function accepts an object with the following properties:

- **src** (`string` or `string[]`): The source of the font file. Can be a single file or an array of font files with specific weights and styles.
- **outputDir** (string): Directory to save the font files (default: `'./fonts'`).
- **outputCss** (string): The name of the CSS file to generate.
- **appendTo** (string): Path to an existing CSS file to append the generated CSS to.
- **display** (`'auto' | 'block' | 'swap' | 'fallback' | 'optional'`): CSS font-display value (default: `'swap'`).
- **weight** (string): Font weight (optional, e.g., `'400'`, `'bold'`).
- **style** (string): Font style (optional, e.g., `'normal'`, `'italic'`).
- **adjustFontFallback** (`'Arial' | 'Times New Roman' | false`): Adjust fallback font metrics (default: `'Arial'`).
- **fallback** (string[]): Array of fallback fonts.
- **preload** (boolean): Preload the font (optional).
- **variable** (string): CSS variable to use for the font (optional).

## Contribution

Contributions will be appreciated! To get started:

1. **Fork the repository on [GitHub](https://github.com/eloraa/font-loader)**.
2. Clone your fork locally.
3. Create a new branch for your feature or bug fix.
4. Make your changes and commit them.
5. Submit a pull request.

## License

This project is licensed under the **MIT** License.

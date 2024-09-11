#!/usr/bin/env node

import { localFont } from '..';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const packageJsonPath = path.resolve(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

// ANSI escape codes for colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const GREY = `\x1b[38;5;245m`;
const BLACK = `\x1b[38;5;0m`;
const BRIGHT_BLUE = '\x1b[34;1m';
const BRIGHT_WHITE = '\x1b[37;1m';
const MOVE_UP = (n = 1) => `\x1b[${n}A`;
const MOVE_RIGHT = (n = 1) => `\x1b[${n}C`;
const MOVE_LEFT = (n = 1) => `\x1b[${n}D`;

const description = `
███████      ${BOLD}${BRIGHT_BLUE}███████${RESET}${BOLD}
█████████    ${BOLD}${BRIGHT_BLUE}███████${RESET}${BOLD}
███████████  ${BOLD}${BRIGHT_BLUE}███████${RESET}${BOLD}
  ███████████       
    ███████████     
       ██████████   
${BOLD}${BRIGHT_BLUE}███████${RESET}${BOLD}  ██████████ 
${BOLD}${BRIGHT_BLUE}███████${RESET}${BOLD}    █████████
${BOLD}${BRIGHT_BLUE}███████${RESET}${BOLD}      ███████
${RESET}
${MOVE_UP(8)}${MOVE_LEFT(1)}${MOVE_RIGHT(25)}${BOLD}${BLUE}CLI to process local fonts${RESET}
${MOVE_RIGHT(25)}${GREY}By ${BLUE}${BOLD}Elora${RESET}
${MOVE_RIGHT(25)}${BLACK}----------------------${RESET}
${MOVE_RIGHT(25)}Github: ${BLUE}${BOLD} https://github.com/eloraa${RESET}
${MOVE_RIGHT(25)}Website: ${BLUE}${BOLD} https://git.aruu.me${RESET}
${MOVE_RIGHT(25)}Package: ${BLUE}${BOLD} https://npmjs.com/package/@eloraa/font-loader${RESET}\n
`;

async function isESMSupported(): Promise<boolean> {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

    if (packageJson.type === 'module') {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

function printHelp() {
  console.log(description);
  console.log('Usage: font-loader [command] [options]');
  console.log('\nCommands:');
  console.log('  process     Process fonts based on config file');
  console.log('  generate    Generate a fonts config file');
  console.log('\nOptions:');
  console.log('  -c, --config <path>    Path to config file (default: ./font.config.js)');
  console.log('  -v, --version          Output the version number');
  console.log('  -h, --help             Display this help message');
}

function printVersion() {
  console.log(`${BOLD}${BLUE}@eloraa/font-loader${RESET} ${BLUE}${version}${RESET}`);
}

async function processCommand(configPath: string): Promise<void> {
  const isESM = await isESMSupported();

  try {
    if (configPath.endsWith('.ts')) {
      const tempDir = path.join('node_modules', '.elora', 'fonts-loader', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const ext = isESM ? '.cjs' : '.js';
      const filename = `${path.basename(configPath, '.ts')}${ext}`;
      const builtConfigPath = path.join(tempDir, filename);
      try {
        console.log(`✨ ${BLUE}Building config...${RESET}`);
        execSync(`npx tsc ${configPath} --target es2019 --module commonjs --outDir ${tempDir}`, { stdio: 'ignore' });
        fs.renameSync(`${tempDir}/${path.basename(configPath, '.ts')}.js`, `${tempDir}/${path.basename(configPath, '.ts')}.cjs`);
      } catch (error) {
        console.error(error);
        console.error(`${RED}Error:${RESET} Please check your config (${BLUE}${configPath}${RESET}) file`);
      }

      configPath = builtConfigPath;

      console.log(`✨ ${BLUE}Done!${RESET}`);
    }

    const configFullPath = path.resolve(process.cwd(), configPath);
    let config: any;
    try {
      config = require(configFullPath);
    } catch (error) {
      config = await import(configFullPath);
    }

    if (typeof config !== 'object' || config === null || !config) {
      throw new Error('Invalid configuration: expected an object');
    }

    config = config.default || config;

    console.log(description);
    const result = localFont(config);

    if (result) {
      console.log(BRIGHT_WHITE + '✨ Done!' + RESET);
    } else {
      console.log(BRIGHT_WHITE + '✨ Nothing to do!' + RESET);
    }
  } catch (error) {
    console.error(error);
    console.error(`${RED}Error:${RESET} Please check your config (${BLUE}${configPath}${RESET}) file`);

    console.error(
      `${BRIGHT_WHITE}If the problem persists, try generating a valid configuration file using ${BLUE}font-loader generate${RESET} or ${BOLD}${BLUE}npx @eloraa/font-loader generate${RESET}.`
    );
  }
}

async function generateCommand() {
  const isESM = await isESMSupported();

  const configContent = `
/** @type {import('@eloraa/font-loader').LocalFontOptions} */
const config = {
	src: [
		{ path: './path-to-your-regular-font.ttf', weight: '400' },
		{ path: './path-to-your-bold-font.ttf', weight: '700' }
	],
	outputCss: 'my-fonts.css',
	display: 'swap',
	preload: true,
	variable: '--my-font-variable'
};

module.exports = config;
`;

  const fileName = `font.config.${isESM ? 'cjs' : 'js'}`;
  await fs.promises.writeFile(fileName, configContent);
  console.log(`✨ Generated ${BOLD}${BLUE}${fileName}${RESET} in the current directory.`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const isESM = await isESMSupported();
  let configPath = `./font.config.${isESM ? 'cjs' : 'js'}`;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-c' || args[i] === '--config') {
      configPath = args[i + 1];
      break;
    }
  }

  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
  } else if (args.includes('-v') || args.includes('--version')) {
    printVersion();
  } else {
    switch (command) {
      case 'process':
        await processCommand(configPath);
        break;
      case 'generate':
        await generateCommand();
        break;
      default:
        printHelp();
        if (command) console.log(`\nUnknown command: ${BOLD}${RED}${command}${RESET}`);
    }
  }
}

main().catch(console.error);

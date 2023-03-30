import babel from '@rollup/plugin-babel';
import external from 'rollup-plugin-peer-deps-external';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import pkg from './package.json';

import process from 'process';
process.env.NODE_ENV = 'production';

const externalPackages = [
	'axios',
	'base64-js',
	'cos-js-sdk-v5',
	'eventemitter3',
	'nanoid',
	'webpubsub-js',
	/@babel\/runtime/,
];

const extensions = ['.mjs', '.json', '.node', '.js', '.ts'];

const babelConfig = {
	babelHelpers: 'runtime',
	exclude: 'node_modules/**',
	extensions,
};

const baseConfig = {
	cache: false,
	watch: {
		chokidar: false,
	},
};

const normalBundle = {
	...baseConfig,
	input: 'src/index.ts',
	output: [
		{
			file: pkg.main,
			format: 'cjs',
			sourcemap: true,
		},
		{
			file: pkg.module,
			format: 'es',
			sourcemap: true,
		},
	],
	external: externalPackages,
	plugins: [
		json(),
		replace({ preventAssignment: true, 'process.env.PKG_VERSION': JSON.stringify(pkg.version) }),
		external(),
		nodeResolve({ extensions, browser: true }),
		babel(babelConfig),
		commonjs(),
	],
};

const browserBundle = {
	...baseConfig,
	input: 'src/index.ts',
	output: [
		{
			file: pkg.browser[pkg.main],
			format: 'cjs',
			sourcemap: true,
		},
		{
			file: pkg.browser[pkg.module],
			format: 'es',
			sourcemap: true,
		},
	],
	external: externalPackages,
	plugins: [
		json(),
		replace({ preventAssignment: true, 'process.env.PKG_VERSION': JSON.stringify(pkg.version) }),
		external(),
		nodeResolve({ extensions, browser: true }),
		babel(babelConfig),
		commonjs(),
	],
};
const fullBrowserBundle = {
	...baseConfig,
	input: 'src/index.ts',
	output: [
		{
			file: pkg.jsdelivr,
			format: 'iife',
			name: 'window', // write all exported values to window
			extend: true, // extend window, not overwrite it
			sourcemap: true,
		},
	],
	plugins: [
		json(),
		replace({ preventAssignment: true, 'process.env.PKG_VERSION': JSON.stringify(pkg.version) }),
		external(),
		nodeResolve({ extensions, browser: true }),
		babel(babelConfig),
		commonjs(),
		terser(),
	],
};

export default () =>
	process.env.ROLLUP_WATCH ? [normalBundle, browserBundle] : [normalBundle, browserBundle, fullBrowserBundle];

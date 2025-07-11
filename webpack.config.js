import path from 'path';
import fs from 'fs-extra';
import cp from 'child_process';
import webpack from 'webpack';
import CleanCSS from 'clean-css';
import UglifyJS from 'uglify-js';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import * as packUtils from './scripts/webpack.js';

const commitId = cp.execSync('git rev-parse HEAD').toString().trim();
const staticDir = `static-${commitId.padStart(7, '0').slice(0, 7)}`;
const vscodeWebPath = path.join(import.meta.dirname, 'node_modules/@github1s/vscode-web');

const skipMinified = { info: { minimized: true } };
const skipNodeModules = { globOptions: { dot: true, ignore: ['**/node_modules/**'] } };
const fileLoaderOptions = { outputPath: staticDir, name: '[name].[ext]' };

const copyPluginPatterns = [
	{ from: 'extensions', to: `${staticDir}/extensions`, ...skipNodeModules, ...skipMinified },
	{ from: path.join(vscodeWebPath, 'vscode'), to: `${staticDir}/vscode`, ...skipMinified },
	{ from: path.join(vscodeWebPath, 'extensions'), to: `${staticDir}/extensions`, ...skipMinified },
	{ from: path.join(vscodeWebPath, 'dependencies'), to: `${staticDir}/dependencies`, ...skipMinified },
	{ from: path.join(vscodeWebPath, 'nls'), to: `${staticDir}/nls`, ...skipMinified },
];

const devVscodeStatic = [
	...fs.readdirSync(path.join(import.meta.dirname, 'extensions')).map((item) => ({
		publicPath: `/${staticDir}/extensions/${item}`,
		directory: path.join(import.meta.dirname, `extensions/${item}`),
	})),
	{
		publicPath: `/${staticDir}/vscode/`,
		directory: path.join(import.meta.dirname, 'vscode-web/lib/vscode/out'),
	},
	{
		publicPath: `/${staticDir}/extensions/`,
		directory: path.join(import.meta.dirname, 'vscode-web/lib/vscode/extensions'),
	},
	{
		publicPath: `/${staticDir}/dependencies/`,
		directory: path.join(import.meta.dirname, 'vscode-web/lib/vscode/node_modules'),
	},
];

export default (env, argv) => {
	const devMode = argv.mode === 'development';
	const devVscode = !!process.env.DEV_VSCODE;
	const minifyCSS = (code) => (devMode ? code : new CleanCSS().minify(code).styles);
	const minifyJS = (code) => (devMode ? code : UglifyJS.minify(code).code);
	const availableLanguages = devVscode ? [] : fs.readdirSync(path.join(vscodeWebPath, 'nls'));

	// GitHub Pages를 위한 publicPath 설정. PUBLIC_URL 환경 변수를 사용하여 설정할 수 있습니다.
	// 예: PUBLIC_URL=/sub/dir/ npm yarn build
	const publicPath = process.env.PUBLIC_URL || '/';

	return {
		mode: env.mode || 'production',
		entry: path.resolve(import.meta.dirname, 'src/index.ts'),
		output: {
			clean: true,
			publicPath,
			filename: `${staticDir}/bootstrap.js`,
		},
		resolve: { extensions: ['.js', '.ts'] },
		module: {
			rules: [
				{ test: /\.tsx?$/, use: 'ts-loader' },
				{ test: /\.css?$/, use: ['style-loader', 'css-loader'] },
				{ test: /\.svg$/, use: [{ loader: 'file-loader', options: fileLoaderOptions }] },
			],
		},
		plugins: [
			new CopyPlugin({
				patterns: [
					{ from: 'public/favicon*', to: '[name][ext]' },
					{ from: 'public/manifest.json', to: '[name][ext]' },
					{ from: 'public/robots.txt', to: '[name][ext]' },
					...(devVscode ? [] : copyPluginPatterns),
				].filter(Boolean),
			}),
			new HtmlWebpackPlugin({
				minify: !devMode,
				scriptLoading: 'module',
				template: 'public/index.html',
				templateParameters: {
					spinnerStyle: minifyCSS(fs.readFileSync('./public/spinner.css').toString()),
					pageTitleScript: minifyJS(fs.readFileSync('./public/page-title.js').toString()),
					globalScript: minifyJS(packUtils.createGlobalScript(staticDir, devVscode)),
				},
			}),
			new webpack.DefinePlugin({
				DEV_VSCODE: JSON.stringify(devVscode),
				GITHUB_ORIGIN: JSON.stringify(process.env.GITHUB_DOMAIN || 'https://github.com'),
				GITLAB_ORIGIN: JSON.stringify(process.env.GITLAB_DOMAIN || 'https://gitlab.com'),
				GITHUB1S_EXTENSIONS: JSON.stringify(packUtils.getBuiltinExtensions(devVscode)),
				AVAILABLE_LANGUAGES: JSON.stringify(availableLanguages),
				BASE_PATH: JSON.stringify(publicPath),
				// GitHub Pages에서 Service Worker 비활성화
				DISABLE_SERVICE_WORKER: JSON.stringify(process.env.NODE_ENV === 'production'),
			}),
		],
		performance: false,
		devServer: {
			port: 8080,
			liveReload: false,
			allowedHosts: 'all',
			client: { overlay: false },
			devMiddleware: { writeToDisk: true },
			static: devVscode ? devVscodeStatic : [],
			historyApiFallback: { disableDotRule: true },
		},
	};
};

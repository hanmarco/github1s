#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { PROJECT_ROOT } from './utils.js';

const verifyBuild = () => {
	const distPath = path.join(PROJECT_ROOT, 'dist');

	if (!fs.existsSync(distPath)) {
		console.error('❌ dist 폴더가 존재하지 않습니다.');
		process.exit(1);
	}

	// 필수 파일들 확인
	const requiredFiles = [
		'index.html',
		'404.html',
		'manifest.json',
		'favicon-light.svg',
		'favicon-dark.svg',
		'robots.txt',
	];

	for (const file of requiredFiles) {
		const filePath = path.join(distPath, file);
		if (!fs.existsSync(filePath)) {
			console.error(`❌ 필수 파일이 누락되었습니다: ${file}`);
			process.exit(1);
		}
	}

	// static 폴더 확인
	const staticFolders = fs
		.readdirSync(distPath)
		.filter((item) => item.startsWith('static-') && fs.statSync(path.join(distPath, item)).isDirectory());

	if (staticFolders.length === 0) {
		console.error('❌ static 폴더가 생성되지 않았습니다.');
		process.exit(1);
	}

	const staticDir = staticFolders[0];
	console.log(`✅ static 폴더 확인: ${staticDir}`);

	// VSCode 관련 파일들 확인
	const vscodePath = path.join(distPath, staticDir, 'vscode');
	if (!fs.existsSync(vscodePath)) {
		console.error('❌ vscode 폴더가 생성되지 않았습니다.');
		process.exit(1);
	}

	const vscodeFiles = [
		'vs/workbench/workbench.web.main.css',
		'vs/workbench/workbench.web.main.internal.js',
		'nls.messages.js',
	];

	for (const file of vscodeFiles) {
		const filePath = path.join(vscodePath, file);
		if (!fs.existsSync(filePath)) {
			console.error(`❌ VSCode 파일이 누락되었습니다: ${file}`);
			process.exit(1);
		}
	}

	console.log('✅ 모든 필수 파일이 올바르게 생성되었습니다.');
	console.log(`📁 빌드 경로: ${distPath}`);
	console.log(`🔗 GitHub Pages URL: https://hanmarco.github.io/github1s/`);
};

verifyBuild();

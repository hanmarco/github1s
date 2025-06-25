#!/usr/bin/env node

import path from 'path';
import fs from 'fs-extra';
import cp from 'child_process';
import { executeCommand, PROJECT_ROOT } from './utils.js';

const main = () => {
	for (const extension of fs.readdirSync('extensions')) {
		const extensionPath = path.join(PROJECT_ROOT, 'extensions', extension);
		if (fs.existsSync(path.join(extensionPath, 'package.json'))) {
			executeCommand('npm', ['run', 'compile'], extensionPath);
		}
	}

	// 환경 변수를 webpack에 전달
	const env = { ...process.env };
	if (process.env.NODE_ENV === 'production') {
		env.NODE_ENV = 'production';
	}

	executeCommand('npx', ['webpack', '--mode=production'], PROJECT_ROOT, env);
};

main();

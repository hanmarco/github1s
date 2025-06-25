import path from 'path';
import cp from 'child_process';

export const PROJECT_ROOT = path.join(import.meta.dirname, '..');

export const executeCommand = (command, args, cwd, env = process.env) => {
	// Windows에서는 npm.cmd, npx.cmd 사용
	if (process.platform === 'win32') {
		if (command === 'npm') command = 'npm.cmd';
		if (command === 'npx') command = 'npx.cmd';
	}
	const result = cp.spawnSync(command, args, { stdio: 'inherit', cwd, env: { ...process.env, ...env } });
	if (result.error) {
		throw result.error;
	}
};

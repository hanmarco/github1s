/**
 * @file router parser
 * @author netcon
 */

import { joinPath } from '@/helpers/util';
import { getBrowserUrl } from '@/helpers/context';
import * as adapterTypes from '../types';
import { parseGitHubPath } from './parse-path';

// GitHub Pages base path를 추가하는 함수
const addBasePath = async (path: string): Promise<string> => {
	try {
		const browserUrl = (await getBrowserUrl()) as string;
		if (browserUrl.includes('/github1s/')) {
			return `/github1s${path}`;
		}
	} catch (error) {
		// 에러 발생 시 기본 경로 반환
	}
	return path;
};

export class GitHub1sRouterParser extends adapterTypes.RouterParser {
	protected static instance: GitHub1sRouterParser | null = null;

	public static getInstance(): GitHub1sRouterParser {
		if (GitHub1sRouterParser.instance) {
			return GitHub1sRouterParser.instance;
		}
		return (GitHub1sRouterParser.instance = new GitHub1sRouterParser());
	}

	parsePath(path: string): Promise<adapterTypes.RouterState> {
		return parseGitHubPath(path);
	}

	async buildTreePath(repo: string, ref?: string, filePath?: string): Promise<string> {
		const path = ref ? (filePath ? `/${repo}/tree/${ref}/${filePath}` : `/${repo}/tree/${ref}`) : `/${repo}`;
		return addBasePath(path);
	}

	async buildBlobPath(
		repo: string,
		ref: string,
		filePath: string,
		startLine?: number,
		endLine?: number,
	): Promise<string> {
		const hash = startLine ? (endLine ? `#L${startLine}-L${endLine}` : `#L${startLine}`) : '';
		const path = `/${repo}/blob/${ref}/${filePath}${hash}`;
		return addBasePath(path);
	}

	async buildCommitListPath(repo: string): Promise<string> {
		const path = `/${repo}/commits`;
		return addBasePath(path);
	}

	async buildCommitPath(repo: string, commitSha: string): Promise<string> {
		const path = `/${repo}/commit/${commitSha}`;
		return addBasePath(path);
	}

	async buildCodeReviewListPath(repo: string): Promise<string> {
		const path = `/${repo}/pulls`;
		return addBasePath(path);
	}

	async buildCodeReviewPath(repo: string, codeReviewId: string): Promise<string> {
		const path = `/${repo}/pull/${codeReviewId}`;
		return addBasePath(path);
	}

	buildExternalLink(path: string): string {
		return joinPath(GITHUB_ORIGIN, path);
	}
}

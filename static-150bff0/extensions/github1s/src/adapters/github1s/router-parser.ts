/**
 * @file router parser
 * @author netcon
 */

import { joinPath } from '@/helpers/util';
import * as adapterTypes from '../types';
import { parseGitHubPath } from './parse-path';

const addBasePath = (path: string): string => {
	return joinPath(BASE_PATH, path);
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

	buildTreePath(repo: string, ref?: string, filePath?: string): string {
		const path = ref ? (filePath ? `/${repo}/tree/${ref}/${filePath}` : `/${repo}/tree/${ref}`) : `/${repo}`;
		return addBasePath(path);
	}

	buildBlobPath(repo: string, ref: string, filePath: string, startLine?: number, endLine?: number): string {
		const hash = startLine ? (endLine ? `#L${startLine}-L${endLine}` : `#L${startLine}`) : '';
		const path = `/${repo}/blob/${ref}/${filePath}${hash}`;
		return addBasePath(path);
	}

	buildCommitListPath(repo: string): string {
		const path = `/${repo}/commits`;
		return addBasePath(path);
	}

	buildCommitPath(repo: string, commitSha: string): string {
		const path = `/${repo}/commit/${commitSha}`;
		return addBasePath(path);
	}

	buildCodeReviewListPath(repo: string): string {
		const path = `/${repo}/pulls`;
		return addBasePath(path);
	}

	buildCodeReviewPath(repo: string, codeReviewId: string): string {
		const path = `/${repo}/pull/${codeReviewId}`;
		return addBasePath(path);
	}

	buildExternalLink(path: string): string {
		return joinPath(GITHUB_ORIGIN, path);
	}
}

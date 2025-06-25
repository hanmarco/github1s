/**
 * @file router parser
 * @author netcon
 */

import { parsePath } from 'history';
import * as queryString from 'query-string';
import * as adapterTypes from '../types';
import { GitHub1sRouterParser } from '../github1s/router-parser';

export class OSSInsightRouterParser extends GitHub1sRouterParser {
	protected static instance: OSSInsightRouterParser | null = null;

	public static getInstance(): OSSInsightRouterParser {
		if (OSSInsightRouterParser.instance) {
			return OSSInsightRouterParser.instance;
		}
		return (OSSInsightRouterParser.instance = new OSSInsightRouterParser());
	}

	async parsePath(path: string): Promise<adapterTypes.RouterState> {
		const { path: pathsOrNull } = queryString.parse((parsePath(path).search || '').slice(1));
		const filePath = (Array.isArray(pathsOrNull) ? pathsOrNull[0] : pathsOrNull) || '';
		const pageType = filePath.endsWith('.md') ? adapterTypes.PageType.Blob : adapterTypes.PageType.Tree;
		return { pageType, repo: '', ref: '', filePath };
	}

	async buildTreePath(repo: string, ref?: string, filePath?: string) {
		return repo ? super.buildTreePath(repo, ref, filePath) : '/';
	}

	async buildBlobPath(repo: string, ref: string, filePath: string, startLine?: number, endLine?: number) {
		return repo ? super.buildBlobPath(repo, ref, filePath, startLine, endLine) : '/';
	}

	async buildCommitListPath(repo: string) {
		return repo ? super.buildCommitListPath(repo) : '/';
	}

	async buildCommitPath(repo: string, commitSha: string) {
		return repo ? super.buildCommitPath(repo, commitSha) : '/';
	}

	async buildCodeReviewListPath(repo: string) {
		return repo ? super.buildCodeReviewListPath(repo) : '/';
	}

	async buildCodeReviewPath(repo: string, codeReviewId: string) {
		return repo ? super.buildCodeReviewPath(repo, codeReviewId) : '/';
	}
}

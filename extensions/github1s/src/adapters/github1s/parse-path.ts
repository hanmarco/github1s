/**
 * @file parse github path
 * @author netcon
 */

import * as vscode from 'vscode';
import { parsePath } from 'history';
import { PageType, RouterState } from '@/adapters/types';
import { GitHub1sDataSource } from './data-source';
import * as queryString from 'query-string';
import { memorize } from '@/helpers/func';
import { getBrowserUrl } from '@/helpers/context';

export const DEFAULT_REPO = 'conwnet/github1s';

// GitHub Pages base path를 제거하는 함수
const removeBasePath = (pathname: string): string => {
	// GitHub Pages에서 /github1s/ base path 제거
	if (pathname.startsWith('/github1s/')) {
		return pathname.substring('/github1s'.length);
	}
	return pathname;
};

export const getCurrentRepo = memorize(() => {
	return getBrowserUrl().then((browserUrl: string) => {
		const pathParts = vscode.Uri.parse(browserUrl).path.split('/').filter(Boolean);
		// GitHub Pages base path 제거
		const cleanPathParts = removeBasePath(vscode.Uri.parse(browserUrl).path).split('/').filter(Boolean);
		return cleanPathParts.length >= 2 ? (cleanPathParts.slice(0, 2) as [string, string]).join('/') : DEFAULT_REPO;
	});
});

export const getDefaultBranch = async (repo: string): Promise<string> => {
	const dataSource = GitHub1sDataSource.getInstance();
	return dataSource.getDefaultBranch(repo);
};

const parseTreeUrl = async (path: string): Promise<RouterState> => {
	const pathname = removeBasePath(parsePath(path).pathname!);
	const pathParts = pathname.split('/').filter(Boolean);
	const [owner, repo, _pageType, ...restParts] = pathParts;
	const repoFullName = `${owner}/${repo}`;
	const dataSource = GitHub1sDataSource.getInstance();
	const { ref, path: filePath } = await dataSource.extractRefPath(repoFullName, restParts.join('/'));

	return { pageType: PageType.Tree, repo: repoFullName, ref, filePath };
};

const parseBlobUrl = async (path: string): Promise<RouterState> => {
	const routerState = (await parseTreeUrl(path)) as any;
	const { hash: routerHash } = parsePath(path);

	if (!routerHash) {
		return { ...routerState, pageType: PageType.Blob };
	}

	// get selected line number range from path which looks like:
	// `/conwnet/github1s/blob/master/package.json#L10-L20`
	const matches = routerHash.match(/^#L(\d+)(?:-L(\d+))?/);
	const [_, startLineNumber = '0', endLineNumber] = matches ? matches : [];

	return {
		...routerState,
		pageType: PageType.Blob,
		startLine: parseInt(startLineNumber, 10),
		endLine: parseInt(endLineNumber || startLineNumber, 10),
	};
};

const parseCommitsUrl = async (path: string): Promise<RouterState> => {
	const pathname = removeBasePath(parsePath(path).pathname!);
	const pathParts = pathname.split('/').filter(Boolean);
	const [owner, repo, _pageType, ...refParts] = pathParts;

	return {
		repo: `${owner}/${repo}`,
		pageType: PageType.CommitList,
		ref: refParts.length ? refParts.join('/') : await getDefaultBranch(`${owner}/${repo}`),
	};
};

const parseCommitUrl = async (path: string): Promise<RouterState> => {
	const pathname = removeBasePath(parsePath(path).pathname!);
	const pathParts = pathname.split('/').filter(Boolean);
	const [owner, repo, _pageType, ...refParts] = pathParts;
	const commitSha = refParts.join('/');

	return { repo: `${owner}/${repo}`, pageType: PageType.Commit, ref: commitSha, commitSha };
};

const parsePullsUrl = async (path: string): Promise<RouterState> => {
	const pathname = removeBasePath(parsePath(path).pathname!);
	const pathParts = pathname.split('/').filter(Boolean);
	const [owner, repo] = pathParts;

	return {
		repo: `${owner}/${repo}`,
		ref: await getDefaultBranch(`${owner}/${repo}`),
		pageType: PageType.CodeReviewList,
	};
};

const parsePullUrl = async (path: string): Promise<RouterState> => {
	const pathname = removeBasePath(parsePath(path).pathname!);
	const pathParts = pathname.split('/').filter(Boolean);
	const [owner, repo, _pageType, codeReviewId] = pathParts;
	const repoFullName = `${owner}/${repo}`;
	const codeReview = await GitHub1sDataSource.getInstance().provideCodeReview(repoFullName, codeReviewId);

	return {
		repo: `${owner}/${repo}`,
		pageType: PageType.CodeReview,
		ref: codeReview.targetSha,
		codeReviewId,
	};
};

const parseSearchUrl = async (path: string): Promise<RouterState> => {
	const { pathname, search } = parsePath(path);
	const cleanPathname = removeBasePath(pathname!);
	const pathParts = cleanPathname.split('/').filter(Boolean);
	const [owner, repo, _pageType] = pathParts;
	const queryOptions = queryString.parse(search || '');
	const query = typeof queryOptions.q === 'string' ? queryOptions.q : '';
	const isRegex = queryOptions.regex === 'yes';
	const isCaseSensitive = queryOptions.case === 'yes';
	const matchWholeWord = queryOptions.whole === 'yes';
	const filesToInclude = typeof queryOptions['files-to-include'] === 'string' ? queryOptions['files-to-include'] : '';
	const filesToExclude = typeof queryOptions['files-to-exclude'] === 'string' ? queryOptions['files-to-exclude'] : '';

	return {
		repo: `${owner}/${repo}`,
		pageType: PageType.Search,
		ref: await getDefaultBranch(`${owner}/${repo}`),
		query,
		isRegex,
		isCaseSensitive,
		matchWholeWord,
		filesToInclude,
		filesToExclude,
	};
};

const PAGE_TYPE_MAP = {
	tree: PageType.Tree,
	blob: PageType.Blob,
	pulls: PageType.CodeReviewList,
	pull: PageType.CodeReview,
	commit: PageType.Commit,
	commits: PageType.CommitList,
	search: PageType.Search,
};

export const parseGitHubPath = async (path: string): Promise<RouterState> => {
	const pathname = removeBasePath(parsePath(path).pathname!);
	const pathParts = pathname.split('/').filter(Boolean);

	// GitHub Pages에서 저장소 경로 처리
	// /hanmarco/wd 형태의 경로는 저장소 경로로 처리
	if (pathParts.length === 2) {
		const [owner, repo] = pathParts;
		const repoFullName = `${owner}/${repo}`;
		const dataSource = GitHub1sDataSource.getInstance();
		const { ref, path: filePath } = await dataSource.extractRefPath(repoFullName, '');

		return {
			pageType: PageType.Tree,
			repo: repoFullName,
			ref,
			filePath: '',
		};
	}

	// detect concrete PageType the *third part* in url.path
	const pageType = pathParts[2] ? PAGE_TYPE_MAP[pathParts[2]] || PageType.Unknown : PageType.Tree;

	if (pathParts.length >= 2) {
		switch (pageType) {
			case PageType.Tree:
			case PageType.Unknown:
				return parseTreeUrl(path);
			case PageType.Blob:
				return parseBlobUrl(path);
			case PageType.CodeReview:
				return parsePullUrl(path);
			case PageType.CodeReviewList:
				return parsePullsUrl(path);
			case PageType.Commit:
				return parseCommitUrl(path);
			case PageType.CommitList:
				return parseCommitsUrl(path);
			case PageType.Search:
				return parseSearchUrl(path);
		}
	}

	// fallback to default
	return {
		repo: DEFAULT_REPO,
		ref: await getDefaultBranch(DEFAULT_REPO),
		pageType: PageType.Tree,
		filePath: '',
	};
};

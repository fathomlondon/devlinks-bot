const octokit = require('@octokit/rest');
const {
	base64Decode,
	base64Encode,
	formatMarkdownLink,
	isUrlInText,
} = require('./utils');
const { UrlAlreadySubmittedError } = require('./errors');

const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'fathomlondon';
const REPO = 'dev';
const BRANCH = 'devlinks-bot-updates';
const LIBRARIES_FILE_PATH = 'LIBRARIES.md';
const TOOLS_FILE_PATH = 'TOOLS.md';

const github = octokit();
github.authenticate({ type: 'token', token: TOKEN });

async function submitUrl({ linkType, url, title, description, tags }) {
	try {
		const FILE_PATH = getFilePathForLinkType(linkType);

		const fileData = await getFileContent({
			path: FILE_PATH,
			branch: 'master',
		});

		const formattedLink = formatMarkdownLink({ url, title, description, tags });
		const text = getTextContentFromFileContent(fileData.content);
		const isUrlAlreadyInFile = isUrlInText({ url, text });

		if (isUrlAlreadyInFile) {
			throw new UrlAlreadySubmittedError();
		}

		const updatedText = `${text}\n${formattedLink}`;
		const updatedContent = base64Encode(updatedText);

		await safeCreateBranch({
			branch: BRANCH,
			baseBranch: 'master',
		});

		await updateFile({
			path: FILE_PATH,
			branch: BRANCH,
			sha: fileData.sha,
			message: '✨ Add a new link (devlinks-bot) 🤖',
			content: updatedContent,
		});

		const pr = await safeCreatePullRequest({
			head: BRANCH,
			base: 'master',
			title: '✨ Add new links (devlinks-bot) 🤖',
			body: 'devlinks-bot added some new links.',
		});

		return pr.html_url;
	} catch (err) {
		console.log(err);
		throw err;
	}
}

function getFilePathForLinkType(linkType) {
	return { library: LIBRARIES_FILE_PATH, tool: TOOLS_FILE_PATH }[linkType];
}

function safeCreateBranch({ branch, baseBranch }) {
	return github.repos
		.getBranch({ owner: OWNER, repo: REPO, branch })
		.then(unwrapResponse, err => {
			if (err.code === 404) {
				return createBranch({ branch, baseBranch });
			}
		});
}

function createBranch({ branch, baseBranch }) {
	return github.repos
		.getBranch({ owner: OWNER, repo: REPO, branch: baseBranch })
		.then(unwrapResponse)
		.then(branchData => {
			const sha = branchData.commit.sha;
			return github.gitdata
				.createReference({
					owner: OWNER,
					repo: REPO,
					ref: `refs/heads/${branch}`,
					sha,
				})
				.then(() =>
					github.repos
						.getBranch({ owner: OWNER, repo: REPO, branch })
						.then(unwrapResponse)
				);
		});
}

function getFileContent({ path, branch }) {
	return github.repos
		.getContent({
			owner: OWNER,
			repo: REPO,
			path,
			ref: branch,
		})
		.then(unwrapResponse);
}

function getTextContentFromFileContent(content) {
	const text = base64Decode(content);
	const sanitizedText = text.endsWith('\n') ? text.slice(0, -1) : text;
	return sanitizedText;
}

function updateFile({ path, branch, sha, message, content }) {
	return github.repos
		.updateFile({
			owner: OWNER,
			repo: REPO,
			path,
			branch,
			sha,
			message,
			content,
		})
		.then(unwrapResponse);
}

function safeCreatePullRequest({ head, base, title, body }) {
	return github.pullRequests
		.getAll({ owner: OWNER, repo: REPO })
		.then(unwrapResponse)
		.then(prs => {
			const existingPr = prs.find(pr => pr.head.ref === BRANCH);
			if (existingPr) {
				return existingPr;
			} else {
				return github.pullRequests
					.create({
						owner: OWNER,
						repo: REPO,
						head,
						base,
						title,
						body,
					})
					.then(unwrapResponse);
			}
		});
}

function unwrapResponse(response) {
	return response.data;
}

module.exports = {
	submitUrl,
};

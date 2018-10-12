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
		const text = getTextFromFileContent(fileData.content);
		const isUrlAlreadyInFile = isUrlInText({ url, text });

		if (isUrlAlreadyInFile) {
			throw new UrlAlreadySubmittedError();
		}

		const updatedText = `${text}\n${formattedLink}`;
		const updatedContent = base64Encode(updatedText);

		const BRANCH = `devlinks-bot-add-url-${Date.now()}`;

		await createBranch({
			branch: BRANCH,
			baseBranch: 'master',
		});

		const COMMIT_MESSAGE = `✨ Add ${url} to ${FILE_PATH}`;

		await updateFile({
			path: FILE_PATH,
			branch: BRANCH,
			sha: fileData.sha,
			message: COMMIT_MESSAGE,
			content: updatedContent,
		});

		const pr = await createPullRequest({
			head: BRANCH,
			base: 'master',
			title: COMMIT_MESSAGE,
			body:
				'> NOTE: This PR was raised by [devlinks-bot](https://github.com/fathomlondon/devlinks-bot) 🤖',
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

function getTextFromFileContent(content) {
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

function createPullRequest({ head, base, title, body }) {
	return github.pullRequests
		.create({ owner: OWNER, repo: REPO, head, base, title, body })
		.then(unwrapResponse);
}

function unwrapResponse(response) {
	return response.data;
}

module.exports = {
	submitUrl,
};

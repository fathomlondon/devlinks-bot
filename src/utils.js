const metaScraper = require('meta-scraper').default;

const REGEX_SLACK_FORMATTED_WEB_URL_ONLY = /^<https?:\/\/[:\w\-./?#|]+>$/;

function isFormattedSlackUrl(text) {
	return text && text.match(REGEX_SLACK_FORMATTED_WEB_URL_ONLY);
}

function extractUrl(slackFormattedUrl) {
	const url = slackFormattedUrl
		.substring(1, slackFormattedUrl.length - 1) // remove < & > delimiters
		.split('|')[0]; // get the left side of |
	return url;
}

function base64Decode(base64String) {
	const buffer = new Buffer.from(base64String, 'base64');
	const text = buffer.toString('utf8');
	return text;
}

function base64Encode(text) {
	const buffer = new Buffer.from(text);
	const base64String = buffer.toString('base64');
	return base64String;
}

function getUrlInfo(url) {
	return metaScraper(url).then(data => {
		const { title = '', description = '' } = data;
		return { url, title, description };
	});
}

function formatMarkdownLink({ url, title, description }) {
	return `- [${title}](${url}) – ${description}`;
}

module.exports = {
	isFormattedSlackUrl,
	extractUrl,
	base64Decode,
	base64Encode,
	getUrlInfo,
	formatMarkdownLink,
};

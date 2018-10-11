const metaScraper = require('meta-scraper').default;

// NOTE: this regex is very lose because it relies on the fact
// that Slack already parse and unfurl urls for us, so we know for sure
// that if the user didn't type a correct url, we won't match this shape `<…>`
const REGEX_SLACK_FORMATTED_WEB_URL_ONLY = /^<https?:\/\/.*>$/;

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

function getFormattedTags(tags) {
	const tagsArray = tags
		.trim()
		.split(',')
		.map(s => s.trim())
		.filter(Boolean);

	if (tags.length === 0) {
		return '';
	}

	return `\n  > **tags:** ${tagsArray.map(tag => `\`${tag}\``).join(', ')}`;
}

function formatMarkdownLink({ url, title, description, tags }) {
	const formattedTags = getFormattedTags(tags);
	return `- [${title}](${url}) – ${description}${formattedTags}`;
}

module.exports = {
	isFormattedSlackUrl,
	extractUrl,
	base64Decode,
	base64Encode,
	getUrlInfo,
	formatMarkdownLink,
};

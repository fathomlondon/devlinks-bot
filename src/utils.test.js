const {
	isFormattedSlackUrl,
	extractUrl,
	formatMarkdownLink,
	isUrlInText,
} = require('./utils');

const VALID_LINKS = [
	'<http://link.com>',
	'<http://www.link.com>',
	'<https://www.link.com>',
	'<http://link.com|link.com>',
	'<http://www.link.com|www.link.com>',
	'<https://www.link.com|www.link.com>',
];

describe('isFormattedSlackUrl', () => {
	test('returns true if the passed text is the Slack representation of a url', () => {
		VALID_LINKS.forEach(link => expect(isFormattedSlackUrl(link)).toBe(true));
	});

	test('returns false for text that are Slack representation of channels or users', () => {
		const invalidLinks = [
			'<#C024BE7LR>',
			'<#C024BE7LR|general>',
			'<@U024BE7LH>',
			'<@U024BE7LH|john>',
		];
		invalidLinks.forEach(link => expect(isFormattedSlackUrl(link)).toBe(false));
	});
});

describe('extractUrl', () => {
	test('extracts the actual url from a Slack representation of a url', () => {
		const links = VALID_LINKS.map(extractUrl);
		expect(links).toEqual([
			'http://link.com',
			'http://www.link.com',
			'https://www.link.com',
			'http://link.com',
			'http://www.link.com',
			'https://www.link.com',
		]);
	});
});

describe('formatMarkdownLink', () => {
	test('formats data about the submitted link into a markdown representation', () => {
		const linkWithNoTags = {
			url: 'http://link.com',
			title: 'Title',
			description: 'Description',
			tags: '',
		};

		const linkWithTags = {
			url: 'http://link.com',
			title: 'Title',
			description: 'Description',
			tags: '   tag,one,  two, three   ',
		};

		expect(formatMarkdownLink(linkWithNoTags)).toBe(
			'- [Title](http://link.com) – Description'
		);

		expect(formatMarkdownLink(linkWithTags)).toBe(
			`- [Title](http://link.com) – Description
  > **tags:** \`tag\`, \`one\`, \`two\`, \`three\``
		);
	});
});

describe('isUrlInText', () => {
	test('checks whether the passed in url already exists in the given test', () => {
		expect(
			isUrlInText({
				url: 'http://link.com',
				text: 'This [link](http://link.com) is already here',
			})
		).toBe(true);

		expect(
			isUrlInText({
				url: 'http://link.com',
				text: 'But not there',
			})
		).toBe(false);
	});
});

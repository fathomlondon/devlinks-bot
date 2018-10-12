const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/client');
const { createMessageAdapter } = require('@slack/interactive-messages');

const { SLACK_SIGNING_SECRET, SLACK_BOT_USER_TOKEN } = process.env;
const SLACK_ACTION_SHOULD_SAVE_LINK = 'SHOULD_SAVE_LINK';
const SLACK_ACTION_SAVE_LINK = 'SAVE_LINK';

const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET);
const slackClient = new WebClient(SLACK_BOT_USER_TOKEN);
const slackInteractions = createMessageAdapter(SLACK_SIGNING_SECRET);

function sendQuestionMessage({ channelId, userId, urlToSave }) {
	const message = makeQuestionMessage({ channelId, userId, urlToSave });
	return slackClient.chat.postEphemeral(message);
}

function makeQuestionMessage({ channelId, userId, urlToSave }) {
	return {
		channel: channelId,
		user: userId,
		text: `Hey <@${userId}>! ☝️ looks like this could be a useful link to save for later!`,
		attachments: [
			{
				title: 'Would you like me to save it?',
				fallback: 'Sorry, you cannot save this link.',
				callback_id: SLACK_ACTION_SHOULD_SAVE_LINK,
				actions: [
					{
						type: 'button',
						name: SLACK_ACTION_SHOULD_SAVE_LINK,
						value: urlToSave,
						text: 'Yes',
						style: 'primary',
					},
					{
						type: 'button',
						name: SLACK_ACTION_SHOULD_SAVE_LINK,
						value: null,
						text: 'No',
						style: 'danger',
					},
				],
			},
		],
	};
}

function openDetailsDialog({ trigger_id, url, title, description }) {
	return slackClient.dialog.open({
		trigger_id,
		dialog: {
			callback_id: SLACK_ACTION_SAVE_LINK,
			title: 'Submit a new dev link',
			state: JSON.stringify({ url }),
			elements: [
				{
					type: 'select',
					name: 'linkType',
					label: 'Link Type',
					options: [
						{ value: 'library', label: 'Library' },
						{ value: 'tool', label: 'Tool' },
					],
				},
				{
					type: 'text',
					name: 'title',
					value: title,
					label: 'Title',
					placeholder: 'Cool new library',
				},
				{
					type: 'textarea',
					name: 'description',
					value: description,
					label: 'Description',
					placeholder: 'A quick description about this thing',
				},
				{
					type: 'text',
					name: 'tags',
					value: '',
					label: 'Tags',
					placeholder: 'react, animation, css',
					hint: 'Please provide a comma-separated list of tags.',
					optional: true,
				},
			],
		},
	});
}

function makeLoadingMessage({ channelId, userId }) {
	return {
		channel: channelId,
		user: userId,
		text: `Hold my 🍺 while I submit the link for you…`,
	};
}

function makeSuccessMessage({ channelId, userId, prUrl }) {
	return {
		channel: channelId,
		user: userId,
		text: `Cheers <@${userId}>! I submitted a <${prUrl}|PR> for it. 👍`,
	};
}

function makeAlreadySubmittedMessage({ channelId, userId }) {
	return {
		channel: channelId,
		user: userId,
		text: `Sorry <@${userId}>, this url was already submitted previously.`,
	};
}

function makeFailureMessage({ channelId, userId, error, urlToSave }) {
	const text = `Sorry <@${userId}>! I couldn't submit your link 😭`;
	return {
		channel: channelId,
		user: userId,
		text,
		attachments: [
			{
				fallback: text,
				callback_id: SLACK_ACTION_SHOULD_SAVE_LINK,
				color: 'danger',
				fields: [{ title: 'Error', value: error.message }],
				actions: [
					{
						type: 'button',
						name: SLACK_ACTION_SHOULD_SAVE_LINK,
						value: urlToSave,
						text: 'Retry?',
						style: 'primary',
					},
					{
						type: 'button',
						name: SLACK_ACTION_SHOULD_SAVE_LINK,
						value: null,
						text: 'No',
						style: 'danger',
					},
				],
			},
		],
	};
}

module.exports = {
	slackEvents,
	slackInteractions,
	sendQuestionMessage,
	SLACK_ACTION_SHOULD_SAVE_LINK,
	openDetailsDialog,
	SLACK_ACTION_SAVE_LINK,
	makeLoadingMessage,
	makeSuccessMessage,
	makeAlreadySubmittedMessage,
	makeFailureMessage,
};

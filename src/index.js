const express = require('express');
require('now-env');
const {
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
} = require('./slack');
const { isFormattedSlackUrl, extractUrl, getUrlInfo } = require('./utils');
const { submitUrl } = require('./github');
const { UrlAlreadySubmittedError } = require('./errors');

const PORT = process.env.PORT || 5000;

const app = express();

app.use('/slack/event', slackEvents.expressMiddleware());
app.use('/slack/action', slackInteractions.expressMiddleware());

slackEvents.on('message', message => {
	const { channel: channelId, user: userId, text } = message;
	const isUrl = isFormattedSlackUrl(text);
	if (isUrl) {
		const url = extractUrl(text);
		sendQuestionMessage({ channelId, userId, urlToSave: url });
	}
});

slackEvents.on('error', error => {
	console.error('Slack error', error);
});

slackInteractions
	.action(SLACK_ACTION_SHOULD_SAVE_LINK, handleShouldSaveLink)
	.action(SLACK_ACTION_SAVE_LINK, handleSaveLink);

app.listen(PORT, () =>
	console.log(`devlinks-bot server now listening on port ${PORT}!`)
);

function handleShouldSaveLink(payload, respond) {
	const { actions, trigger_id } = payload;
	const action = actions[0];
	const urlToSave = action.value;

	if (!urlToSave) {
		// if not interested, just delete the question
		return { delete_original: true };
	}

	getUrlInfo(urlToSave)
		.then(({ url, title, description }) =>
			openDetailsDialog({ trigger_id, url, title, description })
		)
		.catch(console.error);
}

function handleSaveLink(payload, respond) {
	const { channel, user, submission, state } = payload;
	const channelId = channel.id;
	const userId = user.id;
	const { linkType, title, description, tags } = submission;
	const { url } = JSON.parse(state);

	submitUrl({ linkType, url, title, description, tags })
		.then(prUrl => respond(makeSuccessMessage({ channelId, userId, prUrl })))
		.catch(error => {
			if (error instanceof UrlAlreadySubmittedError) {
				respond(makeAlreadySubmittedMessage({ channelId, userId }));
			} else {
				respond(
					makeFailureMessage({ channelId, userId, error, urlToSave: url })
				);
			}
		});

	respond(makeLoadingMessage({ channelId, userId }));
}

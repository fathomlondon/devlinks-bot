# Contributing

## System requirements

- [Git](https://git-scm.com/)
- [Node.js](http://nodejs.org/) >= 10

## Getting started

```bash
$ git checkout https://github.com/fathomlondon/devlinks-bot.git
$ cd devlinks-bot
$ npm install
```

## Developing

### Configuring secrets

1. Launch the **“1Password”** app and open the **“Shared”** vault
1. Locate the **“devlinks-bot (dev) secrets”** secure note
1. Note down the following values from the note:
    - **“Github Token”**
    - **“Slack Signing Secret”**
    - **“Slack Bot User Token”**
1. Create a file in root named `now-secrets.json` *(it won't be added to git)*
1. Copy & paste the content below into it and fill in with the values from earlier :
    ```json
    {
      "@devlinks-bot-github-token": "[Github Token]",
      "@devlinks-bot-slack-signing-secret": "[Slack Signing Secret]",
      "@devlinks-bot-slack-bot-user-token": "[Slack Bot User Token]"
    }
    ```

### Running the app

> Note: Make sure you have followed the [“Configuring secrets”](#configuring-secrets) section above before continuing.

1. In one terminal run the following in order to run the app on http://localhost:5000:
    ```bash
    $ npm start
    ```
1. In another terminal, run the following in order to create a tunnel and expose your server to the internet:
    ```bash
    $ npx ngrok http 5000
    ```
1. Once the tunnel is open, take note of the forwarding url created by ngrok (highlighted in red in the screenshot below):

    ![ngrok](/docs/images/ngrok.png)

1. Point the Slack app (**“devlinks-bot-dev”**) to your local server by updating the urls found at the 2 following pages (don't forget to save each time!):
    - [Event Subscriptions](https://api.slack.com/apps/ADBQSDCSD/event-subscriptions)

      ![ngrok](/docs/images/slack-events.png)

    - [Interactive Messages](https://api.slack.com/apps/ADBQSDCSD/interactive-messages)

      ![ngrok](/docs/images/slack-actions.png)

1. You should now be all set! Join the `#devlinks-bot-testing` channel on Slack and posting urls in this channel should let you test the bot out.

> NOTE: By the nature of having to point the dev version of the Slack Bot app to a served url, it means only one person at a time can be working on this.

> NOTE: Once you are running, you can stop and restart your app at will and you do not need to restart the tunnel, otherwise you will get a brand new forwarding url and will have to re-update the Slack urls again…

## Deploying

The app is automatically deployed to [Now](https://zeit.co/now) via a **GitHub** integration.

When you are done with your changes and you have tested them locally using the dev version of the app, create a pull request (PR) on **GitHub**.

**Now** will automatically deploy each PR for you and once it gets merged to `master`, **Now** will make sure alias the last deployment to our production url. 👌

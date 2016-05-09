# SV Restaurant Bot

This is an adapted version of the [cafeteria bot](https://github.com/swissspidy/cafeteria-bot)

## Configuration

1. Fork this repository
2. Set up an incoming webhook in Slack and save the webhook URL in an environment variable, like this:
    
    ```
    export LUNCH_SLACK_URL='https://hooks.slack.com/…'
    ```
  
3. Adjust `workDays` and perhaps `restaurants` in `run.js`
4. To run, simple execute `node run.js` (after `npm install`, of course).

Pro tip: Set up a cron job! For example, this will post the lunch menu every day at 10 o’clock:

`* 10 * * * node /path/to/lunch-bot/run.js >/dev/null 2>&1`

## Screenshot

![Demo of the Slack integration](https://cldup.com/LUjNzTeRhi.png)

## License

GPLv3

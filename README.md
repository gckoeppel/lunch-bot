# Binz Restaurant Bot

This is an adapted version of the [cafeteria bot](https://github.com/swissspidy/cafeteria-bot).
Currently posts the daily menus in your slack channel of these restaurants:
  - [Swisscom Restaurant Binz](http://swisscom-binz.sv-group.ch/de.html) (SV Restaurant)
  - [Swiss Life Restaurant Binz49](https://zfv.ch/de/microsites/swiss-life-restaurant-binz49/menueplan) (ZFV)
  - [Binz 38](http://www.binz-38.ch/home/)

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

![Demo of the Slack integration](http://i.imgur.com/b5p2Ye5.png)

## License

GPLv3

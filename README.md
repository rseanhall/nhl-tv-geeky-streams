Best way to download NHL games (both live and archive) to your Mac, PC
or Linux. An active account to at least one provider **is required**. You should be familiar with terminal.

Currently supported providers:
* NHL.TV
* WatchESPN (US ESPN+ and ESPN channels)

Blackouts are not worked around in any way. `This game is blacked out in your region. Try using VPN or select another game.` message will be displayed in that case.

# Demo

<a href="https://asciinema.org/a/157500" target="_blank"><img src="https://asciinema.org/a/157500.png" /></a>

# Usage

Copy `config.yaml` to `src/config.yaml.local`.

If using NHL.TV, edit `src/config.yaml.local` to set email and password (these are not stored anywhere else and used _only_ to login).

If using WatchESPN, the app will give you a code for ESPN+ feeds that you have to enter at https://espn.com/activate (every 6 months).
For ESPN channels, the app will give you a code that you have to enter at https://es.pn/appletv (every 12 months).

Explore other options available in `src/config.yaml.local`.

Video will be downloaded to `./video` folder. This location can be customized in `.env` file.

[Download](https://github.com/rseanhall/nhl-tv-geeky-streams/archive/develop.zip) latest version of this repository and unzip it anywhere.

## With [Docker](https://www.docker.com/community-edition#/download)

- If you have downloaded a new version of this repository, run `docker-compose build --no-cache` to rebuild the docker container with the latest dependencies.
- Run `docker-compose run --rm nhltv` in the directory where you've unzipped code to.
- You can also run `docker-compose run --rm nhltv yarn start --help` for info on command line options.

## Without Docker, much less resource hungry, instructions for macOS

- Install dependencies with `brew install yarn streamlink ffmpeg`.
- Run `yarn install` in the directory where you've unzipped code to.
- Run `yarn start` in the directory where you've unzipped code to.
- You can also run `yarn start --help` for info on command line options.

# Credits

Loosely based on

* https://github.com/timewasted/xbmc-nhl-gamecenter
* https://github.com/eracknaphobia/plugin.video.nhlgcl
* https://github.com/cmaxwe/dl-nhltv
* https://github.com/t43pasdf/plugin.video.espn_3
* https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b
* https://github.com/emilsvennesson/kodi-viaplay

Special credit to:
* [kompot](https://github.com/kompot) for the [original repository](https://github.com/kompot/nhl-tv-geeky-streams) that this is forked from.

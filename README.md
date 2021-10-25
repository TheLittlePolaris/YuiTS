# **YuiTS**

![](https://img.shields.io/badge/YuiTS-orange)
Yui but in TypeScript

# **WORK IN PROGRESS!**

> # **What can Yui do?**

- Designed to be a multi-server music and (a bit of) administration bot.
- Play music from
  - Youtube: Queries, search, links, playlists (except private/personal mix), livestreams (not so stable).
  - SoundCloud: Song links and SoundCloud playlist links (except private/personal/discover/mix).
  - Commands to control music, and is free to use, just the you need to be in the right place to use them. There is no limit controller.
- Some utilities for entertaining:
  - Like `>tenor slap @<your-poor-target>`, this will load an anime gif with the action you carried out. Of course anime.
  - `>holostat ?<id|jp|cn> ?<detail|d>`: Channel statistics for Hololive members or a specific member, you can change the order of params
  - Some basic thingy like `say` or `ping`
- Some basic administrative commands
- The permission for each command is base on the executor permissions and yui's permissions
- Most of Yui's command are flexible, which means you can change the position of the arguments, like the `holostat` command, but there are always rules to follow.
- For Yui's admin command, you can have multiple targets, like you can assign many roles to many users, role can either be a Role `@mention` or Role `Name`, and targets have to be `@mentioned`, for example: `>admin addrole @RoleName1 RoleName2 @target1 @target2 <?reason>`, for `kick` or `ban`, rule is also the same, action will be applied for all `@mentioned` targets, no matter where you mention them, so please be careful.

> # **Preparation:**

- Create a `.env` file with:
  - `TOKEN` is your bot token
  - A fixed `PREFIX`
  - Your own `YOUTUBE_API_KEY` which you can get from Google APIs Console
  - You will also need your bot id to replace `YUI_ID` and your own id to replace `OWNER_ID`
  - Also a `TENOR_KEY` which you can get from Tenor API and a `TENOR_ANONYMOUS_ID`. (If you dont feel line using this just comment it out)

> # **How to run ?**

**Using a machine:**

- First you need to install the libraries:

  - First install node. Install node version 12.x.x. You might want to use [`nvm`](https://github.com/nvm-sh/nvm).
  - On Windows: You will need to install Python 2.7, Microsoft Visual Studio (Community) with C++ compiler and language support installed. About which option: sorry i forgot, you will need to figure it out yourself, but it takes about 6-8 something GB of memory iirc. And then `npm install`. You can either run with `npm run start:win`, or add `cross-env` package and replace linux's `export` with `cross-env`, remember to call the `dotenv's config()` on top of the `ConfigService`
  - Also on Windows: Enable your [`Windows Subsystem for Linux`](https://docs.microsoft.com/en-us/windows/wsl/about) and do the same as on Linux.
  - On Linux: (I use Ubuntu) Just `sudo apt update && sudo apt upgrade -y`. Then install Python 2.7 follow [the instruction](https://tecadmin.net/install-python-2-7-on-ubuntu-and-linuxmint/) and [youtube-dl](https://github.com/ytdl-org/youtube-dl) (`sudo apt install youtube-dl`), and then `npm install`.
  - If you are going to bring Yui on a host, make sure you have above 1.5GB of RAM available. 1GB will fail. If it fail for 1.5GB add one more option after the `node` command: `--max-old-space-size=4096`. If still doesn't work the increase it to 2GB.
  - `npm start`

- If nothing happen then your good to run, or else google for the error XD. I did the above steps and had no problem.

**Docker:**

- `docker-compose up -d yui` or `docker build -t yui-little-house:latest -f Dockerfile .` and then run the image manually using `docker run -d --name Yui-no-Ie yui-little-house`. Clean the build to save space with `docker image prune` or list out the images and remove the one without name. (~420MB)

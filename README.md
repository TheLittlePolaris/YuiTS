# YuiTS

![](https://img.shields.io/badge/YuiTS-orange) ![](https://img.shields.io/badge/TypeScript-v3.8-blue) ![](https://img.shields.io/badge/discord.js-v12.2-blue) ![](https://img.shields.io/badge/ytdl--core-v2.1.0-red) ![](https://img.shields.io/badge/youtube--dl-v2020.06.06-red) ![](https://img.shields.io/badge/googleapis-v48.0.0-red) ![](https://img.shields.io/badge/ffmpeg--static-v4.1.1-c9f) ![](https://img.shields.io/badge/dotenv-v8.2-blueviolet) ![](https://img.shields.io/badge/node-%3E=12.0.0-brightgreen) ![](https://img.shields.io/badge/code%20style-prettier-ff69b4) ![](https://img.shields.io/badge/what%20is%20this%3F-idk%20JUST%20DO%20IT-success)

Yui but in TypeScript

**WORK IN PROGRESS!**

> **What can Yui do?**

- Designed to be a multi-server music bot.
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

> **How to use ?**

- Create a `.env.development` file with:

  - `TOKEN` is your bot token
  - A fixed `PREFIX`
  - Your own `YOUTUBE_API_KEY` which you can get from Google APIs Console
  - You will also need your bot id to replace `YUI_ID` and your own id to replace `OWNER_ID`
  - Also a `TENOR_KEY` which you can get from Tenor API and a `TENOR_ANONYMOUS_ID`. (If you dont feel line using this just comment it out)

> **How to run ?**

- First you need to install the libraries:
  - First install `nvm` and install 2 node version: 10.16 and 12.16
  - You need to have node 10 installed, and switch no node 10 to do the `npm install` for 2 library `opusscript` and `@discordjs/opus`. These libs fail to install with Node 12. Node 12 for installing other libs and running Yui.
  - On Windows: You will need to install Python 2.7, Microsoft Visual Studio (Community) with C++ compiler and language support installed. About which option: sorry i forgot, you will need to figure it out yourself, but it takes about 6-8 something GB of memory iirc. And then `npm install`
  - Also on Windows: Enable your Windows Subsystem for Linux (WSL(2)) and do the same as on Linux.
  - On Linux: (I use Ubuntu) Just `sudo apt update && sudo apt upgrade -y`. Then install Python 2.7 follow the instruction on their site and youtube-dl (`sudo apt install youtube-dl`), and then install the node_modules.
  - `sudo yum update && sudo yum upgrade -y` for CentOS? Maybe.
  - If you are going to bring Yui on a host, make sure you have above 1.5GB of RAM available. 1GB will fail. If it fail for 1.5GB add one more option after the `node` command: `--max-old-space-size=4096`. If still doesn't work the increase it to 2GB.
- If nothing happen then your good to run, or else google for the error XD. I did the above steps and had no problem.

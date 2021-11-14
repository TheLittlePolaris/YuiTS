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
  - Also a `TENOR_KEY` which you can get from Tenor API and a `TENOR_ANONYMOUS_ID`. (If you don't feel like using this just comment it out)

> # **How to run ?**

**Using a machine:**
 - `node 16.13` and `redis`
 - `yarn` or `npm install`
 - `yarn start` or `npm start`


**Docker:**
 - `docker compose -p yui-bot up -d`

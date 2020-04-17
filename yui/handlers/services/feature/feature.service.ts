import { debugLogger, errorLogger } from '@/handlers/log.handler'
import type { Message, ClientUser, PermissionResolvable } from 'discord.js'
import { discordRichEmbedConstructor } from '../music/music-utilities/music-embed-constructor'
import {
  isMyOwner,
  tenorRequestService,
} from './feature-services/utility.service'
// import {
//   memberHasPermission,
//   yuiHasPermission
// } from '../administration/administration-actions/permission.service';
import { RNG } from '../music/music-utilities/music-function'

export class FeatureService {
  constructor() {
    debugLogger('FeatureService')
  }

  public async getPing(message: Message, pings: number[]): Promise<void> {
    const sentMessage = (await message.channel
      .send('**`Pinging... `**')
      .catch(null)) as Message
    const timeStart = message.createdTimestamp
    const timeEnd = sentMessage.createdTimestamp
    const embed = await discordRichEmbedConstructor({
      title: 'Status',
      description: `:revolving_hearts: **: \`${
        timeEnd - timeStart
      }ms\`**\n:heartpulse: **: \`${pings[0]}ms\`**`,
    })
    if (!!sentMessage) sentMessage.edit(embed)
    return Promise.resolve()
  }
  public async help(message: Message, clientUser: ClientUser): Promise<void> {
    let commands =
      '**__Music:__**\n`play | p`: add to end\n' +
      '`pnext | pn`: add to next\n' +
      '`skip | next <?range>`: skip a/some song(s)\n' +
      '`leave | bye`: leave the bot\n' +
      '`join | come`: join the bot\n' +
      '`queue | q <?number>`: list out the queue at tab number (default 0)\n' +
      "`np | nowplaying`: currently playing song's info\n" +
      '`loop <?queue>`: loop the song/the queue\n' +
      '`pause`: pause the song\n' +
      '`resume`: resume pause\n' +
      '`shuffle`: shuffle the queue\n' +
      '`clear`: clear queue\n' +
      '`search`: search for a song, pick by index\n' +
      '`autoplay | ap`: auto play a random song from current Youtube channel\n' +
      '`remove <index> <?range>`: remove a/some song(s)\n' +
      '`stop`: clear queue and stop playing\n\n' +
      '**__Ultilities:__**\n' +
      '`admin <kick/ban/mute/unmute/setnickname/addrole/removerole> <@mention> <?reason>`: admin commands\n' +
      '`tenor`: tenor GIFs, random limit: 5\n' +
      "`ping`: connection's status\n" +
      '`say`(limit to admin/owner): repeat what you say\n\n'
    const embed = await discordRichEmbedConstructor({
      author: {
        embedTitle: clientUser.username,
        authorAvatarUrl: clientUser.avatarURL,
      },
      description: commands,
      title: 'Command List',
      footer:
        'Note: <>: obligatory param | <?> optional param | Permission: `BAN_MEMBERS` or above',
    })
    message.channel.send(embed)
    return Promise.resolve()
  }

  public async say(message: Message, args: Array<string>): Promise<void> {
    const yui = message.guild.members.get(global?.config?.yuiId)
    // TODO:
    // const yuiPermission = await yuiHasPermission(yui, 'say');
    // if (yuiPermission) {
    //   const _arguments = args.join(' ');
    //   const deleted = await message.delete(0);
    //   const embed = discordRichEmbedConstructor({
    //     description: _arguments
    //   });
    //   message.channel.send(embed);
    //   return Promise.resolve();
    // } else {
    //   message.reply(`sorry, I don't have manange messages permisssion.`);
    // }
    return Promise.resolve()
  }

  public async tenorGif(message: Message, args: Array<string>) {
    const deleted = await message.delete()
    const num = await RNG(10)
    // console.log(deleted.mentions.members.first());
    const mentionFirst = deleted.mentions.members.first()
    const mentionUser = mentionFirst && mentionFirst.displayName
    const mentioned = mentionUser && args.splice(args.indexOf(mentionUser), 1)
    const _arguments = args.join(' ')
    const result = await tenorRequestService(_arguments).catch(this.handleError)
    const description = mentionUser
      ? `${
          deleted.member.displayName
        } ${_arguments.toUpperCase()} ${mentionUser}`
      : `${deleted.member.displayName} ${_arguments.toUpperCase()}`
    // console.log(result.results[num].media[0].gif);
    message.channel.send(
      await discordRichEmbedConstructor({
        description,
        imageUrl: result.results[num].media[0].gif.url,
      })
    )
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, 'FEATURE_SERVICE')
  }
}

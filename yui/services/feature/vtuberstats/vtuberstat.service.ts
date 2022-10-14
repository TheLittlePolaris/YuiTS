import { Injectable } from '@tlp01/djs-ioc-container';
import { Message, GuildMember, EmbedField } from 'discord.js';

import { subscriberCountFormatter, dateTimeJSTFormatter } from '../utils/feature-utilities';
import { KNOWN_AFFILIATION } from '../interfaces/vtuber-stat.interface';

import { HoloStatRequestService } from './requests';
import { YoutubeChannelService } from './requests/youtube-channel.service';
import { KnownHoloStatRegions, holoStatList, HoloStatRegions } from './interfaces';

import {
  deleteMessage,
  discordRichEmbedConstructor,
  sendChannelMessage
} from '@/services/utilities';

@Injectable()
export class VtuberStatService {
  constructor(
    private readonly holostatRequestService: HoloStatRequestService,
    private readonly youtubeRequestService: YoutubeChannelService
  ) {}

  public async vtuberStatSelectList({
    message,
    affiliation = 'Hololive',
    regionCode
  }: {
    message: Message;
    affiliation: KNOWN_AFFILIATION;
    regionCode?: KnownHoloStatRegions;
  }): Promise<unknown> {
    if (!regionCode) return this.getRegion({ message, affiliation });

    const service = this.holostatRequestService;
    const dataList = await service.getChannelList(regionCode);

    if (!dataList || !dataList.length)
      return sendChannelMessage(message, '**Something went wrong :(**');

    const fieldsData: EmbedField[] = dataList.map((item, index) => ({
      name: `**${index + 1}**`,
      value: `**${item.snippet.title}**`,
      inline: true
    }));

    const sentContent: Message[] = [];

    const limit = 20;
    const hasPaging = fieldsData.length > limit;
    const sendPartial = async (index: number) => {
      const currentPartLimit =
        index + limit >= fieldsData.length ? fieldsData.length : index + limit;

      const sendingEmbed = discordRichEmbedConstructor({
        description: `**Select the number dedicated to the channel name for detail${
          hasPaging ? ` (page ${index / limit + 1})` : ''
        }**`,
        fields: fieldsData.slice(index, currentPartLimit)
      });

      const sent = await sendChannelMessage(message, { embeds: [sendingEmbed] });

      sentContent.push(sent);

      if (!(currentPartLimit >= fieldsData.length)) sendPartial(currentPartLimit);

      return;
    };
    sendPartial(0);

    const collectorFilter = (messageFilter: Message): boolean =>
      messageFilter.author.id === message.author.id &&
      messageFilter.channel.id === message.channel.id;

    const collector = message.channel.createMessageCollector({
      filter: collectorFilter,
      time: 30000,
      max: 1
    });

    const deleteSentContent = () => {
      sentContent.filter(Boolean).forEach((sentMessage) => {
        deleteMessage(sentMessage);
      });
    };

    collector.on('collect', async (collected: Message) => {
      collector.stop();

      const selected = /^\d{1,2}|cancel$/.exec(collected.content);
      if (!selected) {
        sendChannelMessage(message, '**Please choose a valid number**');
        return;
      }
      const option = selected[0];
      if (option === 'cancel') {
        sendChannelMessage(message, '**Canceled**');
        deleteSentContent();
        return;
      } else {
        const selectedNumber = Number(option); // number is valid
        this.getChannelDetail({
          message,
          channelId: dataList[selectedNumber - 1]?.id
        });
        return;
      }
    });
    collector.on('end', (collected) => {
      if (sentContent) deleteSentContent();

      if (collected.size < 1) sendChannelMessage(message, ':ok_hand: Action aborted.');

      return;
    });
  }

  public async getChannelDetail({
    message,
    channelId
  }: {
    message: Message;
    channelId: string;
  }): Promise<void> {
    const service = this.youtubeRequestService;
    const channelData = await service.getSelectedChannelDetail(channelId);
    if (!channelData) sendChannelMessage(message, 'Something went wrong, please try again.');

    const [subscriberCount, channelUrl, publishedDate] = [
      subscriberCountFormatter(channelData.statistics.subscriberCount),
      `https://www.youtube.com/channel/${channelData.id}`,
      dateTimeJSTFormatter(channelData.snippet.publishedAt)
    ];

    const description = `**Description:** ${channelData.snippet.description}
    
    **Created date: \`${publishedDate}\`\
    Subscribers: \`${subscriberCount}\`
    Views: \`${channelData.statistics.viewCount}\`
    Videos: \`${channelData.statistics.videoCount}\`**`;

    const embed = discordRichEmbedConstructor({
      title: channelData?.snippet?.title,
      titleUrl: channelUrl,
      imageUrl: channelData?.brandingSettings?.image?.bannerTvHighImageUrl,
      thumbnailUrl: channelData?.snippet?.thumbnails?.high?.url,
      description,
      color: channelData?.brandingSettings?.channel?.profileColor
    });

    await sendChannelMessage(message, { embeds: [embed] });

    return;
  }

  public async getRegion({
    message,
    affiliation = 'Hololive'
  }: {
    message: Message;
    affiliation?: KNOWN_AFFILIATION;
  }): Promise<void> {
    const reactionList = holoStatList;

    const regionCodes = Object.keys(reactionList);

    const content = `**Which region should i look for ? ${regionCodes.map(
      (k, index) => `\n${index + 1}. ${reactionList[k].name}`
    )}**`;
    const sentMessage = await sendChannelMessage(message, content);
    if (!sentMessage) {
      sendChannelMessage(message, '**Sorry, something went wrong.**');
      return;
    }
    const collectorFilter = (messageFilter: Message) =>
      messageFilter.author.id === message.author.id &&
      messageFilter.channel.id === message.channel.id;

    const collector = sentMessage.channel.createMessageCollector({
      filter: collectorFilter,
      time: 15000,
      max: 1
    });

    collector.on('collect', (collected: Message) => {
      collector.stop();

      const selected = /^[1-4]|cancel$/.exec(collected.content);
      if (!selected) {
        sendChannelMessage(message, 'Invailid option! Action aborted.');
        return;
      }
      const option = selected[0];
      if (option === 'cancel') {
        sendChannelMessage(message, '**`Canceled!`**');
        deleteMessage(sentMessage);
        return;
      } else {
        const index = Number(option);
        this.vtuberStatSelectList({
          message,
          affiliation,
          regionCode: regionCodes[index - 1] as any
        });
        return;
      }
    });

    collector.on('end', (collected) => {
      if (sentMessage) sentMessage.delete();

      if (collected.size < 1) sendChannelMessage(message, ':ok_hand: Action aborted.');

      return;
    });
  }

  public async vtuberStatStatistics({
    message,
    yui,
    affiliation,
    region
  }: {
    message: Message;
    yui: GuildMember;
    affiliation: KNOWN_AFFILIATION;
    region?: KnownHoloStatRegions;
  }): Promise<void> {
    const waitingMessage = await sendChannelMessage(
      message,
      ':hourglass_flowing_sand: **_Hold on while i go grab some data!_**'
    );
    const holoStatData = await this.holostatRequestService.getAllMembersChannelDetail(
      region as any
    );

    const fieldsData: EmbedField[] = holoStatData.map((item) => {
      const fieldName = `${item.snippet.title}`;
      const channelUrl = `https://www.youtube.com/channel/${item.id}`;

      const fieldData = `Channel: [${
        item.snippet.title
      }](${channelUrl})\nSubscribers: ${subscriberCountFormatter(
        item.statistics.subscriberCount
      )}\nViews: ${item.statistics.viewCount}\nVideos: ${item.statistics.videoCount}`;
      return {
        name: fieldName,
        value: fieldData,
        inline: true
      };
    });

    if (fieldsData) deleteMessage(waitingMessage);

    const regionMap = HoloStatRegions;

    const limit = 18;
    const hasPaging = fieldsData.length > limit;
    const sendPartial = async (index: number) => {
      const currentPartLimit =
        index + limit >= fieldsData.length ? fieldsData.length : index + limit;

      const sendingEmbed = discordRichEmbedConstructor({
        author: {
          authorName: yui.displayName,
          avatarUrl: yui.user.avatarURL()
        },
        description: `${affiliation} ${regionMap[region]} members statistics${
          hasPaging ? ` page ${index / limit + 1}` : ''
        }`,
        fields: fieldsData.slice(index, currentPartLimit)
      });

      sendChannelMessage(message, {
        embeds: [sendingEmbed]
      });

      if (!(currentPartLimit >= fieldsData.length)) sendPartial(currentPartLimit);

      return;
    };

    sendPartial(0);
  }
}

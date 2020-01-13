import { ADMIN_ACTION_TYPE } from '../interfaces/administration.interface';
import { GuildMember } from 'discord.js';

export function executeCommand(
  command: ADMIN_ACTION_TYPE,
  member: GuildMember,
  reason?: string
): Promise<boolean> {
  return new Promise<boolean>(async (resolve, reject) => {
    resolve(true);
  });
}

function kick(member: GuildMember) {
  return new Promise((resolve, reject) => {});
}

function ban(member: GuildMember) {
  return new Promise((resolve, reject) => {});
}
function addRole(member: GuildMember) {
  return new Promise((resolve, reject) => {});
}
function removeRole(member: GuildMember) {
  return new Promise((resolve, reject) => {});
}
function mute(member: GuildMember) {
  return new Promise((resolve, reject) => {});
}
function unmute(member: GuildMember) {
  return new Promise((resolve, reject) => {});
}
function setNickname(member: GuildMember) {
  return new Promise((resolve, reject) => {});
}

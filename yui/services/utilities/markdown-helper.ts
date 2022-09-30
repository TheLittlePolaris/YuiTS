export const bold = (text: string | number) => `**${text}**`;

export const italic = (text: string | number) => `_${text}_`;

export const underline = (text: string | number) => `__${text}__`;

export const cross = (text: string | number) => `~~${text}~~`;

export const code = (text: string | number) => `\`${text}\``;

export const codeBlock = (text: string | number, codeType?: string) =>
  `\`\`\`${codeType || ''}\n${text}\n\`\`\``;

export abstract class Markdown {
  static bold(text: string | number) {
    return bold(text);
  }

  static italic(text: string | number) {
    return italic(text);
  }

  static underline(text: string | number) {
    return underline(text);
  }

  static cross(text: string | number) {
    return cross(text);
  }

  static codeBlock(text: string | number) {
    return codeBlock(text);
  }
}

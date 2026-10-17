import { v4 as uuidv4 } from 'uuid';
import {
  TelegramMessage,
  TelegramBot,
  TelegramUpdate,
  TelegramUpdateType,
} from '../models';

export class TelegramService {
  private messageStorage = new Map<string, TelegramMessage>();
  private botStorage = new Map<string, TelegramBot>();
  private updateStorage = new Map<string, TelegramUpdate>();

  createBot(
    organizationId: string,
    botName: string,
    botToken: string,
    botUsername: string,
    webhookUrl: string
  ): TelegramBot {
    const botId = uuidv4();
    const bot: TelegramBot = {
      id: botId,
      organizationId,
      botName,
      botToken,
      botUsername,
      webhookUrl,
      isActive: true,
      lastUpdateId: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.botStorage.set(botId, bot);
    return bot;
  }

  getBotById(organizationId: string, botId: string): TelegramBot | null {
    const bot = this.botStorage.get(botId);
    if (!bot || bot.organizationId !== organizationId) {
      return null;
    }
    return bot;
  }

  getOrganizationBots(organizationId: string, limit: number = 20, offset: number = 0): TelegramBot[] {
    return Array.from(this.botStorage.values())
      .filter((b) => b.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(offset, offset + limit);
  }

  updateBotWebhook(
    organizationId: string,
    botId: string,
    webhookUrl: string
  ): TelegramBot | null {
    const bot = this.botStorage.get(botId);
    if (!bot || bot.organizationId !== organizationId) {
      return null;
    }

    bot.webhookUrl = webhookUrl;
    bot.updatedAt = new Date();
    this.botStorage.set(botId, bot);

    return bot;
  }

  updateBotLastUpdate(organizationId: string, botId: string, lastUpdateId: number): TelegramBot | null {
    const bot = this.botStorage.get(botId);
    if (!bot || bot.organizationId !== organizationId) {
      return null;
    }

    bot.lastUpdateId = lastUpdateId;
    bot.updatedAt = new Date();
    this.botStorage.set(botId, bot);

    return bot;
  }

  deactivateBot(organizationId: string, botId: string): TelegramBot | null {
    const bot = this.botStorage.get(botId);
    if (!bot || bot.organizationId !== organizationId) {
      return null;
    }

    bot.isActive = false;
    bot.updatedAt = new Date();
    this.botStorage.set(botId, bot);

    return bot;
  }

  processUpdate(
    organizationId: string,
    botId: string,
    updateId: number,
    updateType: TelegramUpdateType,
    chatId: string,
    userId: string,
    messageText?: string,
    callbackData?: string,
    userUsername?: string
  ): TelegramUpdate {
    const updateUuid = uuidv4();
    const update: TelegramUpdate = {
      id: updateUuid,
      organizationId,
      botId,
      updateId,
      updateType,
      chatId,
      userId,
      userUsername,
      messageText,
      callbackData,
      processedAt: new Date(),
    };

    this.updateStorage.set(updateUuid, update);

    // Update bot's last update ID
    this.updateBotLastUpdate(organizationId, botId, updateId);

    return update;
  }

  getUpdateById(organizationId: string, updateId: string): TelegramUpdate | null {
    const update = this.updateStorage.get(updateId);
    if (!update || update.organizationId !== organizationId) {
      return null;
    }
    return update;
  }

  getBotUpdates(
    organizationId: string,
    botId: string,
    limit: number = 50,
    offset: number = 0
  ): TelegramUpdate[] {
    return Array.from(this.updateStorage.values())
      .filter((u) => u.organizationId === organizationId && u.botId === botId)
      .sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime())
      .slice(offset, offset + limit);
  }

  getChatUpdates(
    organizationId: string,
    chatId: string,
    limit: number = 50,
    offset: number = 0
  ): TelegramUpdate[] {
    return Array.from(this.updateStorage.values())
      .filter((u) => u.organizationId === organizationId && u.chatId === chatId)
      .sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime())
      .slice(offset, offset + limit);
  }

  getUserUpdates(
    organizationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): TelegramUpdate[] {
    return Array.from(this.updateStorage.values())
      .filter((u) => u.organizationId === organizationId && u.userId === userId)
      .sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime())
      .slice(offset, offset + limit);
  }

  recordMessage(
    organizationId: string,
    chatId: string,
    userId: string,
    externalMessageId: string,
    messageType: TelegramUpdateType,
    content: string,
    userUsername?: string,
    replyToMessageId?: string,
    metadata?: Record<string, any>
  ): TelegramMessage {
    const messageUuid = uuidv4();
    const message: TelegramMessage = {
      id: messageUuid,
      organizationId,
      chatId,
      userId,
      userUsername,
      messageType,
      content,
      externalMessageId,
      sentAt: new Date(),
      replyToMessageId,
      metadata: metadata || {},
    };

    this.messageStorage.set(messageUuid, message);
    return message;
  }

  getMessageById(organizationId: string, messageId: string): TelegramMessage | null {
    const message = this.messageStorage.get(messageId);
    if (!message || message.organizationId !== organizationId) {
      return null;
    }
    return message;
  }

  getChatMessages(
    organizationId: string,
    chatId: string,
    limit: number = 50,
    offset: number = 0
  ): TelegramMessage[] {
    return Array.from(this.messageStorage.values())
      .filter((m) => m.organizationId === organizationId && m.chatId === chatId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(offset, offset + limit);
  }

  getOrganizationMessages(
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): TelegramMessage[] {
    return Array.from(this.messageStorage.values())
      .filter((m) => m.organizationId === organizationId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(offset, offset + limit);
  }

  editMessage(
    organizationId: string,
    messageId: string,
    newContent: string
  ): TelegramMessage | null {
    const message = this.messageStorage.get(messageId);
    if (!message || message.organizationId !== organizationId) {
      return null;
    }

    message.content = newContent;
    message.editedAt = new Date();
    this.messageStorage.set(messageId, message);

    return message;
  }

  deleteMessage(organizationId: string, messageId: string): boolean {
    const message = this.messageStorage.get(messageId);
    if (!message || message.organizationId !== organizationId) {
      return false;
    }

    this.messageStorage.delete(messageId);
    return true;
  }

  getBotStats(organizationId: string, botId: string): {
    totalUpdates: number;
    totalMessages: number;
    uniqueChats: number;
    uniqueUsers: number;
  } {
    const updates = Array.from(this.updateStorage.values()).filter(
      (u) => u.organizationId === organizationId && u.botId === botId
    );
    const messages = Array.from(this.messageStorage.values()).filter(
      (m) => m.organizationId === organizationId
    );

    const uniqueChats = new Set(updates.map((u) => u.chatId)).size;
    const uniqueUsers = new Set(updates.map((u) => u.userId)).size;

    return {
      totalUpdates: updates.length,
      totalMessages: messages.length,
      uniqueChats,
      uniqueUsers,
    };
  }

  getUpdatesByType(
    organizationId: string,
    updateType: TelegramUpdateType,
    limit: number = 50,
    offset: number = 0
  ): TelegramUpdate[] {
    return Array.from(this.updateStorage.values())
      .filter((u) => u.organizationId === organizationId && u.updateType === updateType)
      .sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime())
      .slice(offset, offset + limit);
  }
}

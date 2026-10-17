import { TelegramService } from '../../domains/integrations/services/TelegramService';

const service = new TelegramService();

export default async function handler(req: any, res: any) {
  const { 'x-organization-id': organizationId } = req.headers;

  if (!organizationId) {
    return res.status(400).json({ error: 'x-organization-id header required' });
  }

  const { action, botId, botName, botToken, botUsername, webhookUrl, updateId, updateType, chatId, userId, messageText } = req.body;

  try {
    if (action === 'create_bot') {
      const bot = service.createBot(organizationId, botName, botToken, botUsername, webhookUrl);
      return res.status(201).json(bot);
    } else if (action === 'update_webhook') {
      const bot = service.updateBotWebhook(organizationId, botId, webhookUrl);
      return res.status(200).json(bot);
    } else if (action === 'process_update') {
      const { userUsername, callbackData } = req.body;
      const update = service.processUpdate(
        organizationId,
        botId,
        updateId,
        updateType,
        chatId,
        userId,
        messageText,
        callbackData,
        userUsername
      );
      return res.status(201).json(update);
    } else if (action === 'record_message') {
      const { externalMessageId, userUsername, replyToMessageId, metadata } = req.body;
      const message = service.recordMessage(
        organizationId,
        chatId,
        userId,
        externalMessageId,
        updateType,
        messageText,
        userUsername,
        replyToMessageId,
        metadata
      );
      return res.status(201).json(message);
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

import { TelegramService } from '../../domains/integrations/services/TelegramService';

const service = new TelegramService();

export default async function handler(req: any, res: any) {
  const { 'x-organization-id': organizationId } = req.headers;

  if (!organizationId) {
    return res.status(400).json({ error: 'x-organization-id header required' });
  }

  const { botId, messageId, chatId, updateId: updateUuid, limit = 50, offset = 0 } = req.query;

  try {
    if (messageId) {
      const message = service.getMessageById(organizationId, messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      return res.status(200).json(message);
    }

    if (updateUuid) {
      const update = service.getUpdateById(organizationId, updateUuid);
      if (!update) {
        return res.status(404).json({ error: 'Update not found' });
      }
      return res.status(200).json(update);
    }

    if (chatId) {
      const messages = service.getChatMessages(
        organizationId,
        chatId,
        parseInt(limit),
        parseInt(offset)
      );
      return res.status(200).json(messages);
    }

    if (botId) {
      const updates = service.getBotUpdates(
        organizationId,
        botId,
        parseInt(limit),
        parseInt(offset)
      );
      return res.status(200).json(updates);
    }

    const bots = service.getOrganizationBots(organizationId, parseInt(limit), parseInt(offset));
    return res.status(200).json(bots);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

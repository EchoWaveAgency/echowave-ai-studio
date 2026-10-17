import { WhatsAppService } from '../../domains/integrations/services/WhatsAppService';

const service = new WhatsAppService();

export default async function handler(req: any, res: any) {
  const { 'x-organization-id': organizationId } = req.headers;

  if (!organizationId) {
    return res.status(400).json({ error: 'x-organization-id header required' });
  }

  const { conversationId, messageId, templateId, limit = 50, offset = 0 } = req.query;

  try {
    if (messageId) {
      const message = service.getMessageById(organizationId, messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      return res.status(200).json(message);
    }

    if (conversationId) {
      const messages = service.getConversationMessages(
        organizationId,
        conversationId,
        parseInt(limit),
        parseInt(offset)
      );
      return res.status(200).json(messages);
    }

    if (templateId) {
      const template = service.getTemplateById(organizationId, templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      return res.status(200).json(template);
    }

    const templates = service.getOrganizationTemplates(
      organizationId,
      parseInt(limit),
      parseInt(offset)
    );
    return res.status(200).json(templates);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

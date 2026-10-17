import { WhatsAppService } from '../../domains/integrations/services/WhatsAppService';

const service = new WhatsAppService();

export default async function handler(req: any, res: any) {
  const { 'x-organization-id': organizationId } = req.headers;

  if (!organizationId) {
    return res.status(400).json({ error: 'x-organization-id header required' });
  }

  const { action, conversationId, contactPhone, messageType, content, templateName, mediaUrl } = req.body;

  try {
    if (action === 'send_message') {
      const message = service.sendMessage(
        organizationId,
        conversationId,
        contactPhone,
        messageType,
        content,
        mediaUrl,
        templateName
      );
      return res.status(201).json(message);
    } else if (action === 'create_template') {
      const { templateName: name, category, language, variables } = req.body;
      const template = service.createTemplate(organizationId, name, content, variables, category, language);
      return res.status(201).json(template);
    } else if (action === 'create_conversation') {
      const { contactName } = req.body;
      const conversation = service.createConversation(organizationId, contactPhone, contactName);
      return res.status(201).json(conversation);
    } else if (action === 'update_message_status') {
      const { messageId, status, externalMessageId } = req.body;
      const message = service.updateMessageStatus(organizationId, messageId, status, externalMessageId);
      return res.status(200).json(message);
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

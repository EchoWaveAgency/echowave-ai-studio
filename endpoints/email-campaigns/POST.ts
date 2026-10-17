import { EmailService } from '../../domains/integrations/services/EmailService';

const service = new EmailService();

export default async function handler(req: any, res: any) {
  const { 'x-organization-id': organizationId } = req.headers;

  if (!organizationId) {
    return res.status(400).json({ error: 'x-organization-id header required' });
  }

  const { action, campaignId, campaignName, subject, fromEmail, fromName, content, createdBy, templateId } = req.body;

  try {
    if (action === 'create_campaign') {
      const campaign = service.createCampaign(
        organizationId,
        campaignName,
        subject,
        fromEmail,
        fromName,
        content,
        createdBy,
        templateId
      );
      return res.status(201).json(campaign);
    } else if (action === 'update_status') {
      const { status } = req.body;
      const campaign = service.updateCampaignStatus(organizationId, campaignId, status);
      return res.status(200).json(campaign);
    } else if (action === 'add_recipient') {
      const { email, name, variables } = req.body;
      const recipient = service.addRecipient(campaignId, email, name, variables);
      return res.status(201).json(recipient);
    } else if (action === 'send_message') {
      const { recipientEmail, recipientName } = req.body;
      const message = service.sendMessage(
        organizationId,
        campaignId,
        recipientEmail,
        recipientName,
        subject,
        content
      );
      return res.status(201).json(message);
    } else if (action === 'create_template') {
      const { templateName, category, variables } = req.body;
      const template = service.createTemplate(organizationId, templateName, subject, content, variables, category);
      return res.status(201).json(template);
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

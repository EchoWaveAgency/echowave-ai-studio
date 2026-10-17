import { EmailService } from '../../domains/integrations/services/EmailService';

const service = new EmailService();

export default async function handler(req: any, res: any) {
  const { 'x-organization-id': organizationId } = req.headers;

  if (!organizationId) {
    return res.status(400).json({ error: 'x-organization-id header required' });
  }

  const { campaignId, messageId, templateId, status, limit = 50, offset = 0 } = req.query;

  try {
    if (messageId) {
      const message = service.getMessageById(organizationId, messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      return res.status(200).json(message);
    }

    if (campaignId) {
      const campaign = service.getCampaignById(organizationId, campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const messages = service.getCampaignMessages(
        organizationId,
        campaignId,
        parseInt(limit),
        parseInt(offset)
      );
      return res.status(200).json({ campaign, messages });
    }

    if (templateId) {
      const template = service.getTemplateById(organizationId, templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      return res.status(200).json(template);
    }

    if (status) {
      const campaigns = service.getCampaignsByStatus(
        organizationId,
        status,
        parseInt(limit),
        parseInt(offset)
      );
      return res.status(200).json(campaigns);
    }

    const campaigns = service.getOrganizationCampaigns(
      organizationId,
      parseInt(limit),
      parseInt(offset)
    );
    return res.status(200).json(campaigns);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

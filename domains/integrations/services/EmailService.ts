import { v4 as uuidv4 } from 'uuid';
import {
  EmailCampaign,
  EmailMessage,
  EmailTemplate,
  EmailRecipient,
  EmailCampaignStatus,
  EmailMessageStatus,
} from '../models';

export class EmailService {
  private campaignStorage = new Map<string, EmailCampaign>();
  private messageStorage = new Map<string, EmailMessage>();
  private templateStorage = new Map<string, EmailTemplate>();
  private recipientStorage = new Map<string, EmailRecipient>();

  createCampaign(
    organizationId: string,
    campaignName: string,
    subject: string,
    fromEmail: string,
    fromName: string,
    content: string,
    createdBy: string,
    templateId?: string,
    metadata?: Record<string, any>
  ): EmailCampaign {
    const campaignId = uuidv4();
    const campaign: EmailCampaign = {
      id: campaignId,
      organizationId,
      campaignName,
      subject,
      fromEmail,
      fromName,
      content,
      templateId,
      recipientCount: 0,
      sentCount: 0,
      openedCount: 0,
      clickedCount: 0,
      bouncedCount: 0,
      status: EmailCampaignStatus.DRAFT,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: metadata || {},
    };

    this.campaignStorage.set(campaignId, campaign);
    return campaign;
  }

  getCampaignById(organizationId: string, campaignId: string): EmailCampaign | null {
    const campaign = this.campaignStorage.get(campaignId);
    if (!campaign || campaign.organizationId !== organizationId) {
      return null;
    }
    return campaign;
  }

  getOrganizationCampaigns(
    organizationId: string,
    limit: number = 20,
    offset: number = 0
  ): EmailCampaign[] {
    return Array.from(this.campaignStorage.values())
      .filter((c) => c.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  getCampaignsByStatus(
    organizationId: string,
    status: EmailCampaignStatus,
    limit: number = 20,
    offset: number = 0
  ): EmailCampaign[] {
    return Array.from(this.campaignStorage.values())
      .filter((c) => c.organizationId === organizationId && c.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  updateCampaignStatus(
    organizationId: string,
    campaignId: string,
    status: EmailCampaignStatus
  ): EmailCampaign | null {
    const campaign = this.campaignStorage.get(campaignId);
    if (!campaign || campaign.organizationId !== organizationId) {
      return null;
    }

    campaign.status = status;
    if (status === EmailCampaignStatus.SCHEDULED) {
      campaign.scheduledAt = new Date();
    } else if (status === EmailCampaignStatus.SENDING) {
      // Sending already scheduled
    } else if (status === EmailCampaignStatus.SENT) {
      campaign.sentAt = new Date();
    }
    campaign.updatedAt = new Date();

    this.campaignStorage.set(campaignId, campaign);
    return campaign;
  }

  addRecipient(
    campaignId: string,
    email: string,
    name: string,
    variables: Record<string, string> = {}
  ): EmailRecipient {
    const recipientId = uuidv4();
    const recipient: EmailRecipient = {
      id: recipientId,
      campaignId,
      email,
      name,
      variables,
      status: EmailMessageStatus.PENDING,
      addedAt: new Date(),
    };

    this.recipientStorage.set(recipientId, recipient);

    // Update campaign recipient count
    const campaign = this.campaignStorage.get(campaignId);
    if (campaign) {
      campaign.recipientCount++;
      this.campaignStorage.set(campaignId, campaign);
    }

    return recipient;
  }

  sendMessage(
    organizationId: string,
    campaignId: string,
    recipientEmail: string,
    recipientName: string,
    subject: string,
    content: string,
    metadata?: Record<string, any>
  ): EmailMessage {
    const messageId = uuidv4();
    const message: EmailMessage = {
      id: messageId,
      organizationId,
      campaignId,
      recipientEmail,
      recipientName,
      subject,
      content,
      status: EmailMessageStatus.SENT,
      sentAt: new Date(),
      metadata: metadata || {},
    };

    this.messageStorage.set(messageId, message);

    // Update campaign sent count
    const campaign = this.campaignStorage.get(campaignId);
    if (campaign) {
      campaign.sentCount++;
      this.campaignStorage.set(campaignId, campaign);
    }

    return message;
  }

  getMessageById(organizationId: string, messageId: string): EmailMessage | null {
    const message = this.messageStorage.get(messageId);
    if (!message || message.organizationId !== organizationId) {
      return null;
    }
    return message;
  }

  getCampaignMessages(
    organizationId: string,
    campaignId: string,
    limit: number = 100,
    offset: number = 0
  ): EmailMessage[] {
    return Array.from(this.messageStorage.values())
      .filter((m) => m.organizationId === organizationId && m.campaignId === campaignId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(offset, offset + limit);
  }

  updateMessageStatus(
    organizationId: string,
    messageId: string,
    status: EmailMessageStatus,
    bounceType?: 'SOFT' | 'HARD' | 'COMPLAINT'
  ): EmailMessage | null {
    const message = this.messageStorage.get(messageId);
    if (!message || message.organizationId !== organizationId) {
      return null;
    }

    message.status = status;
    if (status === EmailMessageStatus.OPENED) {
      message.openedAt = new Date();
      if (message.campaignId) {
        const campaign = this.campaignStorage.get(message.campaignId);
        if (campaign) {
          campaign.openedCount++;
          this.campaignStorage.set(message.campaignId, campaign);
        }
      }
    } else if (status === EmailMessageStatus.CLICKED) {
      message.clickedAt = new Date();
      if (message.campaignId) {
        const campaign = this.campaignStorage.get(message.campaignId);
        if (campaign) {
          campaign.clickedCount++;
          this.campaignStorage.set(message.campaignId, campaign);
        }
      }
    } else if (status === EmailMessageStatus.BOUNCED) {
      message.bouncedAt = new Date();
      message.bounceType = bounceType;
      if (message.campaignId) {
        const campaign = this.campaignStorage.get(message.campaignId);
        if (campaign) {
          campaign.bouncedCount++;
          this.campaignStorage.set(message.campaignId, campaign);
        }
      }
    }

    this.messageStorage.set(messageId, message);
    return message;
  }

  createTemplate(
    organizationId: string,
    templateName: string,
    subject: string,
    content: string,
    variables: string[],
    category: 'TRANSACTIONAL' | 'MARKETING' | 'NOTIFICATION' = 'MARKETING'
  ): EmailTemplate {
    const templateId = uuidv4();
    const template: EmailTemplate = {
      id: templateId,
      organizationId,
      templateName,
      subject,
      content,
      variables,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    this.templateStorage.set(templateId, template);
    return template;
  }

  getTemplateById(organizationId: string, templateId: string): EmailTemplate | null {
    const template = this.templateStorage.get(templateId);
    if (!template || template.organizationId !== organizationId) {
      return null;
    }
    return template;
  }

  getOrganizationTemplates(
    organizationId: string,
    limit: number = 20,
    offset: number = 0
  ): EmailTemplate[] {
    return Array.from(this.templateStorage.values())
      .filter((t) => t.organizationId === organizationId && t.isActive)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(offset, offset + limit);
  }

  updateTemplate(
    organizationId: string,
    templateId: string,
    templateName: string,
    subject: string,
    content: string
  ): EmailTemplate | null {
    const template = this.templateStorage.get(templateId);
    if (!template || template.organizationId !== organizationId) {
      return null;
    }

    template.templateName = templateName;
    template.subject = subject;
    template.content = content;
    template.updatedAt = new Date();
    this.templateStorage.set(templateId, template);

    return template;
  }

  deleteTemplate(organizationId: string, templateId: string): boolean {
    const template = this.templateStorage.get(templateId);
    if (!template || template.organizationId !== organizationId) {
      return false;
    }

    template.isActive = false;
    template.updatedAt = new Date();
    this.templateStorage.set(templateId, template);

    return true;
  }

  getCampaignStats(organizationId: string, campaignId: string): {
    recipientCount: number;
    sentCount: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  } {
    const campaign = this.campaignStorage.get(campaignId);
    if (!campaign || campaign.organizationId !== organizationId) {
      return { recipientCount: 0, sentCount: 0, openRate: 0, clickRate: 0, bounceRate: 0 };
    }

    const sentCount = campaign.sentCount || 1;
    return {
      recipientCount: campaign.recipientCount,
      sentCount: campaign.sentCount,
      openRate: Math.round((campaign.openedCount / sentCount) * 100),
      clickRate: Math.round((campaign.clickedCount / sentCount) * 100),
      bounceRate: Math.round((campaign.bouncedCount / sentCount) * 100),
    };
  }

  getOrganizationStats(organizationId: string): {
    totalCampaigns: number;
    totalMessages: number;
    totalOpens: number;
    totalClicks: number;
    averageOpenRate: number;
  } {
    const campaigns = Array.from(this.campaignStorage.values()).filter(
      (c) => c.organizationId === organizationId
    );
    const totalMessages = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    const totalOpens = campaigns.reduce((sum, c) => sum + c.openedCount, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clickedCount, 0);
    const avgOpenRate = totalMessages > 0 ? Math.round((totalOpens / totalMessages) * 100) : 0;

    return {
      totalCampaigns: campaigns.length,
      totalMessages,
      totalOpens,
      totalClicks,
      averageOpenRate: avgOpenRate,
    };
  }

  getUndeliveredMessages(
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): EmailMessage[] {
    return Array.from(this.messageStorage.values())
      .filter((m) => m.organizationId === organizationId && m.status === EmailMessageStatus.PENDING)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())
      .slice(offset, offset + limit);
  }

  getBounceReport(
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): EmailMessage[] {
    return Array.from(this.messageStorage.values())
      .filter((m) => m.organizationId === organizationId && m.status === EmailMessageStatus.BOUNCED)
      .sort((a, b) => b.bouncedAt!.getTime() - a.bouncedAt!.getTime())
      .slice(offset, offset + limit);
  }
}

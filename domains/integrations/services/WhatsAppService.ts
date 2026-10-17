import { v4 as uuidv4 } from 'uuid';
import {
  WhatsAppMessage,
  WhatsAppTemplate,
  WhatsAppConversation,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
} from '../models';

export class WhatsAppService {
  private messageStorage = new Map<string, WhatsAppMessage>();
  private templateStorage = new Map<string, WhatsAppTemplate>();
  private conversationStorage = new Map<string, WhatsAppConversation>();

  sendMessage(
    organizationId: string,
    conversationId: string,
    contactPhone: string,
    messageType: WhatsAppMessageType,
    content: string,
    mediaUrl?: string,
    templateName?: string,
    metadata?: Record<string, any>
  ): WhatsAppMessage {
    const messageId = uuidv4();
    const message: WhatsAppMessage = {
      id: messageId,
      organizationId,
      conversationId,
      contactPhone,
      messageType,
      content,
      status: WhatsAppMessageStatus.PENDING,
      sentAt: new Date(),
      mediaUrl,
      templateName,
      metadata: metadata || {},
    };

    this.messageStorage.set(messageId, message);
    this.updateConversationLastMessage(organizationId, conversationId, contactPhone);

    return message;
  }

  getMessageById(organizationId: string, messageId: string): WhatsAppMessage | null {
    const message = this.messageStorage.get(messageId);
    if (!message || message.organizationId !== organizationId) {
      return null;
    }
    return message;
  }

  getConversationMessages(
    organizationId: string,
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): WhatsAppMessage[] {
    return Array.from(this.messageStorage.values())
      .filter(
        (m) =>
          m.organizationId === organizationId &&
          m.conversationId === conversationId
      )
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(offset, offset + limit);
  }

  updateMessageStatus(
    organizationId: string,
    messageId: string,
    status: WhatsAppMessageStatus,
    externalMessageId?: string
  ): WhatsAppMessage | null {
    const message = this.messageStorage.get(messageId);
    if (!message || message.organizationId !== organizationId) {
      return null;
    }

    message.status = status;
    if (externalMessageId) {
      message.externalMessageId = externalMessageId;
    }

    if (status === WhatsAppMessageStatus.DELIVERED) {
      message.deliveredAt = new Date();
    } else if (status === WhatsAppMessageStatus.READ) {
      message.readAt = new Date();
    } else if (status === WhatsAppMessageStatus.FAILED) {
      message.failureReason = 'Message delivery failed';
    }

    this.messageStorage.set(messageId, message);
    return message;
  }

  createTemplate(
    organizationId: string,
    templateName: string,
    content: string,
    variables: string[],
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' = 'MARKETING',
    language: string = 'en'
  ): WhatsAppTemplate {
    const templateId = uuidv4();
    const template: WhatsAppTemplate = {
      id: templateId,
      organizationId,
      templateName,
      content,
      variables,
      category,
      language,
      status: 'PENDING_REVIEW',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templateStorage.set(templateId, template);
    return template;
  }

  getTemplateById(organizationId: string, templateId: string): WhatsAppTemplate | null {
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
  ): WhatsAppTemplate[] {
    return Array.from(this.templateStorage.values())
      .filter((t) => t.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(offset, offset + limit);
  }

  approveTemplate(organizationId: string, templateId: string): WhatsAppTemplate | null {
    const template = this.templateStorage.get(templateId);
    if (!template || template.organizationId !== organizationId) {
      return null;
    }

    template.status = 'APPROVED';
    template.updatedAt = new Date();
    this.templateStorage.set(templateId, template);

    return template;
  }

  rejectTemplate(organizationId: string, templateId: string): WhatsAppTemplate | null {
    const template = this.templateStorage.get(templateId);
    if (!template || template.organizationId !== organizationId) {
      return null;
    }

    template.status = 'REJECTED';
    template.updatedAt = new Date();
    this.templateStorage.set(templateId, template);

    return template;
  }

  createConversation(
    organizationId: string,
    contactPhone: string,
    contactName: string,
    metadata?: Record<string, any>
  ): WhatsAppConversation {
    const conversationId = uuidv4();
    const conversation: WhatsAppConversation = {
      id: conversationId,
      organizationId,
      contactPhone,
      contactName,
      status: 'ACTIVE',
      lastMessageAt: new Date(),
      messageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: metadata || {},
    };

    this.conversationStorage.set(conversationId, conversation);
    return conversation;
  }

  getConversationById(organizationId: string, conversationId: string): WhatsAppConversation | null {
    const conversation = this.conversationStorage.get(conversationId);
    if (!conversation || conversation.organizationId !== organizationId) {
      return null;
    }
    return conversation;
  }

  getOrganizationConversations(
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): WhatsAppConversation[] {
    return Array.from(this.conversationStorage.values())
      .filter((c) => c.organizationId === organizationId)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
      .slice(offset, offset + limit);
  }

  updateConversationStatus(
    organizationId: string,
    conversationId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  ): WhatsAppConversation | null {
    const conversation = this.conversationStorage.get(conversationId);
    if (!conversation || conversation.organizationId !== organizationId) {
      return null;
    }

    conversation.status = status;
    conversation.updatedAt = new Date();
    this.conversationStorage.set(conversationId, conversation);

    return conversation;
  }

  private updateConversationLastMessage(
    organizationId: string,
    conversationId: string,
    contactPhone: string
  ): void {
    let conversation = this.conversationStorage.get(conversationId);

    if (!conversation) {
      conversation = this.createConversation(organizationId, contactPhone, contactPhone);
    }

    conversation.lastMessageAt = new Date();
    conversation.messageCount++;
    this.conversationStorage.set(conversationId, conversation);
  }

  getConversationStats(organizationId: string): {
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
  } {
    const conversations = Array.from(this.conversationStorage.values()).filter(
      (c) => c.organizationId === organizationId
    );
    const messages = Array.from(this.messageStorage.values()).filter(
      (m) => m.organizationId === organizationId
    );

    const activeConversations = conversations.filter((c) => c.status === 'ACTIVE').length;
    const totalMessages = messages.length;
    const avgMessages = conversations.length > 0 ? totalMessages / conversations.length : 0;

    return {
      totalConversations: conversations.length,
      activeConversations,
      totalMessages,
      averageMessagesPerConversation: Math.round(avgMessages),
    };
  }

  getMessageDeliveryStatus(organizationId: string): {
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  } {
    const messages = Array.from(this.messageStorage.values()).filter(
      (m) => m.organizationId === organizationId
    );

    return {
      pending: messages.filter((m) => m.status === WhatsAppMessageStatus.PENDING).length,
      sent: messages.filter((m) => m.status === WhatsAppMessageStatus.SENT).length,
      delivered: messages.filter((m) => m.status === WhatsAppMessageStatus.DELIVERED).length,
      read: messages.filter((m) => m.status === WhatsAppMessageStatus.READ).length,
      failed: messages.filter((m) => m.status === WhatsAppMessageStatus.FAILED).length,
    };
  }

  deleteConversation(organizationId: string, conversationId: string): boolean {
    const conversation = this.conversationStorage.get(conversationId);
    if (!conversation || conversation.organizationId !== organizationId) {
      return false;
    }

    this.conversationStorage.delete(conversationId);
    return true;
  }
}

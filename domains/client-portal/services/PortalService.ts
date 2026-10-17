import { v4 as uuidv4 } from 'uuid';

export interface ClientMessage {
  id: string;
  organizationId: string;
  clientAccountId: string;
  fromPortalUserId?: string;
  toPortalUserId?: string;
  threadId: string;
  messageText: string;
  attachmentUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

export interface ClientActivityLog {
  id: string;
  organizationId: string;
  clientAccountId: string;
  portalUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export class PortalService {
  private messageStorage = new Map<string, ClientMessage>();
  private activityLogStorage = new Map<string, ClientActivityLog>();
  private threadIdIndex = new Map<string, string[]>();

  createMessage(
    organizationId: string,
    clientAccountId: string,
    fromPortalUserId: string | undefined,
    toPortalUserId: string | undefined,
    messageText: string,
    threadId?: string,
    attachmentUrls?: string[]
  ): ClientMessage {
    if (!messageText || messageText.trim().length === 0) {
      throw new Error('Message text is required');
    }

    const messageThreadId = threadId || uuidv4();
    const message: ClientMessage = {
      id: uuidv4(),
      organizationId,
      clientAccountId,
      fromPortalUserId,
      toPortalUserId,
      threadId: messageThreadId,
      messageText,
      attachmentUrls: attachmentUrls || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.messageStorage.set(message.id, message);

    if (!this.threadIdIndex.has(messageThreadId)) {
      this.threadIdIndex.set(messageThreadId, []);
    }
    this.threadIdIndex.get(messageThreadId)!.push(message.id);

    return message;
  }

  getMessageById(organizationId: string, messageId: string): ClientMessage | null {
    const message = this.messageStorage.get(messageId);
    if (!message || message.organizationId !== organizationId) {
      return null;
    }
    return message;
  }

  getThreadMessages(
    organizationId: string,
    clientAccountId: string,
    threadId: string,
    limit: number = 50,
    offset: number = 0
  ): ClientMessage[] {
    const messageIds = this.threadIdIndex.get(threadId) || [];
    return messageIds
      .map((id) => this.messageStorage.get(id))
      .filter(
        (msg): msg is ClientMessage =>
          msg !== undefined &&
          msg.organizationId === organizationId &&
          msg.clientAccountId === clientAccountId
      )
      .slice(offset, offset + limit);
  }

  getClientThreads(
    organizationId: string,
    clientAccountId: string,
    limit: number = 20,
    offset: number = 0
  ): Array<{ threadId: string; latestMessage: ClientMessage; messageCount: number }> {
    const threads = new Map<string, ClientMessage[]>();

    Array.from(this.messageStorage.values())
      .filter(
        (msg) =>
          msg.organizationId === organizationId && msg.clientAccountId === clientAccountId
      )
      .forEach((msg) => {
        if (!threads.has(msg.threadId)) {
          threads.set(msg.threadId, []);
        }
        threads.get(msg.threadId)!.push(msg);
      });

    const threadList = Array.from(threads.entries())
      .map(([threadId, messages]) => {
        const sorted = messages.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        return {
          threadId,
          latestMessage: sorted[0],
          messageCount: messages.length,
        };
      })
      .sort((a, b) => b.latestMessage.createdAt.getTime() - a.latestMessage.createdAt.getTime())
      .slice(offset, offset + limit);

    return threadList;
  }

  markMessageAsRead(organizationId: string, messageId: string): ClientMessage | null {
    const message = this.messageStorage.get(messageId);
    if (!message || message.organizationId !== organizationId) {
      return null;
    }

    message.readAt = new Date();
    message.updatedAt = new Date();
    this.messageStorage.set(messageId, message);

    return message;
  }

  recordActivityLog(
    organizationId: string,
    clientAccountId: string,
    portalUserId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): ClientActivityLog {
    const log: ClientActivityLog = {
      id: uuidv4(),
      organizationId,
      clientAccountId,
      portalUserId,
      action,
      resourceType,
      resourceId,
      metadata: metadata || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };

    this.activityLogStorage.set(log.id, log);
    return log;
  }

  getActivityLogs(
    organizationId: string,
    clientAccountId: string,
    limit: number = 100,
    offset: number = 0
  ): ClientActivityLog[] {
    return Array.from(this.activityLogStorage.values())
      .filter(
        (log) =>
          log.organizationId === organizationId && log.clientAccountId === clientAccountId
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  getActivityLogsByPortalUser(
    organizationId: string,
    clientAccountId: string,
    portalUserId: string,
    limit: number = 50,
    offset: number = 0
  ): ClientActivityLog[] {
    return Array.from(this.activityLogStorage.values())
      .filter(
        (log) =>
          log.organizationId === organizationId &&
          log.clientAccountId === clientAccountId &&
          log.portalUserId === portalUserId
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  getActivityLogsByResource(
    organizationId: string,
    clientAccountId: string,
    resourceType: string,
    resourceId: string,
    limit: number = 50,
    offset: number = 0
  ): ClientActivityLog[] {
    return Array.from(this.activityLogStorage.values())
      .filter(
        (log) =>
          log.organizationId === organizationId &&
          log.clientAccountId === clientAccountId &&
          log.resourceType === resourceType &&
          log.resourceId === resourceId
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  getUnreadMessageCount(
    organizationId: string,
    clientAccountId: string,
    portalUserId: string
  ): number {
    return Array.from(this.messageStorage.values()).filter(
      (msg) =>
        msg.organizationId === organizationId &&
        msg.clientAccountId === clientAccountId &&
        msg.toPortalUserId === portalUserId &&
        !msg.readAt
    ).length;
  }

  deleteMessage(organizationId: string, messageId: string): boolean {
    const message = this.messageStorage.get(messageId);
    if (!message || message.organizationId !== organizationId) {
      return false;
    }

    this.messageStorage.delete(messageId);
    const threadMessages = this.threadIdIndex.get(message.threadId) || [];
    const idx = threadMessages.indexOf(messageId);
    if (idx > -1) {
      threadMessages.splice(idx, 1);
    }

    return true;
  }

  deleteActivityLog(organizationId: string, logId: string): boolean {
    const log = this.activityLogStorage.get(logId);
    if (!log || log.organizationId !== organizationId) {
      return false;
    }

    this.activityLogStorage.delete(logId);
    return true;
  }
}

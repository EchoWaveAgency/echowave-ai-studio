import { v4 as uuidv4 } from 'uuid';
import { DocumentSharingLink, ReminderNotification } from '../models';

export class SharingService {
  private sharingLinkStorage = new Map<string, DocumentSharingLink>();
  private reminderStorage = new Map<string, ReminderNotification>();

  createSharingLink(
    documentId: string,
    createdBy: string,
    accessLevel: 'view' | 'sign' | 'comment',
    expiresAt: Date,
    passwordProtected: boolean = false,
    passwordHash?: string,
    sharedWith?: string[],
    maxDownloads?: number
  ): DocumentSharingLink {
    const token = this.generateToken(32);
    const link: DocumentSharingLink = {
      id: uuidv4(),
      documentId,
      createdBy,
      createdAt: new Date(),
      expiresAt,
      token,
      accessLevel,
      maxDownloads,
      downloadCount: 0,
      sharedWith: sharedWith || [],
      passwordProtected,
      passwordHash,
      isActive: true,
    };

    this.sharingLinkStorage.set(link.id, link);
    return link;
  }

  getSharingLinkByToken(token: string): DocumentSharingLink | null {
    const link = Array.from(this.sharingLinkStorage.values()).find((l) => l.token === token);
    if (!link || !link.isActive || new Date() > link.expiresAt) {
      return null;
    }

    if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
      return null;
    }

    return link;
  }

  getSharingLinksForDocument(
    documentId: string,
    limit: number = 20,
    offset: number = 0
  ): DocumentSharingLink[] {
    return Array.from(this.sharingLinkStorage.values())
      .filter((l) => l.documentId === documentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  recordDownload(linkId: string): boolean {
    const link = this.sharingLinkStorage.get(linkId);
    if (!link) {
      return false;
    }

    if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
      return false;
    }

    link.downloadCount++;
    this.sharingLinkStorage.set(linkId, link);

    return true;
  }

  validatePassword(linkId: string, providedPassword: string): boolean {
    const link = this.sharingLinkStorage.get(linkId);
    if (!link || !link.passwordProtected || !link.passwordHash) {
      return true;
    }

    return this.hashPassword(providedPassword) === link.passwordHash;
  }

  disableSharingLink(linkId: string): DocumentSharingLink | null {
    const link = this.sharingLinkStorage.get(linkId);
    if (!link) {
      return null;
    }

    link.isActive = false;
    this.sharingLinkStorage.set(linkId, link);

    return link;
  }

  updateExpirationDate(linkId: string, newExpiresAt: Date): DocumentSharingLink | null {
    const link = this.sharingLinkStorage.get(linkId);
    if (!link) {
      return null;
    }

    link.expiresAt = newExpiresAt;
    this.sharingLinkStorage.set(linkId, link);

    return link;
  }

  addRecipientToLink(linkId: string, recipientEmail: string): DocumentSharingLink | null {
    const link = this.sharingLinkStorage.get(linkId);
    if (!link) {
      return null;
    }

    if (!link.sharedWith) {
      link.sharedWith = [];
    }

    if (!link.sharedWith.includes(recipientEmail)) {
      link.sharedWith.push(recipientEmail);
    }

    this.sharingLinkStorage.set(linkId, link);

    return link;
  }

  createReminder(
    documentId: string,
    signatoryId: string,
    reminderType: 'initial' | 'follow_up' | 'escalation',
    channel: 'email' | 'sms' | 'in_app'
  ): ReminderNotification {
    const reminder: ReminderNotification = {
      id: uuidv4(),
      documentId,
      signatoryId,
      reminderType,
      sentAt: new Date(),
      status: 'sent',
      channel,
    };

    this.reminderStorage.set(reminder.id, reminder);
    return reminder;
  }

  getRemindersByDocument(documentId: string, limit: number = 50, offset: number = 0): ReminderNotification[] {
    return Array.from(this.reminderStorage.values())
      .filter((r) => r.documentId === documentId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(offset, offset + limit);
  }

  getRemindersBySignatory(signatoryId: string, limit: number = 50, offset: number = 0): ReminderNotification[] {
    return Array.from(this.reminderStorage.values())
      .filter((r) => r.signatoryId === signatoryId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(offset, offset + limit);
  }

  markReminderAsOpened(reminderId: string): ReminderNotification | null {
    const reminder = this.reminderStorage.get(reminderId);
    if (!reminder) {
      return null;
    }

    reminder.status = 'opened';
    reminder.openedAt = new Date();

    this.reminderStorage.set(reminderId, reminder);

    return reminder;
  }

  scheduleNextReminder(
    reminderId: string,
    daysFromNow: number
  ): ReminderNotification | null {
    const reminder = this.reminderStorage.get(reminderId);
    if (!reminder) {
      return null;
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysFromNow);

    reminder.nextReminderAt = nextDate;

    this.reminderStorage.set(reminderId, reminder);

    return reminder;
  }

  getPendingReminders(limit: number = 50, offset: number = 0): ReminderNotification[] {
    const now = new Date();

    return Array.from(this.reminderStorage.values())
      .filter((r) => r.nextReminderAt && r.nextReminderAt <= now && r.status === 'sent')
      .sort((a, b) => (a.nextReminderAt!.getTime() - b.nextReminderAt!.getTime()))
      .slice(offset, offset + limit);
  }

  deleteSharingLink(linkId: string): boolean {
    const link = this.sharingLinkStorage.get(linkId);
    if (!link) {
      return false;
    }

    this.sharingLinkStorage.delete(linkId);
    return true;
  }

  getAccessStatistics(documentId: string): {
    totalLinks: number;
    activeLinks: number;
    totalDownloads: number;
    totalReminders: number;
    mostUsedAccessLevel: string;
  } {
    const links = this.getSharingLinksForDocument(documentId, 1000, 0);
    const reminders = this.getRemindersByDocument(documentId, 1000, 0);

    const activeLinks = links.filter((l) => l.isActive && new Date() <= l.expiresAt).length;
    const totalDownloads = links.reduce((sum, l) => sum + l.downloadCount, 0);

    const accessLevelCounts = links.reduce(
      (acc, l) => {
        acc[l.accessLevel] = (acc[l.accessLevel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostUsedAccessLevel = Object.entries(accessLevelCounts).sort(
      ([, countA], [, countB]) => countB - countA
    )[0]?.[0] || 'view';

    return {
      totalLinks: links.length,
      activeLinks,
      totalDownloads,
      totalReminders: reminders.length,
      mostUsedAccessLevel,
    };
  }

  private generateToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

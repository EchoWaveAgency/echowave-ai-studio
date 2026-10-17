import {
  ClientAccount,
  ClientAccountStatus,
  PortalUser,
  PortalAccessLevel,
  PortalPermission,
  NotificationPreference,
  NotificationType,
  NotificationChannel,
} from "../models/index";

export class ClientAccountService {
  private accounts = new Map<string, ClientAccount>();
  private users = new Map<string, PortalUser>();
  private permissions = new Map<string, PortalPermission>();
  private accountIdCounter = 1;
  private userIdCounter = 1;
  private permissionIdCounter = 1;

  // Create Client Account
  createClientAccount(
    organizationId: string,
    data: {
      clientId: string;
      companyName: string;
      primaryContactName: string;
      primaryContactEmail: string;
      primaryContactPhone?: string;
      customDomain?: string;
    }
  ): ClientAccount {
    if (!data.clientId || !data.companyName || !data.primaryContactEmail) {
      throw new Error("clientId, companyName, and primaryContactEmail are required");
    }

    const account: ClientAccount = {
      id: `client_acc_${organizationId}_${this.accountIdCounter++}`,
      organization_id: organizationId,
      client_id: data.clientId,
      company_name: data.companyName,
      primary_contact_name: data.primaryContactName,
      primary_contact_email: data.primaryContactEmail,
      primary_contact_phone: data.primaryContactPhone,
      status: ClientAccountStatus.PENDING,
      portal_url: this.generatePortalUrl(data.customDomain || data.companyName),
      custom_domain: data.customDomain,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.accounts.set(account.id, account);
    return account;
  }

  // Get Client Account
  getClientAccountById(organizationId: string, accountId: string): ClientAccount {
    const account = this.accounts.get(accountId);
    if (!account || account.organization_id !== organizationId) {
      throw new Error("Client account not found");
    }
    return account;
  }

  // Get Organization Client Accounts
  getOrganizationClientAccounts(organizationId: string, filters?: {
    status?: ClientAccountStatus;
    limit?: number;
    offset?: number;
  }): ClientAccount[] {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    let accounts = Array.from(this.accounts.values()).filter(
      (a) => a.organization_id === organizationId
    );

    if (filters?.status) {
      accounts = accounts.filter((a) => a.status === filters.status);
    }

    return accounts.slice(offset, offset + limit);
  }

  // Activate Client Account
  activateClientAccount(organizationId: string, accountId: string): ClientAccount {
    const account = this.getClientAccountById(organizationId, accountId);
    account.status = ClientAccountStatus.ACTIVE;
    account.updated_at = new Date();
    return account;
  }

  // Suspend Client Account
  suspendClientAccount(organizationId: string, accountId: string): ClientAccount {
    const account = this.getClientAccountById(organizationId, accountId);
    account.status = ClientAccountStatus.SUSPENDED;
    account.updated_at = new Date();
    return account;
  }

  // Update Account Theme
  updateAccountTheme(organizationId: string, accountId: string, logoUrl?: string, themeColor?: string): ClientAccount {
    const account = this.getClientAccountById(organizationId, accountId);
    if (logoUrl) account.logo_url = logoUrl;
    if (themeColor) account.theme_color = themeColor;
    account.updated_at = new Date();
    return account;
  }

  // Create Portal User
  createPortalUser(
    organizationId: string,
    accountId: string,
    data: {
      name: string;
      email: string;
      phone?: string;
      accessLevel?: PortalAccessLevel;
      isPrimaryContact?: boolean;
    }
  ): PortalUser {
    const account = this.getClientAccountById(organizationId, accountId);

    if (!data.name || !data.email) {
      throw new Error("name and email are required");
    }

    const user: PortalUser = {
      id: `portal_user_${accountId}_${this.userIdCounter++}`,
      organization_id: organizationId,
      client_account_id: accountId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      access_level: data.accessLevel || PortalAccessLevel.VIEWER,
      is_primary_contact: data.isPrimaryContact || false,
      created_at: new Date(),
      updated_at: new Date(),
      two_factor_enabled: false,
      notification_preferences: this.getDefaultNotificationPreferences(),
      permissions: [],
    };

    this.users.set(user.id, user);
    return user;
  }

  // Get Portal User
  getPortalUserById(organizationId: string, userId: string): PortalUser {
    const user = this.users.get(userId);
    if (!user || user.organization_id !== organizationId) {
      throw new Error("Portal user not found");
    }
    return user;
  }

  // Get Client Account Users
  getClientAccountUsers(organizationId: string, accountId: string): PortalUser[] {
    const account = this.getClientAccountById(organizationId, accountId);
    return Array.from(this.users.values()).filter(
      (u) => u.client_account_id === accountId
    );
  }

  // Update User Access Level
  updateUserAccessLevel(organizationId: string, userId: string, accessLevel: PortalAccessLevel): PortalUser {
    const user = this.getPortalUserById(organizationId, userId);
    user.access_level = accessLevel;
    user.updated_at = new Date();
    return user;
  }

  // Grant Permission
  grantPermission(
    organizationId: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    permissionLevel: string,
    grantedBy: string
  ): PortalPermission {
    const user = this.getPortalUserById(organizationId, userId);

    const permission: PortalPermission = {
      id: `perm_${userId}_${this.permissionIdCounter++}`,
      portal_user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      permission_level: permissionLevel,
      granted_at: new Date(),
      granted_by: grantedBy,
    };

    this.permissions.set(permission.id, permission);
    user.permissions.push(permission);
    return permission;
  }

  // Revoke Permission
  revokePermission(organizationId: string, permissionId: string): void {
    const permission = this.permissions.get(permissionId);
    if (!permission) {
      throw new Error("Permission not found");
    }

    const user = this.users.get(permission.portal_user_id);
    if (user) {
      user.permissions = user.permissions.filter((p) => p.id !== permissionId);
    }

    this.permissions.delete(permissionId);
  }

  // Get User Permissions
  getUserPermissions(organizationId: string, userId: string): PortalPermission[] {
    const user = this.getPortalUserById(organizationId, userId);
    return user.permissions;
  }

  // Check Permission
  hasPermission(
    organizationId: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    requiredLevel: string
  ): boolean {
    const user = this.getPortalUserById(organizationId, userId);

    const permission = user.permissions.find(
      (p) => p.resource_type === resourceType && p.resource_id === resourceId
    );

    if (!permission) return false;

    const levels = ["view", "comment", "approve", "edit"];
    const userLevel = levels.indexOf(permission.permission_level);
    const requiredIndex = levels.indexOf(requiredLevel);

    return userLevel >= requiredIndex;
  }

  // Update Notification Preferences
  updateNotificationPreference(
    organizationId: string,
    userId: string,
    notificationType: NotificationType,
    channels: NotificationChannel[],
    frequency: string,
    enabled: boolean
  ): PortalUser {
    const user = this.getPortalUserById(organizationId, userId);

    let preference = user.notification_preferences.find(
      (p) => p.notification_type === notificationType
    );

    if (!preference) {
      preference = {
        id: `notif_pref_${userId}_${notificationType}`,
        portal_user_id: userId,
        notification_type: notificationType,
        channels: [],
        frequency: "instant",
        enabled: true,
      };
      user.notification_preferences.push(preference);
    }

    preference.channels = channels;
    preference.frequency = frequency as any;
    preference.enabled = enabled;

    user.updated_at = new Date();
    return user;
  }

  // Get User Notification Preferences
  getUserNotificationPreferences(organizationId: string, userId: string): NotificationPreference[] {
    const user = this.getPortalUserById(organizationId, userId);
    return user.notification_preferences;
  }

  // Record Last Login
  recordLastLogin(organizationId: string, userId: string): PortalUser {
    const user = this.getPortalUserById(organizationId, userId);
    user.last_login = new Date();
    return user;
  }

  // Record Account Last Login
  recordAccountLastLogin(organizationId: string, accountId: string): ClientAccount {
    const account = this.getClientAccountById(organizationId, accountId);
    account.last_login = new Date();
    return account;
  }

  // Delete Portal User
  deletePortalUser(organizationId: string, userId: string): void {
    const user = this.getPortalUserById(organizationId, userId);
    
    // Remove all permissions
    user.permissions.forEach((p) => {
      this.permissions.delete(p.id);
    });

    this.users.delete(userId);
  }

  // Delete Client Account
  deleteClientAccount(organizationId: string, accountId: string): void {
    const account = this.getClientAccountById(organizationId, accountId);

    // Remove all users and their permissions
    const users = Array.from(this.users.values()).filter(
      (u) => u.client_account_id === accountId
    );

    users.forEach((user) => {
      user.permissions.forEach((p) => {
        this.permissions.delete(p.id);
      });
      this.users.delete(user.id);
    });

    this.accounts.delete(accountId);
  }

  // Get Account Summary
  getAccountSummary(organizationId: string, accountId: string): {
    account: ClientAccount;
    userCount: number;
    activeUsers: number;
    permissionCount: number;
  } {
    const account = this.getClientAccountById(organizationId, accountId);
    const users = Array.from(this.users.values()).filter(
      (u) => u.client_account_id === accountId
    );
    const permissions = Array.from(this.permissions.values()).filter(
      (p) => users.some((u) => u.id === p.portal_user_id)
    );

    return {
      account,
      userCount: users.length,
      activeUsers: users.filter((u) => u.last_login).length,
      permissionCount: permissions.length,
    };
  }

  // Private helpers
  private generatePortalUrl(companyName: string): string {
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `https://portal.echowave.io/${slug}`;
  }

  private getDefaultNotificationPreferences(): NotificationPreference[] {
    const preferences: NotificationPreference[] = [];

    const types: NotificationType[] = [
      NotificationType.PROJECT_UPDATE,
      NotificationType.DELIVERABLE_SUBMITTED,
      NotificationType.APPROVAL_NEEDED,
      NotificationType.MILESTONE_REACHED,
      NotificationType.INVOICE_AVAILABLE,
    ];

    types.forEach((type) => {
      preferences.push({
        id: `notif_pref_${type}`,
        portal_user_id: "",
        notification_type: type,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        frequency: "instant",
        enabled: true,
      });
    });

    return preferences;
  }
}

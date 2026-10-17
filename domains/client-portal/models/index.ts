// Phase 15: Client Portal & Self-Service Models

// Client Account Status
export enum ClientAccountStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  ARCHIVED = "archived",
}

// Portal Access Levels
export enum PortalAccessLevel {
  GUEST = "guest",
  VIEWER = "viewer",
  COLLABORATOR = "collaborator",
  ADMIN = "admin",
}

// Notification Preference Types
export enum NotificationType {
  PROJECT_UPDATE = "project_update",
  DELIVERABLE_SUBMITTED = "deliverable_submitted",
  APPROVAL_NEEDED = "approval_needed",
  MESSAGE_RECEIVED = "message_received",
  MILESTONE_REACHED = "milestone_reached",
  INVOICE_AVAILABLE = "invoice_available",
  TEAM_MEMBER_JOINED = "team_member_joined",
}

export enum NotificationChannel {
  EMAIL = "email",
  SMS = "sms",
  IN_APP = "in_app",
  PUSH = "push",
}

// Client Account Model
export interface ClientAccount {
  id: string;
  organization_id: string;
  client_id: string;
  company_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone?: string;
  status: ClientAccountStatus;
  portal_url: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  custom_domain?: string;
  logo_url?: string;
  theme_color?: string;
}

// Portal User
export interface PortalUser {
  id: string;
  organization_id: string;
  client_account_id: string;
  name: string;
  email: string;
  phone?: string;
  access_level: PortalAccessLevel;
  is_primary_contact: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  password_hash?: string;
  two_factor_enabled: boolean;
  notification_preferences: NotificationPreference[];
  permissions: PortalPermission[];
}

// Portal Permissions
export interface PortalPermission {
  id: string;
  portal_user_id: string;
  resource_type: string;
  resource_id: string;
  permission_level: string;
  granted_at: Date;
  granted_by: string;
}

// Notification Preferences
export interface NotificationPreference {
  id: string;
  portal_user_id: string;
  notification_type: NotificationType;
  channels: NotificationChannel[];
  frequency: "instant" | "daily_digest" | "weekly_digest" | "disabled";
  enabled: boolean;
}

// Client Project View
export interface ClientProjectView {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: Date;
  end_date: Date;
  completion_percentage: number;
  timeline_variance: number;
  next_milestone?: {
    name: string;
    target_date: Date;
    status: string;
  };
  team_members: ClientTeamMemberView[];
  deliverables: ClientDeliverableView[];
  documents: ClientDocument[];
  timeline: ClientProjectTimeline[];
}

// Simplified Team Member View
export interface ClientTeamMemberView {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  email?: string;
  is_contact: boolean;
}

// Simplified Deliverable View
export interface ClientDeliverableView {
  id: string;
  name: string;
  type: string;
  status: string;
  due_date: Date;
  completion_date?: Date;
  approval_status: string;
  file_references: ClientFileReference[];
  feedback: ClientFeedback[];
  approval_required: boolean;
  can_approve: boolean;
}

// File Reference with access control
export interface ClientFileReference {
  id: string;
  file_id: string;
  name: string;
  size: number;
  type: string;
  uploaded_at: Date;
  uploaded_by: string;
  access_url: string;
  expires_at: Date;
}

// Client Feedback on Deliverables
export interface ClientFeedback {
  id: string;
  deliverable_id: string;
  portal_user_id: string;
  comment: string;
  status: "pending" | "acknowledged" | "resolved";
  created_at: Date;
  resolved_at?: Date;
  resolved_by?: string;
  file_attachments?: string[];
  mentions?: string[];
}

// Client Document
export interface ClientDocument {
  id: string;
  client_account_id: string;
  title: string;
  description: string;
  category: "contract" | "agreement" | "guide" | "proposal" | "report" | "other";
  file_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: Date;
  uploaded_by: string;
  is_signed: boolean;
  signature_status?: "pending" | "signed" | "declined";
  signed_by?: string;
  signed_at?: Date;
  access_level: PortalAccessLevel;
  expires_at?: Date;
  tags: string[];
  version: number;
  previous_versions?: DocumentVersion[];
}

export interface DocumentVersion {
  version: number;
  file_id: string;
  uploaded_at: Date;
  uploaded_by: string;
  change_summary: string;
}

// Client Invoice View
export interface ClientInvoiceView {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  issued_date: Date;
  due_date: Date;
  paid_date?: Date;
  description: string;
  line_items: InvoiceLineItem[];
  payment_terms: string;
  payment_methods: PaymentMethodOption[];
  documents: ClientFileReference[];
  viewed_at?: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  project_id?: string;
  phase_id?: string;
}

export interface PaymentMethodOption {
  method: "credit_card" | "bank_transfer" | "check" | "paypal" | "stripe";
  display_name: string;
  details?: Record<string, unknown>;
}

// Project Timeline Event
export interface ClientProjectTimeline {
  id: string;
  date: Date;
  type: string;
  title: string;
  description: string;
  milestone_name?: string;
  deliverable_name?: string;
  is_completed: boolean;
  color?: string;
}

// Feedback Request
export interface FeedbackRequest {
  id: string;
  client_account_id: string;
  deliverable_id: string;
  requested_by: string;
  request_date: Date;
  due_date: Date;
  status: "pending" | "completed" | "overdue";
  feedback?: ClientFeedback;
  reminder_sent: boolean;
  reminder_sent_at?: Date;
  required_participants?: string[];
  completed_by?: string[];
}

// Client Communication
export interface ClientMessage {
  id: string;
  client_account_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: "team" | "client";
  content: string;
  attachments?: string[];
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
  thread_id?: string;
  mentions?: string[];
}

// Client Activity Log
export interface ClientActivityLog {
  id: string;
  organization_id: string;
  client_account_id: string;
  portal_user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: Date;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
}

// Constants
export const CLIENT_ACCOUNT_STATUSES = [
  ClientAccountStatus.PENDING,
  ClientAccountStatus.ACTIVE,
  ClientAccountStatus.SUSPENDED,
  ClientAccountStatus.ARCHIVED,
];

export const PORTAL_ACCESS_LEVELS = [
  PortalAccessLevel.GUEST,
  PortalAccessLevel.VIEWER,
  PortalAccessLevel.COLLABORATOR,
  PortalAccessLevel.ADMIN,
];

export const NOTIFICATION_TYPES = [
  NotificationType.PROJECT_UPDATE,
  NotificationType.DELIVERABLE_SUBMITTED,
  NotificationType.APPROVAL_NEEDED,
  NotificationType.MESSAGE_RECEIVED,
  NotificationType.MILESTONE_REACHED,
  NotificationType.INVOICE_AVAILABLE,
  NotificationType.TEAM_MEMBER_JOINED,
];

export const NOTIFICATION_CHANNELS = [
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
  NotificationChannel.IN_APP,
  NotificationChannel.PUSH,
];

export const DOCUMENT_CATEGORIES = [
  "contract",
  "agreement",
  "guide",
  "proposal",
  "report",
  "other",
];

export type NotificationChannel = 'in_app' | 'email' | 'webhook';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface NotificationPayload {
  [key: string]: any;
}

export interface NotificationActionParams {
  channel: NotificationChannel;
  subject?: string;
  body?: string;
  recipients?: string[];
  url?: string;
  headers?: Record<string, string>;
  payload?: Record<string, any>;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  payload?: NotificationPayload;
  status: NotificationStatus;
  response?: Record<string, any>;
  read: boolean;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

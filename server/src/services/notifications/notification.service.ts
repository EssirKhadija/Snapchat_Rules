import axios from 'axios';
import prisma from '../../prisma/client';
import logger from '../../utils/logger';
import { NotificationActionParams, NotificationChannel } from './types';

export async function createNotification(userId: string, title: string, message: string, channel: NotificationChannel, payload: Record<string, any> = {}) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      channel,
      status: 'pending',
      payload,
      read: false,
    },
  });
}

export async function sendNotification(notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new Error('Notification not found');

  try {
    let response: Record<string, any> | null = null;

    switch (notification.channel) {
      case 'in_app':
        response = { delivered: true };
        break;
      case 'email':
        response = await sendEmail(notification);
        break;
      case 'webhook':
        response = await sendWebhook(notification);
        break;
      default:
        throw new Error('Unsupported notification channel');
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: 'sent',
        response,
        sentAt: new Date(),
      },
    });

    return updated;
  } catch (error: any) {
    logger.error('Notification send failed', { notificationId: notification.id, error });
    return prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: 'failed',
        response: { error: error?.message || 'Unknown error' },
      },
    });
  }
}

async function sendEmail(notification: any) {
  const recipients = notification.payload?.recipients || [];
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error('Email notification requires recipients');
  }

  const response = {
    deliveredTo: recipients,
    subject: notification.title,
    body: notification.message,
  };

  return response;
}

async function sendWebhook(notification: any) {
  const url = notification.payload?.url;
  if (!url) throw new Error('Webhook notification requires url');

  const res = await axios.post(url, {
    title: notification.title,
    message: notification.message,
    payload: notification.payload?.payload ?? {},
  }, {
    headers: notification.payload?.headers ?? { 'Content-Type': 'application/json' },
    timeout: 5000,
  });

  return { status: res.status, data: res.data };
}

export async function listNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function markAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function retryNotification(notificationId: string) {
  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { status: 'pending', read: false },
  });

  return sendNotification(notification.id);
}

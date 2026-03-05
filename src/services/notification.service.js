import { Notification } from "../models/Notification.model.js";
import { broadcast } from "../lib/socket.js";

/**
 * Crée une notification et l'émet en temps réel via WebSocket
 */
export async function createNotification({
  recipient,
  type,
  title,
  message,
  priority = "medium",
  refModel = null,
  refId = null,
  sender = null,
}) {
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    priority,
    refModel,
    refId,
    sender,
  });

  // Émet en temps réel vers le dashboard admin
  broadcast("notification:new", {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    priority: notification.priority,
    refModel: notification.refModel,
    refId: notification.refId,
    isRead: false,
    createdAt: notification.createdAt,
  });

  return notification;
}

/**
 * Crée une notification pour tous les admins et superviseurs
 */
export async function notifyAdmins({
  type,
  title,
  message,
  priority = "medium",
  refModel = null,
  refId = null,
  sender = null,
}) {
  const { User } = await import("../models/User.model.js");

  const admins = await User.find({
    role: { $in: ["admin", "supervisor"] },
    isActive: true,
  }).select("_id");

  const notifications = await Promise.all(
    admins.map((admin) =>
      createNotification({
        recipient: admin._id,
        type,
        title,
        message,
        priority,
        refModel,
        refId,
        sender,
      }),
    ),
  );

  return notifications;
}

/**
 * Liste les notifications d'un utilisateur
 */
export async function getNotifications(
  userId,
  { page, limit, skip, unreadOnly },
) {
  const filter = { recipient: userId };
  if (unreadOnly) filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate("sender", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return { notifications, total, unreadCount };
}

/**
 * Marque une notification comme lue
 */
export async function markAsRead(notificationId, userId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true },
  );

  if (!notification) throw new Error("Notification introuvable");
  return notification;
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );

  return { updated: result.modifiedCount };
}

/**
 * Supprime une notification
 */
export async function deleteNotification(notificationId, userId) {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) throw new Error("Notification introuvable");
  return { deleted: true };
}

/**
 * Supprime toutes les notifications lues
 */
export async function deleteReadNotifications(userId) {
  const result = await Notification.deleteMany({
    recipient: userId,
    isRead: true,
  });

  return { deleted: result.deletedCount };
}

/**
 * Compte les notifications non lues
 */
export async function getUnreadCount(userId) {
  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return { count };
}

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getUnreadCount,
} from "../services/notification.service.js";
import { getPagination } from "../utils/pagination.js";
import { success, error } from "../utils/response.js";

export const notificationController = {
  // GET /notifications
  async list(ctx) {
    try {
      const { page, limit, skip } = getPagination(ctx.query);
      const unreadOnly = ctx.query.unreadOnly === "true";

      const result = await getNotifications(ctx.user._id, {
        page,
        limit,
        skip,
        unreadOnly,
      });

      return {
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      };
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /notifications/unread-count
  async unreadCount(ctx) {
    try {
      const result = await getUnreadCount(ctx.user._id);
      return success(result);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // PATCH /notifications/:id/read
  async markRead(ctx) {
    try {
      const notification = await markAsRead(ctx.params.id, ctx.user._id);
      return success(notification, "Notification marquée comme lue");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // PATCH /notifications/read-all
  async markAllRead(ctx) {
    try {
      const result = await markAllAsRead(ctx.user._id);
      return success(
        result,
        `${result.updated} notification(s) marquée(s) comme lues`,
      );
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // DELETE /notifications/:id
  async delete(ctx) {
    try {
      const result = await deleteNotification(ctx.params.id, ctx.user._id);
      return success(result, "Notification supprimée");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // DELETE /notifications/read
  async deleteRead(ctx) {
    try {
      const result = await deleteReadNotifications(ctx.user._id);
      return success(result, `${result.deleted} notification(s) supprimée(s)`);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};

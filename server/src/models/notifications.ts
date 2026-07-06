import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['review_like', 'review_dislike', 'comment_like', 'comment', 'reply', 'vault_save'],
      required: true,
    },

    gameLog: {
      type: Schema.Types.ObjectId,
      ref: 'GameLog',
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = model('Notification', notificationSchema);
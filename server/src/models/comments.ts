import { Schema, model } from 'mongoose';

const commentSchema = new Schema(
    {
        gameLog: {
            type: Schema.Types.ObjectId,
            ref: 'GameLog',
            required: true,
        },

        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        text: {
            type: String,
            required: true,
            trim: true,
        },

        parentComment: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },

        likes: {
            type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
            default: []
        },
    },
    {
        timestamps: true,
    }
);

export const Comment = model('Comment', commentSchema);
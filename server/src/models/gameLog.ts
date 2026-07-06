import { Schema, model } from 'mongoose';

const gameLogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    
    title: { 
        type: String, 
        required: true,
        trim : true 
    },

    platform: { 
        type: String, 
        required: true, 
        enum: ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series S/X', 'Xbox One', 'Xbox 360', 'Nintendo Switch', 'iOS', 'Android', 'Linux', 'macOS', 'Other']
    },

    status: {
        type: String,
        required: true,
        enum: ['Playing', 'Completed', 'Dropped'],
        default: 'Playing'
    },

    rating: {
        type: Number,
        min: 0,
        max: 10,
        default: null,
        required: true 
    },

    review: {
        type: String,
        trim: true,
        default: '',
        required: false
    },

    likes: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        default: []
    },

    dislikes: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        default: []
    },

    timestamp: {
        type: Date,
        default: Date.now
    },

    editedAt: {
        type: Date,
        default: null,
        required: false
    },

    coverImage: {
        type: String,
        default: null,
        required: false
    },

    releasedDate: {
        type: String,
        default: null,
        required: false
    },

    genres: {
        type: [String],
        default: [],
        required: false
    }
});

export const GameLog = model('GameLog', gameLogSchema);
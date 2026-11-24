import mongoose, { Document, Schema } from 'mongoose';

export interface IMantraSession extends Document {
  userId: string; // From JWT
  mantraId: string;
  customMantra?: string;
  duration: number; // Requested duration in seconds
  actualDuration: number; // Actual completed duration in seconds
  status: 'completed' | 'interrupted' | 'abandoned';
  moodBefore?: string;
  moodAfter?: string;
  reflection?: string;
  audioMode: string;
  createdAt: Date;
  completedAt?: Date;
}

const mantraSessionSchema = new Schema<IMantraSession>({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  mantraId: { 
    type: String, 
    required: true 
  },
  customMantra: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  duration: { 
    type: Number, 
    required: true,
    min: 0,
    max: 86400 // Up to 24 hours
  },
  actualDuration: { 
    type: Number, 
    default: 0,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['completed', 'interrupted', 'abandoned'], 
    required: true 
  },
  moodBefore: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  moodAfter: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  reflection: { 
    type: String, 
    trim: true,
    maxlength: 2000 // Reasonable length limit
  },
  audioMode: { 
    type: String,
    default: 'silent',
    maxlength: 50
  },
  completedAt: { 
    type: Date 
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

// Indexes for performance
// Querying a user's recent sessions
mantraSessionSchema.index({ userId: 1, createdAt: -1 });
// Querying statistics for a specific mantra
mantraSessionSchema.index({ userId: 1, mantraId: 1 });

export const MantraSession = mongoose.model<IMantraSession>('MantraSession', mantraSessionSchema);

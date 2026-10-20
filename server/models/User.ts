import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  id: string; // Guaranteed non-null unique identifier
  name: string;
  email: string;
  studentId?: string;
  department: string;
  yearOfStudy: number;
  passwordHash: string;
  role: 'student' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  statusReason?: string;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  suspendedAt?: Date;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function generateUserIdentifier(role: 'student' | 'admin' = 'student'): string {
  const prefix = role === 'admin' ? 'admin' : 'stu';
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${timestamp}-${randomPart}`;
}

const UserSchema = new Schema<IUser>(
  {
    id: {
      type: String,
      required: [true, 'Unique user identifier is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    studentId: {
      type: String,
      trim: true,
      sparse: true,
      maxlength: 50,
    },
    department: {
      type: String,
      required: true,
      default: 'Computer Science',
      trim: true,
    },
    yearOfStudy: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 6,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    statusReason: {
      type: String,
      default: '',
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    suspendedAt: {
      type: Date,
    },
    badges: {
      type: [String],
      default: ['New Cadet'],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook: guarantee that every user has a unique, non-null ID before insertion
UserSchema.pre('validate', function () {
  if (!this.id || this.id.trim() === '') {
    this.id = generateUserIdentifier(this.role || 'student');
  }
});

// Compound index for fast student listing & filtering
UserSchema.index({ role: 1, status: 1, createdAt: -1 });

export async function findUserByIdOrCustomId(identifier?: string | null): Promise<IUser | null> {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const user = await User.findById(identifier);
    if (user) return user;
  }
  return User.findOne({ id: identifier });
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

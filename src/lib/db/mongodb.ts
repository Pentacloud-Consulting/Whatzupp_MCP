import mongoose, { Schema, Document, Model } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToMongoDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ----------------------------------------------------------------------------
// SCHEMAS
// ----------------------------------------------------------------------------

export interface ITenant extends Document {
  tenantId: string;
  companyName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan: string;
  licensedWorkspaces: string[];
  maxUsers: number;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>({
  tenantId: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  status: { type: String, required: true, default: 'ACTIVE' },
  plan: { type: String, required: true, default: 'ENTERPRISE' },
  licensedWorkspaces: { type: [String], required: true },
  maxUsers: { type: Number, required: true, default: 10 },
}, { timestamps: true });

export interface ITenantLicense extends Document {
  tenantId: string;
  licensedWorkspaces: string[];
  userLimit: number;
  currentUsage: number;
}

const TenantLicenseSchema = new Schema<ITenantLicense>({
  tenantId: { type: String, required: true, unique: true },
  licensedWorkspaces: { type: [String], required: true },
  userLimit: { type: Number, required: true, default: 0 },
  currentUsage: { type: Number, required: true, default: 0 },
});

export interface IPlatformUser extends Document {
  id: string;
  name: string;
  email: string;
  role: string;
}

const PlatformUserSchema = new Schema<IPlatformUser>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, default: 'SUPER_ADMIN' },
});

export interface IApprovalRequest extends Document {
  requestId: string;
  tenantId: string;
  companyName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const ApprovalRequestSchema = new Schema<IApprovalRequest>({
  requestId: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true },
  companyName: { type: String, required: true },
  status: { type: String, required: true, default: 'PENDING' },
});

export interface IAuditLog extends Document {
  tenantId: string;
  action: string;
  performedBy: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  tenantId: { type: String, required: true },
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Models
export const TenantModel: Model<ITenant> = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
export const TenantLicenseModel: Model<ITenantLicense> = mongoose.models.TenantLicense || mongoose.model<ITenantLicense>('TenantLicense', TenantLicenseSchema);
export const PlatformUserModel: Model<IPlatformUser> = mongoose.models.PlatformUser || mongoose.model<IPlatformUser>('PlatformUser', PlatformUserSchema);
export const ApprovalRequestModel: Model<IApprovalRequest> = mongoose.models.ApprovalRequest || mongoose.model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);
export const AuditLogModel: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
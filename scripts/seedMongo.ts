import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function seed() {
  const { TenantModel, TenantLicenseModel, PlatformUserModel } = await import('../src/lib/db/mongodb');
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  await TenantModel.deleteMany({});
  await TenantLicenseModel.deleteMany({});
  await PlatformUserModel.deleteMany({});

  const t1 = await TenantModel.create({
    tenantId: 'XYZ_COMPANY',
    companyName: 'XYZ company',
    status: 'ACTIVE',
    plan: 'ENTERPRISE',
    licensedWorkspaces: ['SALES_CLOUD'],
    maxUsers: 50
  });

  await TenantLicenseModel.create({
    tenantId: 'XYZ_COMPANY',
    licensedWorkspaces: ['SALES_CLOUD'],
    userLimit: 50,
    currentUsage: 1
  });

  const t2 = await TenantModel.create({
    tenantId: 'PENTA001',
    companyName: 'Penta',
    status: 'ACTIVE',
    plan: 'ENTERPRISE',
    licensedWorkspaces: ['SFMC'],
    maxUsers: 10
  });

  await TenantLicenseModel.create({
    tenantId: 'PENTA001',
    licensedWorkspaces: ['SFMC'],
    userLimit: 10,
    currentUsage: 1
  });

  const t3 = await TenantModel.create({
    tenantId: 'JOBI',
    companyName: 'jobi',
    status: 'ACTIVE',
    plan: 'ENTERPRISE',
    licensedWorkspaces: ['SALES_CLOUD'],
    maxUsers: 50
  });

  await TenantLicenseModel.create({
    tenantId: 'JOBI',
    licensedWorkspaces: ['SALES_CLOUD'],
    userLimit: 50,
    currentUsage: 1
  });

  await PlatformUserModel.create({
    id: 'super-admin',
    name: 'WhatZupp Platform Admin',
    email: 'admin@whatzupp.com',
    role: 'SUPER_ADMIN'
  });

  console.log('Seeded Mongo successfully');
  process.exit(0);
}

seed().catch(console.error);

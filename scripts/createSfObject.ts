import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import jsforce from 'jsforce';

async function createObject() {
  const conn = new jsforce.Connection({
    instanceUrl: process.env.SALESCLOUD_INSTANCE_URL,
    accessToken: process.env.SALESCLOUD_ACCESS_TOKEN,
    version: '60.0'
  });

  const customObject = {
    fullName: 'WhatZupp_User__c',
    label: 'WhatZupp User',
    pluralLabel: 'WhatZupp Users',
    nameField: {
      type: 'Text',
      label: 'Record Name'
    },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: [
      {
        fullName: 'User_Id__c',
        label: 'User Id',
        type: 'Text',
        length: 255,
        required: true,
        unique: true,
        externalId: true
      },
      {
        fullName: 'Tenant_Id__c',
        label: 'Tenant Id',
        type: 'Text',
        length: 255
      },
      {
        fullName: 'Workspace__c',
        label: 'Workspace',
        type: 'Text',
        length: 255
      },
      {
        fullName: 'Name__c',
        label: 'Name',
        type: 'Text',
        length: 255
      },
      {
        fullName: 'Email__c',
        label: 'Email',
        type: 'Email'
      },
      {
        fullName: 'Phone__c',
        label: 'Phone',
        type: 'Phone'
      },
      {
        fullName: 'Role__c',
        label: 'Role',
        type: 'Text',
        length: 50
      },
      {
        fullName: 'Status__c',
        label: 'Status',
        type: 'Text',
        length: 50
      },
      {
        fullName: 'Department__c',
        label: 'Department',
        type: 'Text',
        length: 100
      },
      {
        fullName: 'Last_Login__c',
        label: 'Last Login',
        type: 'DateTime'
      }
    ]
  };

  try {
    console.log('Creating custom object and fields...');
    const result = await conn.metadata.create('CustomObject', customObject);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error creating custom object:', err);
  }
}

createObject();

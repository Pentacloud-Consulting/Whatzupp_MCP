const fs = require('fs');
const path = require('path');
const objDir = path.join(process.cwd(), 'force-app/main/default/objects/WhatZupp_Communication_Activity__c');
const fieldsDir = path.join(objDir, 'fields');
fs.mkdirSync(fieldsDir, { recursive: true });

const objMeta = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <enableActivities>true</enableActivities>
    <enableBulkApi>true</enableBulkApi>
    <enableHistory>true</enableHistory>
    <enableReports>true</enableReports>
    <enableSearch>true</enableSearch>
    <enableSharing>true</enableSharing>
    <enableStreamingApi>true</enableStreamingApi>
    <label>WhatZupp Communication Activity</label>
    <nameField>
        <displayFormat>WCA-{0000000}</displayFormat>
        <label>Activity ID</label>
        <type>AutoNumber</type>
    </nameField>
    <pluralLabel>WhatZupp Communication Activities</pluralLabel>
    <sharingModel>ReadWrite</sharingModel>
</CustomObject>`;
fs.writeFileSync(path.join(objDir, 'WhatZupp_Communication_Activity__c.object-meta.xml'), objMeta);

const fields = [
  { name: 'Tenant_Id__c', type: 'Text', length: '100' },
  { name: 'Workspace_Id__c', type: 'Text', length: '100' },
  { name: 'Workspace_Type__c', type: 'Text', length: '50' },
  { name: 'Contact_Id__c', type: 'Text', length: '100' },
  { name: 'Contact_Name__c', type: 'Text', length: '255' },
  { name: 'Contact_Phone__c', type: 'Text', length: '50' },
  { name: 'Agent_Id__c', type: 'Text', length: '100' },
  { name: 'Agent_Name__c', type: 'Text', length: '255' },
  { name: 'Activity_Source__c', type: 'Text', length: '100' },
  { name: 'Status__c', type: 'Text', length: '100' }
];

fields.forEach(f => {
  const fieldMeta = `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>${f.name}</fullName>
    <externalId>false</externalId>
    <label>${f.name.replace('__c', '').replace(/_/g, ' ')}</label>
    <length>${f.length}</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>${f.type}</type>
    <unique>false</unique>
</CustomField>`;
  fs.writeFileSync(path.join(fieldsDir, f.name + '.field-meta.xml'), fieldMeta);
});
console.log('Metadata created');

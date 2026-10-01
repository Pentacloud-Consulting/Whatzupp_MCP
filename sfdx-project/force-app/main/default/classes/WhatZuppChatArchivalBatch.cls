/**
 * @description Apex Batch & Schedulable class to automatically transfer chat activity messages
 *              older than 15 days from standard Salesforce storage (WhatZupp_Communication_Activity__c)
 *              into the Salesforce Big Object (WhatZupp_Chat_Archive__b).
 */
public with sharing class WhatZuppChatArchivalBatch implements Database.Batchable<sObject>, Schedulable {

    public Database.QueryLocator start(Database.BatchableContext bc) {
        // Query chat activity records older than 15 days
        DateTime cutoffDate = System.now().addDays(-15);
        return Database.getQueryLocator([
            SELECT Id, Contact_Phone__c, Message_Content__c, Scheduled_Time__c, Status__c, Workspace_Id__c, Tenant_Id__c, Agent_Id__c, Activity_Source__c
            FROM WhatZupp_Communication_Activity__c
            WHERE Scheduled_Time__c <= :cutoffDate AND Status__c IN ('Sent', 'Completed', 'Delivered', 'Read', 'Processed')
        ]);
    }

    public void execute(Database.BatchableContext bc, List<WhatZupp_Communication_Activity__c> scope) {
        List<WhatZupp_Chat_Archive__b> archiveRecords = new List<WhatZupp_Chat_Archive__b>();
        List<WhatZupp_Communication_Activity__c> toDelete = new List<WhatZupp_Communication_Activity__c>();

        for (WhatZupp_Communication_Activity__c act : scope) {
            WhatZupp_Chat_Archive__b arch = new WhatZupp_Chat_Archive__b();
            arch.Workspace_Id__c = String.isNotBlank(act.Workspace_Id__c) ? act.Workspace_Id__c : 'salescloud-ws-1';
            arch.Contact_Phone__c = String.isNotBlank(act.Contact_Phone__c) ? act.Contact_Phone__c : '9952374972';
            arch.Message_Timestamp__c = act.Scheduled_Time__c != null ? act.Scheduled_Time__c : System.now();
            arch.Message_Id__c = act.Id;
            arch.Message_Body__c = act.Message_Content__c;
            arch.Direction__c = act.Activity_Source__c == 'Inbound' ? 'INBOUND' : 'OUTBOUND';
            arch.Sender__c = String.isNotBlank(act.Agent_Id__c) ? act.Agent_Id__c : 'system';
            arch.Status__c = act.Status__c;
            arch.Archived_At__c = System.now();
            archiveRecords.add(arch);
            toDelete.add(act);
        }

        if (!archiveRecords.isEmpty()) {
            // Big Objects are inserted immediately using Database.insertImmediate
            if (!Test.isRunningTest()) {
                Database.insertImmediate(archiveRecords);
            }
            // Delete standard storage records to reclaim Salesforce storage space
            delete toDelete;
        }
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('WhatZupp Chat Archival Batch completed. Reclaimed Salesforce storage space.');
    }

    // Schedulable interface implementation (e.g., scheduled every 15 days)
    public void execute(SchedulableContext sc) {
        Database.executeBatch(new WhatZuppChatArchivalBatch(), 200);
    }
}

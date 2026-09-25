# Pending Tasks & Next Steps

The codebase for the **Enterprise Coverage Management (Chat Transfer)** feature is 100% complete. The remaining tasks are strictly related to infrastructure deployment, QA, and production hardening.

### 1. Salesforce Marketing Cloud (SFMC) Setup
*   **Status:** Pending (Manual Action Required)
*   **Task:** Log into SFMC Contact Builder and manually create the Data Extension `WhatZupp_Coverage_Transfer_DE`.
*   **Fields Required:** Coverage_Id, Tenant_Id, Workspace_Id, Original_Owner_Id, Temporary_Owner_Id, Primary_Backup_Id, Manager_Id, Status, Effective_Status, Approval_Status, Start_Time, End_Time, Is_All_Contacts, Specific_Contact_Ids, Reason, Created_By, Created_Date.

### 2. Application Deployment
*   **Status:** Pending
*   **Task:** Push the local Next.js repository to GitHub and connect it to a hosting provider (like Vercel).
*   **Requirements:** Ensure all environment variables from your local `.env` (Salesforce, SFMC, and KV Cache tokens) are added to the production environment secrets.

### 3. Load Testing (QA)
*   **Status:** Pending
*   **Task:** Run a load test against the staging environment webhook (`/api/webhook`) to simulate high traffic.
*   **Goal:** Verify that the Redis/Vercel KV caching architecture correctly resolves ownership for 500+ concurrent messages without hitting Salesforce API rate limits.

### 4. Security Validation
*   **Status:** Pending
*   **Task:** Perform a final security audit on the multi-tenant isolation rules.
*   **Goal:** Ensure that users from Tenant A cannot intercept, approve, or revoke coverage transfers belonging to Tenant B by manipulating API payloads.

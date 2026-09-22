import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

import LEAD_PHONE from '@salesforce/schema/Lead.Phone';
import LEAD_MOBILE from '@salesforce/schema/Lead.MobilePhone';
import CONTACT_PHONE from '@salesforce/schema/Contact.Phone';
import CONTACT_MOBILE from '@salesforce/schema/Contact.MobilePhone';
import ACCOUNT_PHONE from '@salesforce/schema/Account.Phone';

export default class WhatzuppRecordAction extends LightningElement {
    @api recordId;
    @api objectApiName;
    
    @track isLoading = true;
    @track isReady = false;
    @track launchContext = '{}';

    get recordFields() {
        if (this.objectApiName === 'Lead') return [LEAD_PHONE, LEAD_MOBILE];
        if (this.objectApiName === 'Contact') return [CONTACT_PHONE, CONTACT_MOBILE];
        if (this.objectApiName === 'Account') return [ACCOUNT_PHONE];
        return [LEAD_PHONE]; // Fallback
    }

    @wire(getRecord, { recordId: '$recordId', fields: '$recordFields' })
    wiredRecord({ error, data }) {
        if (data) {
            let phone = '';
            if (this.objectApiName === 'Lead') {
                phone = getFieldValue(data, LEAD_PHONE) || getFieldValue(data, LEAD_MOBILE) || '';
            } else if (this.objectApiName === 'Contact') {
                phone = getFieldValue(data, CONTACT_PHONE) || getFieldValue(data, CONTACT_MOBILE) || '';
            } else if (this.objectApiName === 'Account') {
                phone = getFieldValue(data, ACCOUNT_PHONE) || '';
            }
            
            // Generate Context
            let type = (this.objectApiName === 'Account') ? 'OPEN_ACCOUNT' : 'OPEN_CHAT';
            this.launchContext = JSON.stringify({
                phone: phone,
                type: type,
                recordId: this.recordId,
                objectType: this.objectApiName
            });
            
            this.isLoading = false;
            this.isReady = true;
        } else if (error) {
            console.error('Error fetching record fields', error);
            // Still launch, just without specific phone context
            this.launchContext = JSON.stringify({
                type: 'OPEN_CHAT',
                recordId: this.recordId,
                objectType: this.objectApiName
            });
            this.isLoading = false;
            this.isReady = true;
        }
    }
}

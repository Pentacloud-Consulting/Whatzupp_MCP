import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class WhatzuppFloatingLauncher extends NavigationMixin(LightningElement) {
    @api launchMode = 'Modal'; // Configurable via App Builder: 'Modal' or 'Tab'
    
    @track showModal = false;

    handleLaunch() {
        if (this.launchMode === 'Tab') {
            this[NavigationMixin.Navigate]({
                type: 'standard__navItemPage',
                attributes: {
                    apiName: 'WhatZupp_CRM'
                }
            });
        } else {
            this.showModal = true;
        }
    }

    handleClose() {
        this.showModal = false;
    }
}

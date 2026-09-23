import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class WhatzuppFloatingLauncher extends NavigationMixin(LightningElement) {
    @api launchMode; // Kept for backwards compatibility with existing Lightning Pages

    handleLaunch() {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'WhatZupp_CRM'
            }
        });
    }
}

import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class WhatzuppFloatingLauncher extends NavigationMixin(LightningElement) {
    handleLaunch() {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'WhatZupp_CRM'
            }
        });
    }
}

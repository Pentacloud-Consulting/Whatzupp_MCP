List<WhatsApp_Message__c> msgs = new List<WhatsApp_Message__c>();
for(WhatsApp_Message__c msg : [SELECT Id, Content__c FROM WhatsApp_Message__c]) {
    if(msg.Content__c != null && msg.Content__c.contains('test inbound message')) {
        msgs.add(msg);
    }
}
if(msgs.size() > 0) {
    delete msgs;
}

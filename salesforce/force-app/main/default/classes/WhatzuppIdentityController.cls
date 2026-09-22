public with sharing class WhatzuppIdentityController {
    // In a production org, this should be stored in a Protected Custom Setting, Custom Metadata, or Named Credential.
    // Must match SSO_SECRET in Vercel .env
    private static final String SHARED_SECRET = 'pentacloud-whatzupp-super-secret-key-2026';
    
    @AuraEnabled(cacheable=false)
    public static String generateSSOToken(String workspaceContext) {
        User currentUser = [SELECT Id, Email, Name, Title FROM User WHERE Id = :UserInfo.getUserId()];
        
        // Base64URL encode header
        String header = '{"alg":"HS256","typ":"JWT"}';
        String b64Header = base64UrlEncode(Blob.valueOf(header));
        
        // Build payload. Hardcoding some tenant defaults for the prototype.
        // In full production, we would query a User Mapping table or Custom Setting.
        Map<String, Object> payloadMap = new Map<String, Object>();
        payloadMap.put('iss', 'salesforce');
        payloadMap.put('sub', currentUser.Id);
        payloadMap.put('email', currentUser.Email);
        payloadMap.put('name', currentUser.Name);
        payloadMap.put('tenantId', 'pentacloud-tenant-id'); // Can be mapped later
        payloadMap.put('workspacePermissions', new List<String>{'SALES_CLOUD', 'SFMC'});
        payloadMap.put('context', workspaceContext);
        payloadMap.put('iat', Datetime.now().getTime() / 1000);
        payloadMap.put('exp', (Datetime.now().getTime() / 1000) + 300); // 5 minutes validity
        
        String payload = JSON.serialize(payloadMap);
        String b64Payload = base64UrlEncode(Blob.valueOf(payload));
        
        // Sign using HMAC SHA256
        String jwtInput = b64Header + '.' + b64Payload;
        Blob signature = Crypto.generateMac('hmacSHA256', Blob.valueOf(jwtInput), Blob.valueOf(SHARED_SECRET));
        String b64Signature = base64UrlEncode(signature);
        
        return jwtInput + '.' + b64Signature;
    }
    
    private static String base64UrlEncode(Blob input) {
        String output = EncodingUtil.base64Encode(input);
        output = output.replace('+', '-');
        output = output.replace('/', '_');
        while (output.endsWith('=')) {
            output = output.substring(0, output.length() - 1);
        }
        return output;
    }
}

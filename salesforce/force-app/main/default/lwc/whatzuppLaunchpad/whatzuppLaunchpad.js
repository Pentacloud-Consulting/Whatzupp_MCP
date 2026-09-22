import { LightningElement, api, track } from 'lwc';
import generateSSOToken from '@salesforce/apex/WhatzuppIdentityController.generateSSOToken';

// Target the Vercel SSO receiver
const SSO_RECEIVER_URL = 'https://whatzupp-mcp-pentacloud.vercel.app/auth/sso-receiver';
const TARGET_ORIGIN = 'https://whatzupp-mcp-pentacloud.vercel.app';

export default class WhatzuppLaunchpad extends LightningElement {
    @api recordId; // Optional: If placed on a record page
    @api objectApiName; // Optional: If placed on a record page
    @api phoneField; // Optional: specific field to use for phone context
    @api launchContext = '{}'; // JSON string for arbitrary context

    @track isLoading = true;
    @track error = '';
    @track iframeUrl = '';
    
    _jwtToken = null;
    _messageListener = null;

    connectedCallback() {
        this.initializeLaunchpad();
        
        // Listen for messages from the iframe (e.g. SSO_RECEIVER_READY)
        this._messageListener = this.handleMessage.bind(this);
        window.addEventListener('message', this._messageListener);
    }

    disconnectedCallback() {
        if (this._messageListener) {
            window.removeEventListener('message', this._messageListener);
        }
    }

    async initializeLaunchpad() {
        this.isLoading = true;
        this.error = '';
        this.iframeUrl = '';

        try {
            // Build Context payload based on recordId or launchContext
            let contextObj = JSON.parse(this.launchContext || '{}');
            if (this.recordId) {
                contextObj.recordId = this.recordId;
                contextObj.objectType = this.objectApiName;
            }

            const contextStr = JSON.stringify(contextObj);

            // Fetch JWT from Apex
            this._jwtToken = await generateSSOToken({ workspaceContext: contextStr });
            
            // Once we have the token, we load the SSO receiver in the iframe
            this.iframeUrl = SSO_RECEIVER_URL;
            
        } catch (err) {
            console.error('SSO Initialization Error:', err);
            this.error = err.body?.message || err.message || 'Failed to authenticate securely.';
            this.isLoading = false;
        }
    }

    handleMessage(event) {
        // Ensure the message is from our trusted Vercel domain
        if (event.origin !== TARGET_ORIGIN) return;

        const data = event.data;
        if (!data || !data.type) return;

        if (data.type === 'SSO_RECEIVER_READY') {
            // The iframe is ready to receive the JWT for login
            const iframe = this.template.querySelector('.whatzupp-iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'SSO_LOGIN',
                    jwt: this._jwtToken,
                    context: this.launchContext
                }, TARGET_ORIGIN);
            }
        }
    }

    handleIframeLoad() {
        // Once the iframe triggers load (either initial receiver or final app), we hide the spinner.
        // The real state is managed by postMessage, but this is a fallback.
        this.isLoading = false;
    }
}

import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GoogleOAuthWrapper = ({ children, clientId }) => {
    // Only render the provider if we have a client ID
    if (!clientId) {
        return children; // Fallback without OAuth context
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
};

export default GoogleOAuthWrapper;

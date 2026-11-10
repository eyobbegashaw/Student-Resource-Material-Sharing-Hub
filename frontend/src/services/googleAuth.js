/**
 * Google Identity Services (GIS) Client Integration
 * Real Google OAuth integration - triggers native Google Account selection on device.
 */

export const triggerGoogleAuth = async ({
  clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID,
  onSuccess,
  onError,
}) => {
  // Check or dynamically wait for Google Identity Services SDK
  if (!window.google?.accounts?.oauth2) {
    let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let loaded = false;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (window.google?.accounts?.oauth2) {
        loaded = true;
        break;
      }
    }

    if (!loaded) {
      const errorMsg = 'Google Identity Services SDK could not be loaded. Please check your internet connection or adblocker.';
      console.error(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }
  }

  const finalClientId = clientId || process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (!finalClientId || finalClientId.includes('your_google_client_id')) {
    const errorMsg = 'Google Client ID is not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in frontend/.env.';
    console.error(errorMsg);
    if (onError) onError(new Error(errorMsg));
    return;
  }

  try {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    console.info('[GoogleAuth] Initializing with Client ID:', finalClientId, 'from Origin:', currentOrigin);

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: finalClientId,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (!tokenResponse || tokenResponse.error) {
          const detail = tokenResponse?.error_description || tokenResponse?.error || 'Google authentication was not completed.';
          console.warn('Google tokenResponse error:', tokenResponse);
          if (onError) onError(new Error(detail));
          return;
        }

        try {
          // Fetch authenticated Google profile info
          let userInfo = {};
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            if (res.ok) {
              userInfo = await res.json();
            }
          } catch (e) {
            console.warn('Error fetching userinfo directly from googleapis:', e);
          }

          if (onSuccess) {
            await onSuccess({
              email: userInfo.email,
              first_name: userInfo.given_name || userInfo.name || '',
              last_name: userInfo.family_name || '',
              picture: userInfo.picture,
              token: tokenResponse.access_token,
              access_token: tokenResponse.access_token,
            });
          }
        } catch (handlerErr) {
          console.error('Error handling Google token callback:', handlerErr);
          if (onError) onError(handlerErr);
        }
      },
      error_callback: (err) => {
        if (err?.type === 'popup_closed') {
          console.info('Google Sign-In popup closed by user.');
          if (onError) {
            const closedErr = new Error('Google sign-in window was closed.');
            closedErr.type = 'popup_closed';
            onError(closedErr);
          }
          return;
        }

        if (err?.type === 'popup_blocked') {
          console.warn('Google Sign-In popup was blocked by browser.');
          if (onError) {
            const blockedErr = new Error('Google Sign-In popup was blocked by your browser. Please allow popups for this site.');
            blockedErr.type = 'popup_blocked';
            onError(blockedErr);
          }
          return;
        }

        console.warn('Google tokenClient error callback triggered:', err);
        const origin = typeof window !== 'undefined' ? window.location.origin : 'your current domain';
        const msg = `Google Sign-In failed (${err?.type || 'Authorization error'}). Please verify that ${origin} is added to 'Authorized JavaScript origins' in Google Cloud Console.`;
        if (onError) onError(new Error(msg));
      },
    });

    // Request native account chooser prompt on the device
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (err) {
    console.error('Google initTokenClient threw an exception:', err);
    if (onError) onError(err);
  }
};

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (res: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  onSuccess: (idToken: string) => void;
}

let scriptLoaded = false;

export const GoogleLoginButton = ({ onSuccess }: GoogleLoginButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError(true);
      return;
    }

    const init = () => {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res) => onSuccess(res.credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: '100%',
      });
    };

    if (scriptLoaded && window.google) {
      init();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      init();
    };
    document.body.appendChild(script);
  }, [onSuccess]);

  if (error) {
    return (
      <p className="text-muted" style={{ fontSize: 13, textAlign: 'center' }}>
        Google sign-in is not configured.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        minHeight: 44,
        alignItems: 'center',
      }}
    />
  );
};
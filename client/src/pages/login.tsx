import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Telescope } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
            }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const { login } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      login(response.credential);
    },
    [login]
  );

  useEffect(() => {
    if (initializedRef.current) return;

    function initGoogle() {
      if (!window.google || !buttonRef.current) return;
      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'rectangular',
      });
    }

    // Google script might not be loaded yet
    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleCredentialResponse]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-8 px-4">
        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Telescope className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl tracking-tight">RunwayLens</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cash flow forecasting for startups
          </p>
        </div>

        {/* Google Sign-In Button */}
        <div className="flex justify-center">
          <div ref={buttonRef} />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Sign in to manage your cash flow forecasts. Your data is private and scoped to your account.
        </p>
      </div>
    </div>
  );
}

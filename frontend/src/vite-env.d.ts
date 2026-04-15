/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Defaults to `admin` if unset. */
  readonly VITE_LOGIN_USERNAME?: string;
  /** Defaults to app deploy password if unset; override at build time to rotate. */
  readonly VITE_LOGIN_PASSWORD?: string;
  /** Set to `true` or `1` to skip the login screen (local development). */
  readonly VITE_AUTH_DISABLED?: string;
}

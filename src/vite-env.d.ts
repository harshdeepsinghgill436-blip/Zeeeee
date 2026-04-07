/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BREVO_KEY_1: string
  readonly VITE_BREVO_EMAIL_1: string
  readonly VITE_BREVO_KEY_2: string
  readonly VITE_BREVO_EMAIL_2: string
  readonly VITE_BREVO_KEY_3: string
  readonly VITE_BREVO_EMAIL_3: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

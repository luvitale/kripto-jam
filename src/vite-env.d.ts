/// <reference types="vite/client" />

interface ImportMetaEnv {
    VITE_CRIPTO_YA_API_URL: string;
    VITE_CRYPTO_COMPARE_API_URL: string;
    VITE_CRYPTO_COMPARE_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
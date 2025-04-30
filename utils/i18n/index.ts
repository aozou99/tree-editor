import { ja } from './translations/ja';
import { en } from './translations/en';

// 利用可能な言語
export type Locale = 'ja' | 'en';

// 翻訳データの型
type TranslationData = typeof ja;

// 翻訳データ
const translations: Record<Locale, TranslationData> = {
    ja,
    en,
};

// 現在の言語設定を取得する関数
function getCurrentLocale(): Locale {
    if (typeof window === 'undefined') {
        return 'ja'; // サーバーサイドではデフォルト値を返す
    }

    const savedLocale = localStorage.getItem('locale') as Locale | null;
    return savedLocale && (savedLocale === 'ja' || savedLocale === 'en') ? savedLocale : 'ja';
}

// 翻訳ヘルパー関数
function translateText(key: string, locale: Locale, vars?: Record<string, string | number>): string {
    const keys = key.split('.');
    let str: any = translations[locale];

    for (const k of keys) {
        if (str && typeof str === 'object' && k in str) {
            str = str[k];
        } else {
            return key; // fallback: キーそのまま返す
        }
    }

    if (typeof str !== 'string') return key;

    if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
            str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
    }

    return str;
}

// シンプルなi18nユーティリティオブジェクト
const i18n = {
    t: (key: string, vars?: Record<string, string | number>): string => {
        const locale = getCurrentLocale();
        return translateText(key, locale, vars);
    },
    getCurrentLocale,
};

export default i18n;

"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ja } from "./translations/ja"
import { en } from "./translations/en"

// 利用可能な言語
export type Locale = "ja" | "en"

// 翻訳データの型
type TranslationData = typeof ja

// i18nコンテキストの型
interface I18nContextType {
  locale: Locale
  t: (key: string) => string
  changeLocale: (locale: Locale) => void
}

// デフォルト値
const defaultContext: I18nContextType = {
  locale: "ja",
  t: (key: string) => key,
  changeLocale: () => {},
}

// コンテキストの作成
const I18nContext = createContext<I18nContextType>(defaultContext)

// 翻訳データ
const translations: Record<Locale, TranslationData> = {
  ja,
  en,
}

// プロバイダーコンポーネント
export function I18nProvider({ children }: { children: ReactNode }) {
  // ローカルストレージから言語設定を読み込む
  const [locale, setLocale] = useState<Locale>("ja")

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale | null
    if (savedLocale && (savedLocale === "ja" || savedLocale === "en")) {
      setLocale(savedLocale)
    }
  }, [])

  // 言語を変更する関数
  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem("locale", newLocale)
  }

  // 翻訳関数
  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = translations[locale]

    for (const k of keys) {
      if (value === undefined) return key
      value = value[k]
    }

    return value === undefined ? key : value
  }

  return <I18nContext.Provider value={{ locale, t, changeLocale }}>{children}</I18nContext.Provider>
}

// フックの作成
export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

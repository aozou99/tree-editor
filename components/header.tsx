'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/tree-editor/features/language-switcher';
import { LoginButton } from '@/components/auth/login-button';
import { useEffect, useState } from 'react';

export function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <header className="w-full border-b py-4">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center">
            <Image
              src="/favicon.svg"
              alt="TreeEditor"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold leading-none flex items-center">TreeEditor</span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center rounded-md text-sm transition-colors bg-background hover:bg-muted "
            aria-label="Toggle dark mode"
            type="button"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          <LoginButton />
        </div>
      </div>
    </header>
  );
}

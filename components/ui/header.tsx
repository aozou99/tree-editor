'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/tree-editor/features/language-switcher';

export function Header() {
    return (
        <header className='w-full border-b py-4'>
            <div className='container mx-auto px-6 flex items-center justify-between'>
                <Link href='/' className='flex items-center gap-2'>
                    <div className='flex items-center justify-center'>
                        <Image src='/favicon.svg' alt='TreeEditor' width={28} height={28} className='object-contain' />
                    </div>
                    <span className='text-xl font-bold leading-none flex items-center'>TreeEditor</span>
                </Link>

                <div className='flex items-center gap-2'>
                    <LanguageSwitcher />
                </div>
            </div>
        </header>
    );
}

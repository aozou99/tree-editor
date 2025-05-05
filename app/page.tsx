'use client';
import TreeEditor from '@/components/tree-editor';
import { I18nProvider } from '@/utils/i18n/i18n-context';

export default function Home() {
    return (
        <I18nProvider>
            <div className='container mx-auto p-6'>
                <TreeEditor />
            </div>
        </I18nProvider>
    );
}

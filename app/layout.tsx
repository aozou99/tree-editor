import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/ui/header';

const descriptions = {
    ja: 'NodeViewは、テキスト・画像・動画・音声など多様なノードを自由に定義・追加し、家系図や組織図、ジャンル分類など様々な情報を体系的に整理・公開できるキャッチーで柔軟なノードビューツールです。',
    en: 'NodeView is a catchy and flexible node viewer tool that lets you freely define and add various nodes such as text, images, videos, and audio, helping you systematically organize and publish information like family trees, org charts, and genre classifications.',
};

export async function generateMetadata({ params }: { params: { locale?: string } }): Promise<Metadata> {
    const locale = params?.locale === 'en' ? 'en' : 'ja';
    return {
        title: 'NodeView',
        description: descriptions[locale],
    };
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en'>
            <head>
                <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
                <link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />
                <link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
                <link rel='icon' type='image/png' sizes='48x48' href='/favicon-48x48.png' />
                <link rel='apple-touch-icon' sizes='180x180' href='/apple-touch-icon.png' />
            </head>
            <body>
                <Header />
                {children}
            </body>
        </html>
    );
}

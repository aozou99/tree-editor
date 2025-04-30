import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'v0 App',
    description: 'Created with v0',
    generator: 'v0.dev',
};

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
            <body>{children}</body>
        </html>
    );
}

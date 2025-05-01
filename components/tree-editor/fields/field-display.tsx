'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play, Pause, AlertCircle } from 'lucide-react';
import { CustomField } from '../types';
import { YouTubeEmbed } from '../media/youtube-embed';
import { useI18n } from '@/utils/i18n/i18n-context';

interface FieldDisplayProps {
    field: CustomField;
    displayLabel?: boolean; // ラベルを表示するかどうかのオプション
}

/**
 * カスタムフィールド表示用の共通コンポーネント（読み取り専用）
 */
export function FieldDisplay({ field, displayLabel = false }: FieldDisplayProps) {
    const { t } = useI18n();
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 音声の再生/一時停止を切り替え
    const toggleAudioPlayback = () => {
        const audioElement = audioRef.current;
        if (!audioElement) return;

        try {
            if (isAudioPlaying) {
                audioElement.pause();
            } else {
                audioElement.play();
            }
            setIsAudioPlaying(!isAudioPlaying);
        } catch (error) {
            console.error(t('media.audio.errors.playbackError'), error);
            setAudioError(t('media.audio.errors.playbackError'));
            setIsAudioPlaying(false);
        }
    };

    // 音声の再生が終了したときの処理
    const handleAudioEnded = () => {
        setIsAudioPlaying(false);
    };

    // 音声ロード時のエラー処理
    const handleAudioError = () => {
        setAudioError(t('dialogs.node.detail.audio.loadError'));
        setIsAudioPlaying(false);
    };

    // フィールドの値を表示する関数
    const renderFieldValue = () => {
        if (field.type === 'textarea') {
            return <div className='text-sm break-words whitespace-pre-wrap bg-muted/30 p-2 rounded-md'>{field.value}</div>;
        }

        if (field.type === 'link') {
            return (
                <div className='bg-muted/30 p-2 rounded-md'>
                    <a
                        href={field.value}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-600 hover:underline flex items-center'
                    >
                        {field.value}
                        <ExternalLink size={14} className='ml-1' />
                    </a>
                </div>
            );
        }

        if (field.type === 'youtube') {
            return (
                <div className='mt-1'>
                    <YouTubeEmbed url={field.value} />
                </div>
            );
        }

        if (field.type === 'image') {
            return (
                <div className='mt-1 border rounded-md p-1 bg-muted/20'>
                    {field.value && (
                        <img
                            src={field.value || '/placeholder.svg'}
                            alt={field.name}
                            className='max-h-[200px] w-auto object-contain rounded-md mx-auto'
                            onError={(e) => {
                                e.currentTarget.src = '/exclamation-mark-in-nature.png';
                            }}
                        />
                    )}
                </div>
            );
        }

        if (field.type === 'audio') {
            return (
                <div className='mt-1 p-2 bg-muted/30 rounded-md'>
                    {field.value && (
                        <div className='flex items-center gap-2'>
                            <Button
                                variant='outline'
                                size='icon'
                                className='h-10 w-10 rounded-full'
                                onClick={toggleAudioPlayback}
                            >
                                {isAudioPlaying ? <Pause size={18} /> : <Play size={18} />}
                            </Button>
                            <audio
                                ref={audioRef}
                                src={field.value}
                                onEnded={handleAudioEnded}
                                onError={handleAudioError}
                                className='hidden'
                            />
                            <div className='text-sm'>
                                {field.value.startsWith('data:audio/') ? t('media.audio.uploadedFile') : field.value}
                            </div>
                        </div>
                    )}
                    {audioError && (
                        <div className='mt-2 text-red-500 text-sm flex items-center'>
                            <AlertCircle size={16} className='mr-1' />
                            {audioError}
                        </div>
                    )}
                </div>
            );
        }

        // デフォルトはテキスト表示
        return <div className='text-sm bg-muted/30 p-2 rounded-md'>{field.value}</div>;
    };

    // フィールド全体のレイアウト
    return (
        <div className='field-display'>
            {displayLabel && (
                <div className='text-xs font-medium text-muted-foreground mb-1'>{field.name}</div>
            )}
            {renderFieldValue()}
        </div>
    );
}

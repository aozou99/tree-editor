'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Upload, Link, X, Volume2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/utils/i18n/i18n-context';

interface AudioUploadProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

export function AudioUpload({ value, onChange, className, disabled = false }: AudioUploadProps) {
    const [isUrlMode, setIsUrlMode] = useState(value && !value.startsWith('data:audio/'));
    const [audioUrl, setAudioUrl] = useState(isUrlMode ? value : '');
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { t } = useI18n();

    // 値が変更されたときにエラーをリセット
    useEffect(() => {
        setError(null);
    }, [value]);

    // ファイルをBase64に変換
    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    // ファイル選択時の処理
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // ファイルサイズチェック (10MB以下)
            if (file.size > 10 * 1024 * 1024) {
                setError(t('media.audio.errors.fileSizeLimit'));
                return;
            }

            // 音声ファイルかチェック
            if (!file.type.startsWith('audio/')) {
                setError(t('media.audio.errors.audioFileOnly'));
                return;
            }

            const base64 = await convertFileToBase64(file);
            onChange(base64);
            setIsUrlMode(false);
            setError(null);
        } catch (error) {
            console.error(t('debug.fileReadError'), error);
            setError(t('media.audio.errors.fileReadError'));
        }

        // ファイル選択をリセット（同じファイルを再選択できるように）
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // URL入力時の処理
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setAudioUrl(url);
        setError(null);
    };

    // URL確定時の処理
    const handleUrlSubmit = () => {
        if (audioUrl.trim()) {
            // URLの有効性を確認
            const testAudio = new Audio();
            testAudio.onerror = () => {
                setError(t('media.audio.errors.invalidUrl'));
            };
            testAudio.onloadedmetadata = () => {
                onChange(audioUrl.trim());
                setError(null);
            };
            testAudio.src = audioUrl.trim();
        }
    };

    // 音声をクリア
    const handleClearAudio = () => {
        onChange('');
        setAudioUrl('');
        setIsUrlMode(false);
        setIsPlaying(false);
        setError(null);
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    // 再生/一時停止の切り替え
    const togglePlayPause = () => {
        if (audioRef.current) {
            try {
                if (isPlaying) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                } else {
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                setIsPlaying(true);
                                setError(null);
                            })
                            .catch((error) => {
                                console.error(t('media.audio.errors.playbackError'), error);
                                setError(t('media.audio.errors.playbackError'));
                                setIsPlaying(false);
                            });
                    }
                }
            } catch (error) {
                console.error(t('media.audio.errors.playbackError'), error);
                setError(t('media.audio.errors.playbackError'));
                setIsPlaying(false);
            }
        }
    };

    // 再生終了時の処理
    const handleEnded = () => {
        setIsPlaying(false);
    };

    // 音声ロード時のエラー処理
    const handleAudioError = () => {
        setError(t('media.audio.errors.loadError'));
        setIsPlaying(false);
    };

    // 音声プレーヤーを表示
    const renderAudioPlayer = () => {
        if (!value) return null;

        return (
            <div className='relative mt-2 border rounded-md p-3'>
                <div className='flex items-center gap-3'>
                    <Button variant='outline' size='icon' className='h-10 w-10 rounded-full' onClick={togglePlayPause}>
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </Button>
                    <div className='flex-1 text-sm'>
                        {value.startsWith('data:audio/') ? t('media.audio.uploadedFile') : value}
                    </div>
                    <Button
                        variant='destructive'
                        size='icon'
                        className='h-8 w-8 rounded-full'
                        onClick={handleClearAudio}
                    >
                        <X size={16} />
                    </Button>
                </div>
                {error && (
                    <div className='mt-2 text-red-500 text-sm flex items-center'>
                        <AlertCircle size={16} className='mr-1' />
                        {error}
                    </div>
                )}
                <audio
                    ref={audioRef}
                    src={value}
                    onEnded={handleEnded}
                    onError={handleAudioError}
                    className='hidden'
                    controls
                />
            </div>
        );
    };

    return (
        <div className={className}>
            {value ? (
                // 音声が選択されている場合はプレーヤーを表示
                renderAudioPlayer()
            ) : (
                // 音声が選択されていない場合は入力フォームを表示
                <div className='space-y-2'>
                    <div className='flex gap-2'>
                        <Button
                            type='button'
                            variant={isUrlMode ? 'outline' : 'default'}
                            size='sm'
                            onClick={() => setIsUrlMode(false)}
                            className='flex-1'
                        >
                            <Upload size={16} className='mr-2' />
                            {t('media.audio.fileTab')}
                        </Button>
                        <Button
                            type='button'
                            variant={isUrlMode ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => setIsUrlMode(true)}
                            className='flex-1'
                        >
                            <Link size={16} className='mr-2' />
                            {t('media.audio.urlTab')}
                        </Button>
                    </div>

                    {isUrlMode ? (
                        <div className='flex flex-col gap-2'>
                            <div className='flex gap-2'>
                                <Input
                                    type='url'
                                    placeholder={t('media.audio.urlPlaceholder')}
                                    value={audioUrl}
                                    onChange={handleUrlChange}
                                    className='flex-1'
                                />
                                <Button type='button' size='sm' onClick={handleUrlSubmit} disabled={!audioUrl.trim()}>
                                    {t('media.audio.set')}
                                </Button>
                            </div>
                            {error && (
                                <div className='text-red-500 text-sm flex items-center'>
                                    <AlertCircle size={16} className='mr-1' />
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='border-2 border-dashed rounded-md p-4 text-center'>
                            <Label
                                htmlFor='audio-upload'
                                className='flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground'
                            >
                                <Volume2 size={24} />
                                <span>{t('media.audio.clickToSelect')}</span>
                                <span className='text-xs'>{t('media.audio.dragAndDrop')}</span>
                                <span className='text-xs text-muted-foreground'>{t('media.audio.formats')}</span>
                            </Label>
                            <Input
                                ref={fileInputRef}
                                id='audio-upload'
                                type='file'
                                accept='audio/*'
                                onChange={handleFileChange}
                                className='hidden'
                            />
                            {error && (
                                <div className='mt-2 text-red-500 text-sm flex items-center'>
                                    <AlertCircle size={16} className='mr-1' />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

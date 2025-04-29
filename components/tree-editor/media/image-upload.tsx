'use client';

import type React from 'react';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageIcon, Upload, Link, X } from 'lucide-react';
import { isBase64Image } from '@/components/tree-editor/utils/image-utils';

interface ImageUploadProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
    const [isUrlMode, setIsUrlMode] = useState(value && !isBase64Image(value));
    const [imageUrl, setImageUrl] = useState(isUrlMode ? value : '');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            // ファイルサイズチェック (5MB以下)
            if (file.size > 5 * 1024 * 1024) {
                alert('ファイルサイズは5MB以下にしてください');
                return;
            }

            // 画像ファイルかチェック
            if (!file.type.startsWith('image/')) {
                alert('画像ファイルを選択してください');
                return;
            }

            const base64 = await convertFileToBase64(file);
            onChange(base64);
            setIsUrlMode(false);
        } catch (error) {
            console.error('ファイルの読み込みに失敗しました:', error);
            alert('ファイルの読み込みに失敗しました');
        }

        // ファイル選択をリセット（同じファイルを再選択できるように）
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // URL入力時の処理
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setImageUrl(url);
    };

    // URL確定時の処理
    const handleUrlSubmit = () => {
        if (imageUrl.trim()) {
            onChange(imageUrl.trim());
        }
    };

    // 画像をクリア
    const handleClearImage = () => {
        onChange('');
        setImageUrl('');
        setIsUrlMode(false);
    };

    // 画像プレビュー
    const renderImagePreview = () => {
        if (!value) return null;

        return (
            <div className='relative mt-2 border rounded-md overflow-hidden'>
                <img
                    src={value || '/placeholder.svg'}
                    alt='プレビュー'
                    className='max-h-[200px] w-auto mx-auto object-contain'
                    onError={(e) => {
                        e.currentTarget.src = '/exclamation-mark-in-nature.png';
                    }}
                />
                <Button
                    variant='destructive'
                    size='icon'
                    className='absolute top-2 right-2 h-6 w-6 rounded-full opacity-80 hover:opacity-100'
                    onClick={handleClearImage}
                >
                    <X size={14} />
                </Button>
            </div>
        );
    };

    return (
        <div className={className}>
            {value ? (
                // 画像が選択されている場合はプレビューを表示
                renderImagePreview()
            ) : (
                // 画像が選択されていない場合は入力フォームを表示
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
                            ファイル
                        </Button>
                        <Button
                            type='button'
                            variant={isUrlMode ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => setIsUrlMode(true)}
                            className='flex-1'
                        >
                            <Link size={16} className='mr-2' />
                            URL
                        </Button>
                    </div>

                    {isUrlMode ? (
                        <div className='flex gap-2'>
                            <Input
                                type='url'
                                placeholder='https://example.com/image.jpg'
                                value={imageUrl}
                                onChange={handleUrlChange}
                                className='flex-1'
                            />
                            <Button type='button' size='sm' onClick={handleUrlSubmit} disabled={!imageUrl.trim()}>
                                設定
                            </Button>
                        </div>
                    ) : (
                        <div className='border-2 border-dashed rounded-md p-4 text-center'>
                            <Label
                                htmlFor='image-upload'
                                className='flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground'
                            >
                                <ImageIcon size={24} />
                                <span>クリックして画像を選択</span>
                                <span className='text-xs'>または画像をドラッグ＆ドロップ</span>
                            </Label>
                            <Input
                                ref={fileInputRef}
                                id='image-upload'
                                type='file'
                                accept='image/*'
                                onChange={handleFileChange}
                                className='hidden'
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

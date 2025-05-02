'use client';

import { FieldType } from '../types';

interface FieldTypeLabelProps {
    type: FieldType;
}

/**
 * フィールドタイプを色付きラベルで表示するコンポーネント
 * 表示モードと編集モードの両方で使用する共通コンポーネント
 */
export function FieldTypeLabel({ type }: FieldTypeLabelProps) {
    switch (type) {
        case 'text':
            return (
                <span className='ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded text-[10px]'>
                    Text
                </span>
            );
        case 'textarea':
            return (
                <span className='ml-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded text-[10px]'>
                    Text Area
                </span>
            );
        case 'link':
            return (
                <span className='ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded text-[10px]'>
                    URL
                </span>
            );
        case 'youtube':
            return (
                <span className='ml-2 px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded text-[10px]'>
                    YouTube
                </span>
            );
        case 'image':
            return (
                <span className='ml-2 px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded text-[10px]'>
                    Image
                </span>
            );
        case 'audio':
            return (
                <span className='ml-2 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 rounded text-[10px]'>
                    Audio
                </span>
            );
        default:
            return null;
    }
}
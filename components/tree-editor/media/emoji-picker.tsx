'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Smile } from 'lucide-react';
import { useI18n } from '@/utils/i18n/i18n-context';

// 絵文字カテゴリー
const emojiCategories = [
    {
        id: 'faces',
        emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
    },
    {
        id: 'people',
        emojis: ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳‍♂️', '🧕', '👮‍♀️', '👮‍♂️'],
    },
    {
        id: 'animals',
        emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧'],
    },
    {
        id: 'food',
        emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑'],
    },
    {
        id: 'activities',
        emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅'],
    },
    {
        id: 'travel',
        emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍'],
    },
    {
        id: 'objects',
        emojis: ['⌚', '📱', '📲', '💻', '⌨', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷'],
    },
    {
        id: 'symbols',
        emojis: ['❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    },
    {
        id: 'flags',
        emojis: ['🏳', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶'],
    },
    {
        id: 'folders',
        emojis: ['📁', '📂', '🗂️', '📋', '📑', '🗄️', '📊', '📈', '📉', '📇', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️'],
    },
    {
        id: 'documents',
        emojis: ['📝', '📄', '📃', '📜', '📰', '🗞️', '📑', '🔖', '🏷️', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗓️', '📇'],
    },
];

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    currentEmoji?: string;
    disabled?: boolean;
}

export function EmojiPicker({ onEmojiSelect, disabled = false }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEmojis, setFilteredEmojis] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('faces');
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const { t } = useI18n();

    // 検索クエリが変更されたときに絵文字をフィルタリング
    useEffect(() => {
        if (!searchQuery) {
            setFilteredEmojis([]);
            return;
        }

        const results: string[] = [];

        emojiCategories.forEach((category) => {
            category.emojis.forEach((emoji) => {
                if (results.length < 50 && !results.includes(emoji)) {
                    results.push(emoji);
                }
            });
        });

        setFilteredEmojis(results);
    }, [searchQuery]);

    // 絵文字を選択したときの処理
    const handleEmojiSelect = (emoji: string) => {
        onEmojiSelect(emoji);
        setIsOpen(false);
        setSearchQuery('');
    };

    // モーダルの外側をクリックしたときに閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className='relative'>
            <Button
                variant='outline'
                size='icon'
                className='h-10 w-10'
                onClick={() => setIsOpen(!isOpen)}
                title={t('media.emoji.title')}
                disabled={disabled}
            >
                <Smile size={18} />
            </Button>

            {isOpen && (
                <div
                    ref={modalRef}
                    className='absolute z-50 top-full right-0 mt-1 w-80 bg-white border rounded-md shadow-md'
                >
                    <div className='p-2 border-b'>
                        <div className='relative'>
                            <Search className='absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                            <Input
                                ref={inputRef}
                                placeholder={t('media.emoji.searchPlaceholder')}
                                className='pl-8'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {searchQuery ? (
                        <ScrollArea className='h-60 p-2'>
                            <div className='grid grid-cols-8 gap-1'>
                                {filteredEmojis.map((emoji, index) => (
                                    <Button
                                        key={`search-${index}`}
                                        variant='ghost'
                                        className='h-8 w-8 p-0 text-lg'
                                        onClick={() => handleEmojiSelect(emoji)}
                                    >
                                        {emoji}
                                    </Button>
                                ))}
                            </div>
                            {filteredEmojis.length === 0 && (
                                <div className='text-center py-4 text-sm text-muted-foreground'>
                                    {t('media.emoji.notFound')}
                                </div>
                            )}
                        </ScrollArea>
                    ) : (
                        <div>
                            <div className='border-b overflow-x-auto'>
                                <div className='flex p-1'>
                                    {emojiCategories.map((category) => (
                                        <Button
                                            key={category.id}
                                            variant={activeCategory === category.id ? 'default' : 'ghost'}
                                            className='text-xs px-2 py-1 h-7'
                                            onClick={() => setActiveCategory(category.id)}
                                        >
                                            {t(`media.emoji.categories.${category.id}`)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <ScrollArea className='h-60 p-2'>
                                <div className='grid grid-cols-8 gap-1'>
                                    {emojiCategories
                                        .find((category) => category.id === activeCategory)
                                        ?.emojis.map((emoji, index) => (
                                            <Button
                                                key={`${activeCategory}-${index}`}
                                                variant='ghost'
                                                className='h-8 w-8 p-0 text-lg'
                                                onClick={() => handleEmojiSelect(emoji)}
                                            >
                                                {emoji}
                                            </Button>
                                        ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    <div className='p-2 border-t flex justify-between items-center'>
                        <div className='text-xs text-muted-foreground'>{t('media.emoji.selectPrompt')}</div>
                        <Button variant='ghost' size='sm' onClick={() => setIsOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

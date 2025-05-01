'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Smile } from 'lucide-react';

// 絵文字カテゴリー
const emojiCategories = [
    {
        id: 'faces',
        name: '顔',
        emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
    },
    {
        id: 'people',
        name: '人物',
        emojis: ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳‍♂️', '🧕', '👮‍♀️', '👮‍♂️'],
    },
    {
        id: 'animals',
        name: '動物',
        emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧'],
    },
    {
        id: 'food',
        name: '食べ物',
        emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑'],
    },
    {
        id: 'activities',
        name: '活動',
        emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅'],
    },
    {
        id: 'travel',
        name: '旅行',
        emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍'],
    },
    {
        id: 'objects',
        name: '物',
        emojis: ['⌚', '📱', '📲', '💻', '⌨', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷'],
    },
    {
        id: 'symbols',
        name: '記号',
        emojis: ['❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    },
    {
        id: 'flags',
        name: '旗',
        emojis: ['🏳', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶'],
    },
    {
        id: 'folders',
        name: 'フォルダ',
        emojis: ['📁', '📂', '🗂️', '📋', '📑', '🗄️', '📊', '📈', '📉', '📇', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️'],
    },
    {
        id: 'documents',
        name: '書類',
        emojis: ['📝', '📄', '📃', '📜', '📰', '🗞️', '📑', '🔖', '🏷️', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗓️', '📇'],
    },
];

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    currentEmoji?: string;
    disabled?: boolean;
}

export function EmojiPicker({ onEmojiSelect, currentEmoji, disabled = false }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEmojis, setFilteredEmojis] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('faces');
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // 検索クエリが変更されたときに絵文字をフィルタリング
    useEffect(() => {
        if (!searchQuery) {
            setFilteredEmojis([]);
            return;
        }

        const query = searchQuery.toLowerCase();
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

    // アイコンが画像URLかどうかを判定
    const isIconUrl = (icon?: string) => {
        return icon?.startsWith('http');
    };

    return (
        <div className='relative'>
            <Button
                variant='outline'
                size='icon'
                className='h-10 w-10'
                onClick={() => setIsOpen(!isOpen)}
                title='絵文字を選択'
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
                                placeholder='絵文字を検索...'
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
                                    絵文字が見つかりません
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
                                            {category.name}
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
                        <div className='text-xs text-muted-foreground'>絵文字を選択してください</div>
                        <Button variant='ghost' size='sm' onClick={() => setIsOpen(false)}>
                            キャンセル
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DragPreviewProps {
    nodeId: string;
    nodeName: string;
}

export function DragPreview({ nodeId, nodeName }: DragPreviewProps) {
    const [mounted, setMounted] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setMounted(true);

        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', updateMousePosition);

        return () => {
            setMounted(false);
            window.removeEventListener('mousemove', updateMousePosition);
        };
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div
            className='fixed top-0 left-0 pointer-events-none bg-primary/10 border border-primary rounded px-2 py-1 text-sm z-50'
            style={{
                transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            }}
        >
            {nodeName}
        </div>,
        document.body,
    );
}

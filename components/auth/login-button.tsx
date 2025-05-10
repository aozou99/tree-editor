'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/utils/i18n/i18n-context';

export function LoginButton() {
    const { t } = useI18n();
    // if (session) {
    //     return (
    //         <DropdownMenu>
    //             <DropdownMenuTrigger asChild>
    //                 <Button variant='ghost' size='sm' className='relative h-8 w-8 rounded-full'>
    //                     <Avatar className='h-8 w-8'>
    //                         {session.user?.image ? (
    //                             <AvatarImage src={session.user.image} alt={session.user.name || 'User'} />
    //                         ) : (
    //                             <AvatarFallback>{session.user?.name?.charAt(0) || 'U'}</AvatarFallback>
    //                         )}
    //                     </Avatar>
    //                 </Button>
    //             </DropdownMenuTrigger>
    //             <DropdownMenuContent align='end'>
    //                 <DropdownMenuItem className='font-medium'>{session.user?.name || 'User'}</DropdownMenuItem>
    //                 <DropdownMenuItem onClick={async () => null}>{t('auth.logout')}</DropdownMenuItem>
    //             </DropdownMenuContent>
    //         </DropdownMenu>
    //     );
    // }

    return (
        <Button variant='outline' size='sm' onClick={async () => null}>
            {t('auth.login')}
        </Button>
    );
}

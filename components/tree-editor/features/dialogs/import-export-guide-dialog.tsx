'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useI18n } from '@/utils/i18n/i18n-context';

interface ImportExportGuideDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ImportExportGuideDialog({ isOpen, onClose }: ImportExportGuideDialogProps) {
    const { t } = useI18n();

    const exampleData = {
        tree: [
            {
                id: "node-1",
                name: "Root Node",
                description: "This is a root node",
                icon: "📁",
                nodeType: "folder",
                customFields: [
                    {
                        id: "field-1",
                        definitionId: "def-1",
                        value: "Example value"
                    }
                ],
                children: [
                    {
                        id: "node-2",
                        name: "Child Node",
                        description: "This is a child node",
                        icon: "📄",
                        nodeType: "document",
                        customFields: [],
                        children: []
                    }
                ]
            }
        ],
        nodeTypes: [
            {
                id: "folder",
                name: "Folder",
                description: "A folder type node",
                fieldDefinitions: [
                    {
                        id: "def-1",
                        name: "Status",
                        type: "text",
                        required: false,
                        defaultValue: "Active"
                    }
                ]
            },
            {
                id: "document",
                name: "Document",
                description: "A document type node",
                fieldDefinitions: []
            }
        ],
        treeTitle: "Example Tree",
        version: "1.0",
        exportDate: "2024-01-15T10:30:00.000Z"
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='max-w-4xl max-h-[80vh]'>
                <DialogHeader>
                    <DialogTitle>{t('dialogs.importExportGuide.title')}</DialogTitle>
                    <DialogDescription>{t('dialogs.importExportGuide.description')}</DialogDescription>
                </DialogHeader>
                <ScrollArea className='h-[60vh] w-full rounded-md border p-4'>
                    <div className='space-y-6'>
                        <section>
                            <h3 className='text-lg font-semibold mb-3'>{t('dialogs.importExportGuide.overview.title')}</h3>
                            <p className='text-sm text-muted-foreground mb-4'>
                                {t('dialogs.importExportGuide.overview.description')}
                            </p>
                        </section>

                        <section>
                            <h3 className='text-lg font-semibold mb-3'>{t('dialogs.importExportGuide.structure.title')}</h3>
                            <div className='space-y-3'>
                                <div>
                                    <h4 className='text-md font-medium mb-2'>{t('dialogs.importExportGuide.structure.required.title')}</h4>
                                    <ul className='text-sm space-y-1 ml-4'>
                                        <li>• <code className='bg-muted px-1 rounded'>tree</code>: {t('dialogs.importExportGuide.structure.required.tree')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>nodeTypes</code>: {t('dialogs.importExportGuide.structure.required.nodeTypes')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>treeTitle</code>: {t('dialogs.importExportGuide.structure.required.treeTitle')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>version</code>: {t('dialogs.importExportGuide.structure.required.version')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>exportDate</code>: {t('dialogs.importExportGuide.structure.required.exportDate')}</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className='text-lg font-semibold mb-3'>{t('dialogs.importExportGuide.nodeStructure.title')}</h3>
                            <div className='space-y-3'>
                                <div>
                                    <h4 className='text-md font-medium mb-2'>{t('dialogs.importExportGuide.nodeStructure.required.title')}</h4>
                                    <ul className='text-sm space-y-1 ml-4'>
                                        <li>• <code className='bg-muted px-1 rounded'>id</code>: {t('dialogs.importExportGuide.nodeStructure.required.id')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>name</code>: {t('dialogs.importExportGuide.nodeStructure.required.name')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>children</code>: {t('dialogs.importExportGuide.nodeStructure.required.children')}</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className='text-md font-medium mb-2'>{t('dialogs.importExportGuide.nodeStructure.optional.title')}</h4>
                                    <ul className='text-sm space-y-1 ml-4'>
                                        <li>• <code className='bg-muted px-1 rounded'>description</code>: {t('dialogs.importExportGuide.nodeStructure.optional.description')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>icon</code>: {t('dialogs.importExportGuide.nodeStructure.optional.icon')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>nodeType</code>: {t('dialogs.importExportGuide.nodeStructure.optional.nodeType')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>customFields</code>: {t('dialogs.importExportGuide.nodeStructure.optional.customFields')}</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className='text-lg font-semibold mb-3'>{t('dialogs.importExportGuide.nodeTypeStructure.title')}</h3>
                            <div className='space-y-3'>
                                <div>
                                    <h4 className='text-md font-medium mb-2'>{t('dialogs.importExportGuide.nodeTypeStructure.required.title')}</h4>
                                    <ul className='text-sm space-y-1 ml-4'>
                                        <li>• <code className='bg-muted px-1 rounded'>id</code>: {t('dialogs.importExportGuide.nodeTypeStructure.required.id')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>name</code>: {t('dialogs.importExportGuide.nodeTypeStructure.required.name')}</li>
                                        <li>• <code className='bg-muted px-1 rounded'>fieldDefinitions</code>: {t('dialogs.importExportGuide.nodeTypeStructure.required.fieldDefinitions')}</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className='text-lg font-semibold mb-3'>{t('dialogs.importExportGuide.rules.title')}</h3>
                            <ul className='text-sm space-y-2 ml-4'>
                                <li>• {t('dialogs.importExportGuide.rules.jsonFormat')}</li>
                                <li>• {t('dialogs.importExportGuide.rules.uniqueIds')}</li>
                                <li>• {t('dialogs.importExportGuide.rules.nodeTypeReferences')}</li>
                                <li>• {t('dialogs.importExportGuide.rules.customFieldReferences')}</li>
                                <li>• {t('dialogs.importExportGuide.rules.validStructure')}</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className='text-lg font-semibold mb-3'>{t('dialogs.importExportGuide.example.title')}</h3>
                            <p className='text-sm text-muted-foreground mb-3'>
                                {t('dialogs.importExportGuide.example.description')}
                            </p>
                            <pre className='bg-muted p-4 rounded-md text-xs overflow-x-auto'>
                                <code>{JSON.stringify(exampleData, null, 2)}</code>
                            </pre>
                        </section>

                        <section>
                            <h3 className='text-lg font-semibold mb-3'>{t('dialogs.importExportGuide.tips.title')}</h3>
                            <ul className='text-sm space-y-2 ml-4'>
                                <li>• {t('dialogs.importExportGuide.tips.exportFirst')}</li>
                                <li>• {t('dialogs.importExportGuide.tips.validateJson')}</li>
                                <li>• {t('dialogs.importExportGuide.tips.backupData')}</li>
                                <li>• {t('dialogs.importExportGuide.tips.idRegeneration')}</li>
                            </ul>
                        </section>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
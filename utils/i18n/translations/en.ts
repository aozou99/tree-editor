export const en = {
    common: {
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        close: 'Close',
        add: 'Add',
        search: 'Search',
        reset: 'Reset',
        import: 'Import',
        export: 'Export',
        lastSaved: 'Last saved',
    },
    header: {
        file: 'File',
        settings: 'Settings',
        addRootNode: 'Add Root Node',
        nodeTypeManagement: 'Node Type Management',
        sampleSelection: 'Sample Selection',
    },
    search: {
        placeholder: 'Search nodes... (e.g. type:employee department:sales)',
        help: {
            title: 'Search Help',
            basicSearch: {
                title: 'Basic Search',
                description: 'Search node names, thumbnails, and field values.',
                example: 'Example: Suzuki',
            },
            typeSearch: {
                title: 'Node Type Search',
                description: 'Search for specific node types.',
                example: 'Example: type:employee',
            },
            fieldSearch: {
                title: 'Field Search',
                description: 'Search for specific field values.',
                example: 'Example: department:sales',
            },
            combinedSearch: {
                title: 'Combined Search',
                description: 'Combine multiple search conditions.',
                example: 'Example: type:employee department:sales Suzuki',
            },
        },
    },
    tree: {
        dropHere: 'Drop here to add to root level',
        nodeName: 'Node Name',
        nodeType: 'Node Type',
    },
    workspace: {
        new: 'New Workspace',
        rename: 'Rename',
        delete: 'Delete',
        noWorkspaces: 'No workspaces',
    },
    toast: {
        workspaceCreated: 'Workspace "{{name}}" created',
        sampleChanged: 'Sample "{{name}}" loaded',
        dataReset: 'Data reset',
        exportComplete: 'Export complete',
        exportError: 'Export error',
        importError: 'Import error',
        importComplete: 'Import complete',
    },
    dialogs: {
        reset: {
            title: 'Confirm Reset',
            description: 'This will reset the current tree data to its initial state. Are you sure?',
        },
        import: {
            title: 'Import Tree Data',
            description: 'Import tree data in JSON format. Current data will be overwritten.',
            jsonData: 'JSON Data',
            placeholder: 'Paste JSON data here',
        },
    },
};

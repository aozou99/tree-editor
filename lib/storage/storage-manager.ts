import type { StorageAdapter } from './types';
import { LocalStorageAdapter } from './local-storage-adapter';
import { CloudStorageAdapter } from './cloud-storage-adapter';

class StorageManager {
    private isAuthenticated = false;
    private storageType: 'local' | 'cloud' = 'local';
    private localAdapter = new LocalStorageAdapter();
    private cloudAdapter = new CloudStorageAdapter();

    setAuthenticated(authenticated: boolean) {
        this.isAuthenticated = authenticated;
        if (!authenticated && this.storageType === 'cloud') {
            this.storageType = 'local';
        }
    }

    setStorageType(type: 'local' | 'cloud') {
        if (type === 'cloud' && !this.isAuthenticated) {
            throw new Error('Cannot use cloud storage without authentication');
        }
        this.storageType = type;
    }

    getCurrentStorageType(): 'local' | 'cloud' {
        return this.storageType;
    }

    isCloudAvailable(): boolean {
        return this.isAuthenticated;
    }

    getAdapter(): StorageAdapter {
        return this.storageType === 'cloud' ? this.cloudAdapter : this.localAdapter;
    }
}

export const storageManager = new StorageManager();
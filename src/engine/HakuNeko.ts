import { Initialize as InitBlacklist } from './Blacklist';
import { Initialize as InitFetchProvider } from './FetchProvider';
import { Initialize as InitGlobalSettings } from './SettingsGlobal';
import { Tags } from './Tags';
import { EventManager } from './EventManager';
import { PluginController } from './PluginController';
import { BookmarkPlugin } from './providers/BookmarkPlugin';
import { StorageController } from './StorageController';
import { SettingsManager } from './SettingsManager';
import { DownloadManager } from './DownloadManager';

export class HakuNeko {

    private readonly _eventManager: EventManager = new EventManager();
    private readonly _storageController: StorageController = new StorageController();
    private readonly _settingsManager: SettingsManager = new SettingsManager(this._storageController);
    private readonly _pluginController: PluginController = new PluginController(this._storageController, this._settingsManager);
    private readonly _bookmarkPlugin: BookmarkPlugin = new BookmarkPlugin(this._storageController, this._pluginController);
    private readonly _downloadManager: DownloadManager = new DownloadManager(this._storageController, this._settingsManager);

    public async Initialze(): Promise<void> {
        InitBlacklist();
        InitFetchProvider();
        await InitGlobalSettings(this.SettingsManager, this.EventManager);
    }

    public get Tags() {
        return Tags;
    }

    public get EventManager(): EventManager {
        return this._eventManager;
    }

    public get PluginController(): PluginController {
        return this._pluginController;
    }

    public get SettingsManager(): SettingsManager {
        return this._settingsManager;
    }

    public get BookmarkPlugin(): BookmarkPlugin {
        return this._bookmarkPlugin;
    }

    public get DownloadManager(): DownloadManager {
        return this._downloadManager;
    }
}
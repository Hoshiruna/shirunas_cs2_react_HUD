export type ActionHandler<T = any> = (data: T) => void;

export default class ActionManager {
    handlers: { [K in string]?: ActionHandler[] };

    constructor(){
        this.handlers = {}

        /*this.on('data', _data => {
        });*/
    }
    execute = <T = any>(eventName: string, argument?: T) => {
        const handlers = this.handlers[eventName] || [];
        for(const handler of handlers){
            handler(argument);
        }
    }

    on = <T = any>(eventName: string, handler: ActionHandler<T>) => {
        if(!this.handlers[eventName]) this.handlers[eventName] = [];
        this.handlers[eventName]!.push(handler);
    }

    off = (eventName: string, handler: ActionHandler) => {
        if(!this.handlers[eventName]) this.handlers[eventName] = [];
        this.handlers[eventName] = this.handlers[eventName]!.filter(h => h !== handler);
    }
}
export class ConfigManager {
    listeners: ActionHandler[];
    data: { [K in string]?: any };
    private launcherData: { [K in string]?: any };
    private standaloneDisplaySettings: { [K in string]?: string } | null;
    private standaloneUpperRightRotation: { [K in string]?: any } | null;

    constructor(){
        this.listeners = [];
        this.data = {};
        this.launcherData = {};
        this.standaloneDisplaySettings = null;
        this.standaloneUpperRightRotation = null;
    }
    save(data: { [K in string]?: any }){
        this.saveLauncher(data);
    }

    saveLauncher(data: { [K in string]?: any }){
        this.launcherData = data && typeof data === "object" ? data : {};
        this.recompute();
    }

    saveStandalone(
        displaySettings: { [K in string]?: string },
        upperRightRotation?: { [K in string]?: any }
    ){
        this.standaloneDisplaySettings = { ...displaySettings };
        if (upperRightRotation) {
            this.standaloneUpperRightRotation = {
                ...upperRightRotation,
                images: Array.isArray(upperRightRotation.images)
                    ? upperRightRotation.images.map((image: any) => ({ ...image }))
                    : [],
            };
        }
        this.recompute();
    }

    private recompute(){
        const launcherDisplaySettings =
            this.launcherData.display_settings &&
            typeof this.launcherData.display_settings === "object" &&
            !Array.isArray(this.launcherData.display_settings)
                ? this.launcherData.display_settings
                : {};
        const hasDisplaySettings =
            Object.keys(launcherDisplaySettings).length > 0 ||
            this.standaloneDisplaySettings !== null;
        const hasUpperRightRotation = this.standaloneUpperRightRotation !== null;

        this.data = {
            ...this.launcherData,
            ...(hasDisplaySettings
                ? {
                    display_settings: {
                        ...launcherDisplaySettings,
                        ...(this.standaloneDisplaySettings || {}),
                    },
                }
                : {}),
            ...(hasUpperRightRotation
                ? {
                    upper_right_rotation: {
                        ...this.standaloneUpperRightRotation,
                        images: Array.isArray(this.standaloneUpperRightRotation?.images)
                            ? this.standaloneUpperRightRotation.images.map((image: any) => ({ ...image }))
                            : [],
                    },
                }
                : {}),
        };
        this.execute();

        /*const listeners = this.listeners.get(eventName);
        if(!listeners) return false;
        listeners.forEach(callback => {
            if(argument) callback(argument);
            else callback();
        });
        return true;*/
    }

    execute(){
        const listeners = this.listeners;
        if(!listeners || !listeners.length) return false;
        listeners.forEach(listener => {
            listener(this.data);
        });
        return true;
    }

    onChange = (listener: ActionHandler) => {
        const listOfListeners = this.listeners || [];
        listOfListeners.push(listener);
        this.listeners = listOfListeners;

        return true;
    }

    off = (listener: ActionHandler) => {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

}

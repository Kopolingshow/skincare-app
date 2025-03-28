import { InAppMessageEventTypeMap, InAppMessageEventName } from "./models/InAppMessage";
export default class InAppMessages {
    private _inAppMessageClickListeners;
    private _willDisplayInAppMessageListeners;
    private _didDisplayInAppMessageListeners;
    private _willDismissInAppMessageListeners;
    private _didDismissInAppMessageListeners;
    private _processFunctionList;
    /**
     * Add event listeners for In-App Message click and/or lifecycle events.
     * @param event
     * @param listener
     * @returns
     */
    addEventListener<K extends InAppMessageEventName>(event: K, listener: (event: InAppMessageEventTypeMap[K]) => void): void;
    /**
     * Remove event listeners for In-App Message click and/or lifecycle events.
     * @param event
     * @param listener
     * @returns
     */
    removeEventListener<K extends InAppMessageEventName>(event: K, listener: (obj: InAppMessageEventTypeMap[K]) => void): void;
    /**
     * Add a trigger for the current user. Triggers are currently explicitly used to determine whether a specific IAM should be displayed to the user.
     * @param  {string} key
     * @param  {string} value
     * @returns void
     */
    addTrigger(key: string, value: string): void;
    /**
     * Add multiple triggers for the current user. Triggers are currently explicitly used to determine whether a specific IAM should be displayed to the user.
     * @param  {[key: string]: string} triggers
     * @returns void
     */
    addTriggers(triggers: {
        [key: string]: string;
    }): void;
    /**
     * Remove the trigger with the provided key from the current user.
     * @param  {string} key
     * @returns void
     */
    removeTrigger(key: string): void;
    /**
     * Remove multiple triggers from the current user.
     * @param  {string[]} keys
     * @returns void
     */
    removeTriggers(keys: string[]): void;
    /**
     * Clear all triggers from the current user.
     * @returns void
     */
    clearTriggers(): void;
    /**
     * Set whether in-app messaging is currently paused.
     * When set to true no IAM will be presented to the user regardless of whether they qualify for them.
     * When set to 'false` any IAMs the user qualifies for will be presented to the user at the appropriate time.
     * @param  {boolean} pause
     * @returns void
     */
    setPaused(pause: boolean): void;
    /**
     * Whether in-app messaging is currently paused.
     * @returns {Promise<boolean>}
     */
    getPaused(): Promise<boolean>;
}

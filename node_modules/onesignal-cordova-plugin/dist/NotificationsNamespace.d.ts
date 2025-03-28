import { NotificationEventName, NotificationEventTypeMap } from "./models/NotificationClicked";
export declare enum OSNotificationPermission {
    NotDetermined = 0,
    Denied = 1,
    Authorized = 2,
    Provisional = 3,// only available in iOS 12
    Ephemeral = 4
}
export default class Notifications {
    private _permissionObserverList;
    private _notificationClickedListeners;
    private _notificationWillDisplayListeners;
    private _processFunctionList;
    private _permission?;
    /**
     * Sets initial permission value and adds observer for changes.
     * This internal method is kept to support the deprecated method {@link hasPermission}.
     */
    _setPropertyAndObserver(): void;
    /**
     * @deprecated This method is deprecated. It has been replaced by {@link getPermissionAsync}.
     */
    hasPermission(): boolean;
    /**
     * Whether this app has push notification permission. Returns true if the user has accepted permissions,
     * or if the app has ephemeral or provisional permission.
     */
    getPermissionAsync(): Promise<boolean>;
    /** iOS Only.
     * Returns the enum for the native permission of the device. It will be one of:
     * OSNotificationPermissionNotDetermined,
     * OSNotificationPermissionDenied,
     * OSNotificationPermissionAuthorized,
     * OSNotificationPermissionProvisional - only available in iOS 12,
     * OSNotificationPermissionEphemeral - only available in iOS 14
     *
     * @returns {Promise<OSNotificationPermission>}
     *
     * */
    permissionNative(): Promise<OSNotificationPermission>;
    /**
     * Prompt the user for permission to receive push notifications. This will display the native system prompt to request push notification permission.
     * Use the fallbackToSettings parameter to prompt to open the settings app if a user has already declined push permissions.
     *
     *
     * @param  {boolean} fallbackToSettings
     * @returns {Promise<boolean>}
     */
    requestPermission(fallbackToSettings?: boolean): Promise<boolean>;
    /**
     * Whether attempting to request notification permission will show a prompt. Returns true if the device has not been prompted for push notification permission already.
     * @returns {Promise<boolean>}
     */
    canRequestPermission(): Promise<boolean>;
    /**
     * iOS Only
     */
    /**
     * Instead of having to prompt the user for permission to send them push notifications, your app can request provisional authorization.
     *
     * For more information: https://documentation.onesignal.com/docs/ios-customizations#provisional-push-notifications
     *
     * @param  {(response: boolean)=>void} handler
     * @returns void
     */
    registerForProvisionalAuthorization(handler?: (response: boolean) => void): void;
    /**
     * Add listeners for notification events.
     * @param event
     * @param listener
     * @returns
     */
    addEventListener<K extends NotificationEventName>(event: K, listener: (event: NotificationEventTypeMap[K]) => void): void;
    /**
     * Remove listeners for notification events.
     * @param event
     * @param listener
     * @returns
     */
    removeEventListener<K extends NotificationEventName>(event: K, listener: (obj: NotificationEventTypeMap[K]) => void): void;
    /**
     * Removes all OneSignal notifications.
     * @returns void
     */
    clearAll(): void;
    /**
     * Android Only
     */
    /**
     * Android only.
     * Cancels a single OneSignal notification based on its Android notification integer ID. Use instead of Android's [android.app.NotificationManager.cancel], otherwise the notification will be restored when your app is restarted.
     * @param  {number} id - notification id to cancel
     * @returns void
     */
    removeNotification(id: number): void;
    /**
     * Android only.
     * Cancels a group of OneSignal notifications with the provided group key. Grouping notifications is a OneSignal concept, there is no [android.app.NotificationManager] equivalent.
     * @param  {string} id - notification group id to cancel
     * @returns void
     */
    removeGroupedNotifications(id: string): void;
}

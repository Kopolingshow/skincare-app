export interface PushSubscriptionState {
    id?: string;
    token?: string;
    optedIn: boolean;
}
export interface PushSubscriptionChangedState {
    previous: PushSubscriptionState;
    current: PushSubscriptionState;
}
export default class PushSubscription {
    private _id?;
    private _token?;
    private _optedIn?;
    private _subscriptionObserverList;
    private _processFunctionList;
    /**
     * Sets initial Push Subscription properties and adds observer for changes.
     * This internal method is kept to support the deprecated methods {@link id}, {@link token}, {@link optedIn}.
     */
    _setPropertiesAndObserver(): void;
    /**
     * @deprecated This method is deprecated. It has been replaced by {@link getIdAsync}.
     */
    get id(): string | null | undefined;
    /**
     * @deprecated This method is deprecated. It has been replaced by {@link getTokenAsync}.
     */
    get token(): string | null | undefined;
    /**
     * @deprecated This method is deprecated. It has been replaced by {@link getOptedInAsync}.
     */
    get optedIn(): boolean;
    /**
     * The readonly push subscription ID.
     * @returns {Promise<string | null>}
     */
    getIdAsync(): Promise<string | null>;
    /**
     * The readonly push token.
     * @returns {Promise<string | null>}
     */
    getTokenAsync(): Promise<string | null>;
    /**
     * Gets a boolean value indicating whether the current user is opted in to push notifications.
     * This returns true when the app has notifications permission and optOut() is NOT called.
     * Note: Does not take into account the existence of the subscription ID and push token.
     * This boolean may return true but push notifications may still not be received by the user.
     * @returns {Promise<boolean>}
     */
    getOptedInAsync(): Promise<boolean>;
    /**
     * Add a callback that fires when the OneSignal push subscription state changes.
     * @param  {(event: PushSubscriptionChangedState)=>void} listener
     * @returns void
     */
    addEventListener(event: "change", listener: (event: PushSubscriptionChangedState) => void): void;
    /**
     * Remove a push subscription observer that has been previously added.
     * @param  {(event: PushSubscriptionChangedState)=>void} listener
     * @returns void
     */
    removeEventListener(event: "change", listener: (event: PushSubscriptionChangedState) => void): void;
    /**
     * Call this method to receive push notifications on the device or to resume receiving of push notifications after calling optOut. If needed, this method will prompt the user for push notifications permission.
     * @returns void
     */
    optIn(): void;
    /**
     * If at any point you want the user to stop receiving push notifications on the current device (regardless of system-level permission status), you can call this method to opt out.
     * @returns void
     */
    optOut(): void;
}

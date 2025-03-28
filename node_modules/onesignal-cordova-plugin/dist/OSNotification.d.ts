export declare class OSNotification {
    body: string;
    sound?: string;
    title?: string;
    launchURL?: string;
    rawPayload: string;
    actionButtons?: object[];
    additionalData: object;
    notificationId: string;
    groupKey?: string;
    groupMessage?: string;
    groupedNotifications?: object[];
    ledColor?: string;
    priority?: number;
    smallIcon?: string;
    largeIcon?: string;
    bigPicture?: string;
    collapseId?: string;
    fromProjectNumber?: string;
    smallIconAccentColor?: string;
    lockScreenVisibility?: string;
    androidNotificationId?: number;
    badge?: string;
    badgeIncrement?: string;
    category?: string;
    threadId?: string;
    subtitle?: string;
    templateId?: string;
    templateName?: string;
    attachments?: object;
    mutableContent?: boolean;
    contentAvailable?: string;
    relevanceScore?: number;
    interruptionLevel?: string;
    constructor(receivedEvent: OSNotification);
    /**
     * Display the notification.
     * @returns void
     */
    display(): void;
}

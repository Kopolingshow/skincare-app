export declare enum LogLevel {
    None = 0,
    Fatal = 1,
    Error = 2,
    Warn = 3,
    Info = 4,
    Debug = 5,
    Verbose = 6
}
export default class Debug {
    /**
     * Enable logging to help debug if you run into an issue setting up OneSignal.
     * @param  {LogLevel} logLevel - Sets the logging level to print to the Android LogCat log or Xcode log.
     * @returns void
     */
    setLogLevel(logLevel: LogLevel): void;
    /**
     * Enable logging to help debug if you run into an issue setting up OneSignal.
     * @param  {LogLevel} visualLogLevel - Sets the logging level to show as alert dialogs.
     * @returns void
     */
    setAlertLevel(visualLogLevel: LogLevel): void;
}

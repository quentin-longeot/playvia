declare namespace webapis {
  namespace productinfo {
    function getVersion(): string;
    function getFirmware(): string;
    function getDuid(): string;
    function getModelCode(): string;
    function getModel(): string;
    function getSmartTVServerType(): number;
    function getSmartTVServerVersion(): string;
    function getTunerEpop(): string;
    function isSoccerModeEnabled(): boolean;
    function isTtvSupported(): boolean;
    function isUdPanelSupported(): boolean;
    function isUhdPanelSupported(): boolean;
    function getRealModel(): string;
    function getNoGlass3dSupport(): boolean;
    function getLocalSet(): string;
    function getSystemConfig(key: string): string;
    function setSystemConfig(key: string, value: string, successCallback?: () => void, errorCallback?: (error: Error) => void): void;
  }
}

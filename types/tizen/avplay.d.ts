declare namespace webapis {
  namespace avplay {
    type PlayerState = 'IDLE' | 'NONE' | 'PLAYING' | 'PAUSED' | 'READY';
    type DisplayMethod =
      | 'PLAYER_DISPLAY_MODE_FULL_SCREEN'
      | 'PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO'
      | 'PLAYER_DISPLAY_MODE_LETTER_BOX';

    interface AVPlayListener {
      onbufferingstart?: () => void;
      onbufferingprogress?: (percent: number) => void;
      onbufferingcomplete?: () => void;
      onstreamcompleted?: () => void;
      oncurrentplaytime?: (currentTime: number) => void;
      onevent?: (eventType: string, eventData: string) => void;
      onerror?: (eventType: string) => void;
    }

    function open(url: string): void;
    function close(): void;
    function prepare(): void;
    function prepareAsync(
      successCallback: () => void,
      errorCallback?: (error: Error) => void
    ): void;
    function play(): void;
    function pause(): void;
    function stop(): void;
    function getState(): PlayerState;
    function getDuration(): number;
    function getCurrentTime(): number;
    function jumpForward(milliseconds: number): void;
    function jumpBackward(milliseconds: number): void;
    function seekTo(milliseconds: number, successCallback?: () => void, errorCallback?: (error: Error) => void): void;
    function setSpeed(speed: number): void;
    function setDisplayRect(
      x: number,
      y: number,
      width: number,
      height: number
    ): void;
    function setDisplayMethod(method: DisplayMethod): void;
    function setStreamingProperty(key: string, value: string): void;
    function setListener(listener: AVPlayListener): void;
    function suspend(): void;
    function restore(): void;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    MOCKED_FALLBACK_VIDEO_URL: string;
    MOVIES_FOLDER: string;
    PLAYER_NAME: 'avplayer' | 'videoTag';
  }
}

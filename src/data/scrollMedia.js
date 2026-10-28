// Separate URLs prevent reuse of the previous 4K media cache.
export const scrollStreamDirectory = "stream-web-v4";
export const scrollStreamProfiles = [
  { id: "hevc", codec: "hevc", maxWidth: 2560, maxHeight: 1440, crf: 23, cacheVersion: 3 },
  { id: "avc", codec: "avc", maxWidth: 1920, maxHeight: 1080, crf: 21, cacheVersion: 4 },
];

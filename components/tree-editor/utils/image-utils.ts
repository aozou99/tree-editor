// 画像URLかどうかを判定する関数
export const isImageUrl = (url?: string) => {
  return url?.startsWith && url?.startsWith('http');
};

// Base64画像かどうかを判定する関数
export const isBase64Image = (str?: string) => {
  return (
    str?.startsWith &&
    (str?.startsWith('data:image/') || str?.match(/^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,/))
  );
};

// Base64音声かどうかを判定する関数
export const isBase64Audio = (str?: string) => {
  return str?.startsWith && str?.startsWith('data:audio/');
};
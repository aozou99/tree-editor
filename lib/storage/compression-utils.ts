import pako from 'pako';

/**
 * データ圧縮・展開のユーティリティ関数
 */

export interface CompressionResult {
  data: string;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface CompressionOptions {
  enabled?: boolean;
  minSizeThreshold?: number; // 最小圧縮対象サイズ（bytes）
  level?: number; // 圧縮レベル (1-9)
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  enabled: true,
  minSizeThreshold: 1024, // 1KB以上で圧縮
  level: 6, // 中程度の圧縮レベル
};

/**
 * データを圧縮する
 */
export function compressData(data: any, options: CompressionOptions = {}): CompressionResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const jsonString = JSON.stringify(data);
  const originalSize = new TextEncoder().encode(jsonString).length;

  // 圧縮が無効または最小サイズ未満の場合はそのまま返す
  if (!opts.enabled || originalSize < opts.minSizeThreshold) {
    return {
      data: jsonString,
      compressed: false,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1.0,
    };
  }

  try {
    // gzip圧縮を実行
    const compressed = pako.gzip(jsonString, { level: opts.level });
    const compressedBase64 = btoa(String.fromCharCode(...compressed));
    const compressedSize = new TextEncoder().encode(compressedBase64).length;
    const compressionRatio = compressedSize / originalSize;

    // 圧縮効果が少ない場合は元データを返す
    if (compressionRatio > 0.9) {
      return {
        data: jsonString,
        compressed: false,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1.0,
      };
    }

    return {
      data: compressedBase64,
      compressed: true,
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error) {
    console.warn('Compression failed, using uncompressed data:', error);
    return {
      data: jsonString,
      compressed: false,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1.0,
    };
  }
}

/**
 * データを展開する
 */
export function decompressData(compressedData: string, isCompressed: boolean = false): any {
  if (!isCompressed) {
    return JSON.parse(compressedData);
  }

  try {
    // Base64からバイナリに変換
    const compressed = new Uint8Array(
      atob(compressedData).split('').map(c => c.charCodeAt(0))
    );
    
    // gzip展開
    const decompressed = pako.ungzip(compressed, { to: 'string' });
    return JSON.parse(decompressed);
  } catch (error) {
    console.warn('Decompression failed, trying as uncompressed data:', error);
    try {
      return JSON.parse(compressedData);
    } catch (parseError) {
      console.error('Failed to parse data as JSON:', parseError);
      throw new Error('Data decompression and parsing failed');
    }
  }
}

/**
 * 圧縮統計を記録する
 */
export class CompressionStats {
  private static instance: CompressionStats;
  private stats: {
    totalOriginalSize: number;
    totalCompressedSize: number;
    compressionCount: number;
    averageRatio: number;
  } = {
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    compressionCount: 0,
    averageRatio: 0,
  };

  static getInstance(): CompressionStats {
    if (!CompressionStats.instance) {
      CompressionStats.instance = new CompressionStats();
    }
    return CompressionStats.instance;
  }

  recordCompression(result: CompressionResult): void {
    this.stats.totalOriginalSize += result.originalSize;
    this.stats.totalCompressedSize += result.compressedSize;
    this.stats.compressionCount += 1;
    this.stats.averageRatio = this.stats.totalCompressedSize / this.stats.totalOriginalSize;
  }

  getStats() {
    return {
      ...this.stats,
      totalSavings: this.stats.totalOriginalSize - this.stats.totalCompressedSize,
      savingsPercentage: ((this.stats.totalOriginalSize - this.stats.totalCompressedSize) / this.stats.totalOriginalSize) * 100,
    };
  }

  reset(): void {
    this.stats = {
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      compressionCount: 0,
      averageRatio: 0,
    };
  }
}

/**
 * 圧縮効果をログ出力する
 */
export function logCompressionResult(operation: string, result: CompressionResult): void {
  if (result.compressed) {
    const savingsKB = (result.originalSize - result.compressedSize) / 1024;
    const savingsPercent = ((1 - result.compressionRatio) * 100).toFixed(1);
    console.log(
      `[Compression] ${operation}: ${(result.originalSize / 1024).toFixed(1)}KB → ${(result.compressedSize / 1024).toFixed(1)}KB ` +
      `(${savingsPercent}% reduction, saved ${savingsKB.toFixed(1)}KB)`
    );
  } else {
    console.log(`[Compression] ${operation}: ${(result.originalSize / 1024).toFixed(1)}KB (uncompressed)`);
  }
}
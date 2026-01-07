/**
 * PWA 图标生成脚本
 * 
 * 使用方法：bun run scripts/generate-pwa-icons.ts
 * 
 * 生成 Cygnus-OS 风格的 PWA 图标：
 * - 深色背景（slate-900）
 * - 琥珀色图标（amber-500）
 * - 简洁的 "C" 标识
 */

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// 图标尺寸
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// 颜色配置
const backgroundColor = '#0f172a'; // slate-900
const foregroundColor = '#f59e0b'; // amber-500
const accentColor = '#fbbf24'; // amber-400

/**
 * 生成 SVG 图标
 */
function generateSVG(size: number): string {
  const padding = Math.floor(size * 0.15);
  const center = size / 2;
  const radius = (size - padding * 2) / 2;
  
  // 计算 "C" 字母的路径
  const fontSize = Math.floor(size * 0.5);
  const textY = center + fontSize * 0.35;
  
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- 背景 -->
  <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
  
  <!-- 外圈光晕 -->
  <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.3"/>
  
  <!-- 内圈 -->
  <circle cx="${center}" cy="${center}" r="${radius * 0.85}" fill="none" stroke="${foregroundColor}" stroke-width="3" opacity="0.6"/>
  
  <!-- 中心文字 "C" -->
  <text 
    x="${center}" 
    y="${textY}" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="${foregroundColor}" 
    text-anchor="middle"
  >C</text>
  
  <!-- 装饰点 -->
  <circle cx="${center + radius * 0.7}" cy="${center - radius * 0.5}" r="${size * 0.03}" fill="${accentColor}" opacity="0.8"/>
  <circle cx="${center + radius * 0.5}" cy="${center - radius * 0.7}" r="${size * 0.02}" fill="${accentColor}" opacity="0.6"/>
</svg>`.trim();
}

/**
 * 生成 PNG 图标
 */
async function generateIcon(size: number, outputDir: string): Promise<void> {
  const svg = generateSVG(size);
  const outputPath = `${outputDir}/icon-${size}x${size}.png`;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  
  console.log(`✓ Generated: ${outputPath}`);
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const outputDir = 'public/icons';
  
  // 创建输出目录
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }
  
  console.log('🎨 Generating PWA icons for Cygnus-OS...\n');
  console.log(`📂 Output directory: ${outputDir}`);
  console.log(`🎨 Background: ${backgroundColor}`);
  console.log(`🎨 Foreground: ${foregroundColor}\n`);
  
  // 生成所有尺寸
  for (const size of sizes) {
    await generateIcon(size, outputDir);
  }
  
  console.log('\n✅ All icons generated successfully!');
  console.log('\n📋 Files created:');
  sizes.forEach(size => {
    console.log(`   - icon-${size}x${size}.png`);
  });
}

main().catch(console.error);


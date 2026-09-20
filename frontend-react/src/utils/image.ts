/**
 * 生成装饰插画图的 URL（SDXL 文生图）
 */
export const imageUrl = (prompt: string, imageSize = 'square') =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt
  )}&image_size=${imageSize}`
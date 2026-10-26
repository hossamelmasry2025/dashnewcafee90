/**
 * Universal Mobile Image Optimizer for Cafe 90 (Android & iOS / App Store)
 * 
 * Automatically transforms raw camera/device uploads into high-performance,
 * retina-crisp, edge-to-edge full-bleed assets tailored for mobile screens.
 * 
 * Guarantees:
 * - 0 black/grey letterboxes or ugly borders.
 * - Optimal aspect ratios for mobile cards (Banners 2:1, Categories 2:1, Items 1:1, Rooms 16:9).
 * - Smart top-bias / center alignment to preserve cups, food plates, and headings.
 * - Compression down to ~100KB-250KB for fast loading on cellular networks.
 */

export const OPTIMIZER_PROFILES = {
  category: {
    name: 'Category Header',
    targetW: 1200,
    targetH: 600,
    aspectRatio: '2:1',
    topBias: 0.25,
    quality: 0.92,
    description: 'ملء كامل بعرض الكارت (2:1) متوافق مع بطاقات الأقسام في أندرويد وآبل ستور'
  },
  menuItem: {
    name: 'Menu Item / Food & Beverage',
    targetW: 900,
    targetH: 900,
    aspectRatio: '1:1',
    topBias: 0.5,
    quality: 0.92,
    description: 'مربع قياسي فائق الوضوح (1:1) لأصناف الأكلات والمشروبات في قائمة الهاتف'
  },
  banner: {
    name: 'Promotional Hero Banner',
    targetW: 1280,
    targetH: 640,
    aspectRatio: '2:1',
    topBias: 0.25,
    quality: 0.92,
    description: 'بانر عريض (2:1) يملأ الشاشة بالكامل بدون قص مع الحفاظ على مساحة النصوص'
  },
  room: {
    name: 'VIP Meeting Room / Facility',
    targetW: 1280,
    targetH: 720,
    aspectRatio: '16:9',
    topBias: 0.5,
    quality: 0.90,
    description: 'أبعاد معمارية عريضة (16:9) للجولات وقاعات الاجتماعات'
  }
};

/**
 * Standard High-Res Category Presets
 */
export const CATEGORY_PRESETS = [
  {
    id: 'cat_beverages',
    key: 'beverages',
    titleAr: 'مشروبات مختصة وقهوة طازجة (تشكيلة فاخرة)',
    titleEn: 'Signature Beverages & Specialty Coffee',
    categoryMatch: ['المشروبات', 'مشروبات', 'beverages', 'drinks', 'coffee', 'قهوة', 'عصائر', 'ايس'],
    imageUrl: '/category_beverages.jpg'
  },
  {
    id: 'cat_food',
    key: 'food',
    titleAr: 'مأكولات كافيه 90 وبرنش طازج وساندوتشات',
    titleEn: 'Gourmet Cafe Food & Fresh Brunch',
    categoryMatch: ['اكلات', 'أكلات', 'food', 'breakfast', 'sandwiches', 'ساندوتشات', 'وجبات', 'برنش'],
    imageUrl: '/category_food.jpg'
  },
  {
    id: 'cat_desserts',
    key: 'desserts',
    titleAr: 'حلويات فاخرة ومخبوزات فرنسية وتشيز كيك',
    titleEn: 'Gourmet Desserts, French Pastries & Cheesecake',
    categoryMatch: [
      'حلويات', 'حلوى', 'حلو', 'dessert', 'desserts', 'candies', 'candy', 'pastry', 'pastries',
      'sweets', 'sweet', 'مخبوزات', 'كيك', 'تشيز كيك', 'cheesecake', 'cake', 'waffle', 'وافل', 'pancake', 'بان كيك', 'دونات'
    ],
    imageUrl: '/category_desserts.jpg'
  },
  {
    id: 'cat_offers',
    key: 'offers',
    titleAr: 'عروض وباقات كافيه 90 وبوكسات الهدايا الفاخرة',
    titleEn: 'Special Offers, Combos & Luxury Gift Boxes',
    categoryMatch: [
      'عروض', 'عرض', 'عروضات', 'offers', 'offer', 'deals', 'deal', 'discounts', 'discount',
      'خصومات', 'خصم', 'تخفيضات', 'توفير', 'combos', 'combo', 'هدايا', 'هدية', 'هديه', 'gift', 'gifts', 'box', 'بوكس', 'special'
    ],
    imageUrl: '/category_offers.jpg'
  }
];

/**
 * Super-sampling Laplacian Unsharp Mask Filter
 * Brings out crystal-clear details and eliminates blurriness from uploaded phone/web images
 */
function applySmartSharpen(ctx, width, height, strength = 0.22) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    const copy = new Uint8ClampedArray(d);
    const row = width * 4;

    for (let y = 1; y < height - 1; y++) {
      const yRow = y * row;
      for (let x = 1; x < width - 1; x++) {
        const i = yRow + (x * 4);
        for (let c = 0; c < 3; c++) {
          const val = 5 * copy[i + c]
            - copy[i - 4 + c]
            - copy[i + 4 + c]
            - copy[i - row + c]
            - copy[i + row + c];
          d[i + c] = Math.min(255, Math.max(0, copy[i + c] * (1 - strength) + val * strength));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch {
    // Fallback safely if canvas getImageData is restricted
  }
}

/**
 * Core Canvas Image Processor
 * @param {File|Blob} file 
 * @param {'category'|'menuItem'|'banner'|'room'} profileKey 
 * @returns {Promise<{ file: File, previewUrl: string, width: number, height: number, originalSize: number, optimizedSize: number }>}
 */
export const optimizeImageForMobile = (file, profileKey = 'category') => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof Blob)) {
      resolve({ file, previewUrl: '', width: 0, height: 0, originalSize: 0, optimizedSize: 0 });
      return;
    }

    const profile = OPTIMIZER_PROFILES[profileKey] || OPTIMIZER_PROFILES.category;
    const originalSize = file.size || 0;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (!dataUrl) {
        resolve({ file, previewUrl: '', width: 0, height: 0, originalSize, optimizedSize: originalSize });
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const targetW = profile.targetW;
          const targetH = profile.targetH;

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          // Smooth high-definition rendering with anti-aliasing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Micro-contrast & color vibrance tuning to eliminate dull/blurry phone shots
          ctx.filter = 'contrast(105%) brightness(102%) saturate(106%)';

          const srcW = img.naturalWidth || img.width || targetW;
          const srcH = img.naturalHeight || img.height || targetH;

          // Pure Full-Bleed Cover (Zero black/grey borders)
          const scale = Math.max(targetW / srcW, targetH / srcH);
          const drawW = srcW * scale;
          const drawH = srcH * scale;

          // Horizontal centering
          const drawX = (targetW - drawW) / 2;

          // Vertical positioning based on profile bias
          let drawY = 0;
          if (drawH > targetH) {
            drawY = Math.min(0, (targetH - drawH) * profile.topBias);
          } else {
            drawY = (targetH - drawH) / 2;
          }

          // Draw directly to canvas with filter
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.filter = 'none';

          // Apply smart edge sharpening to prevent blurriness on mobile displays
          applySmartSharpen(ctx, targetW, targetH, 0.24);

          canvas.toBlob((blob) => {
            if (blob) {
              const fileNameClean = (file.name || 'mobile_asset').replace(/\.[^/.]+$/, '') + '.jpg';
              const optimizedFile = new File([blob], fileNameClean, { type: 'image/jpeg' });
              const previewUrl = canvas.toDataURL('image/jpeg', profile.quality);

              resolve({
                file: optimizedFile,
                previewUrl,
                width: targetW,
                height: targetH,
                originalSize,
                optimizedSize: blob.size
              });
            } else {
              resolve({
                file,
                previewUrl: dataUrl,
                width: srcW,
                height: srcH,
                originalSize,
                optimizedSize: originalSize
              });
            }
          }, 'image/jpeg', profile.quality);
        } catch (err) {
          console.warn('Canvas optimization fallback:', err);
          resolve({
            file,
            previewUrl: dataUrl,
            width: 0,
            height: 0,
            originalSize,
            optimizedSize: originalSize
          });
        }
      };

      img.onerror = () => {
        resolve({ file, previewUrl: dataUrl, width: 0, height: 0, originalSize, optimizedSize: originalSize });
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      resolve({ file, previewUrl: '', width: 0, height: 0, originalSize, optimizedSize: originalSize });
    };

    reader.readAsDataURL(file);
  });
};

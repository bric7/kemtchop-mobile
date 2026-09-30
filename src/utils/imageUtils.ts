// utils/imageUtils.ts
import { Platform } from 'react-native';

const CLOUDINARY_CONFIG = {
  cloudName: 'dqk85euoh',
  folder: 'kemtchop/products',
  transformations: {
    web: 'w_400,h_300,c_fill,q_auto,f_auto',
    mobile: 'w_300,h_250,c_fill,q_auto,f_auto',
  }
};

export const processImageUrl = (
  url: string | null | undefined,
  productName: string = 'Product'
): string => {
  if (!url) {
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(productName)}`;
  }

  // Déjà une URL Cloudinary valide
  if (url.startsWith('https://res.cloudinary.com/')) {
    return url;
  }

  // URL du backend Railway → convertir en Cloudinary
  if (url.includes('railway.app')) {
    const fileNameMatch = url.match(/\/videos\/([^/]+\.(jpg|jpeg|png|webp|gif))$/i);
    if (fileNameMatch?.[1]) {
      const fileName = fileNameMatch[1];
      const transformation = Platform.OS === 'web' 
        ? CLOUDINARY_CONFIG.transformations.web 
        : CLOUDINARY_CONFIG.transformations.mobile;
      
      return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformation}/${CLOUDINARY_CONFIG.folder}/${fileName}`;
    }
  }

  // URL HTTP standard
  if (url.startsWith('http')) {
    return url.replace('http://', 'https://');
  }

  // Fallback
  return `https://via.placeholder.com/300x200?text=${encodeURIComponent(productName)}`;
};
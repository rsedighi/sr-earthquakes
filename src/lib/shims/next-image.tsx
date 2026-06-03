import React from 'react';

interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | { src: string; height: number; width: number; blurDataURL?: string };
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  unoptimized?: boolean;
}

const Image = ({
  src,
  alt,
  width,
  height,
  fill,
  priority: _priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  unoptimized: _unoptimized,
  style,
  ...props
}: ImageProps) => {
  const resolvedSrc = typeof src === 'string' ? src : src.src;
  const fillStyle: React.CSSProperties = fill
    ? { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : (style ?? {});

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      style={fillStyle}
      {...props}
    />
  );
};

export default Image;

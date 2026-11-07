import { useState } from 'react';
import { useT } from './lib/i18n';

type LoadingImageProps = {
  src: string;
  alt: string;
  className: string;
  imageClassName?: string;
  loading?: 'lazy' | 'eager';
};

export function LoadingImage(props: LoadingImageProps) {
  return <ImageContent key={props.src} {...props} />;
}

function ImageContent({ src, alt, className, imageClassName = '', loading }: LoadingImageProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const t = useT();
  return (
    <div className={`loading-image ${className}`}>
      {state === 'loading' && <span className="loading-indicator__spinner loading-image__spinner" aria-hidden="true" />}
      {state === 'error' && <span className="loading-image__error">{t('Image indisponible')}</span>}
      {state !== 'error' && (
        <img src={src} alt={alt} loading={loading} onLoad={() => setState('loaded')} onError={() => setState('error')} className={`h-full w-full object-cover ${state === 'loading' ? 'opacity-0' : ''} ${imageClassName}`} />
      )}
    </div>
  );
}

import { useIsMutating } from '@tanstack/react-query';
import { useT } from './lib/i18n';

export function LoadingIndicator({ panel = false }: { panel?: boolean }) {
  const t = useT();
  return (
    <div role="status" className={panel ? 'loading-indicator loading-indicator--panel' : 'loading-indicator'}>
      <span className="loading-indicator__spinner" aria-hidden="true" />
      <span>{t('Chargement en cours…')}</span>
    </div>
  );
}

export function MutationIndicator() {
  const pending = useIsMutating();
  return pending > 0 ? <div className="mutation-indicator"><LoadingIndicator /></div> : null;
}

export function LoadingError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div role="alert" className="loading-error">
      <span>{t('Impossible de charger ces données.')}</span>
      <button type="button" onClick={onRetry}>{t('Réessayer')}</button>
    </div>
  );
}

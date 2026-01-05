import { FC } from 'hono/jsx';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ text = '読み込み中...', size = 'md' }) => {
  const spinnerSize = size === 'sm' ? 'spinner-border-sm' : '';

  return (
    <div class="text-center py-5">
      <div class={`spinner-border text-primary ${spinnerSize}`} role="status">
        <span class="visually-hidden">{text}</span>
      </div>
      {text && <div class="mt-2 text-muted">{text}</div>}
    </div>
  );
};

interface LoadingOverlayProps {
  text?: string;
}

export const LoadingOverlay: FC<LoadingOverlayProps> = ({ text = '処理中...' }) => {
  return (
    <div
      class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style="background: rgba(0,0,0,0.5); z-index: 9999;"
    >
      <div class="card p-4 text-center">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">{text}</span>
        </div>
        <div>{text}</div>
      </div>
    </div>
  );
};

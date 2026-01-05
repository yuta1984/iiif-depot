import { FC } from 'hono/jsx';

interface UserBadgeProps {
  user: {
    name: string;
    avatar_url: string | null;
  };
  size?: 'small' | 'medium' | 'large';
}

export const UserBadge: FC<UserBadgeProps> = ({ user, size = 'medium' }) => {
  const avatarSize = size === 'small' ? 24 : size === 'medium' ? 32 : 48;
  const fontSize = size === 'small' ? 'small' : '';

  return (
    <div class="d-flex align-items-center gap-2">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          class="rounded-circle"
          width={avatarSize}
          height={avatarSize}
          style="object-fit: cover;"
        />
      ) : (
        <div
          class="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold"
          style={`width: ${avatarSize}px; height: ${avatarSize}px; font-size: ${size === 'small' ? '0.75rem' : '1rem'};`}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span class={fontSize}>{user.name}</span>
    </div>
  );
};

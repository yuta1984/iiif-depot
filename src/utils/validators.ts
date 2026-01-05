export interface ValidationError {
  field: string;
  message: string;
}

export function validateProfileUpdate(name: string, profile: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate name
  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: '名前は必須です' });
  } else if (name.length > 100) {
    errors.push({ field: 'name', message: '名前は100文字以内で入力してください' });
  }

  // Validate profile
  if (profile && profile.length > 500) {
    errors.push({ field: 'profile', message: 'プロフィールは500文字以内で入力してください' });
  }

  return errors;
}

export function validateResourceMetadata(
  title: string,
  description?: string,
  attribution?: string,
  license?: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!title || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'タイトルは必須です' });
  } else if (title.length > 200) {
    errors.push({ field: 'title', message: 'タイトルは200文字以内で入力してください' });
  }

  if (description && description.length > 2000) {
    errors.push({ field: 'description', message: '説明は2000文字以内で入力してください' });
  }

  if (attribution && attribution.length > 500) {
    errors.push({ field: 'attribution', message: '帰属表示は500文字以内で入力してください' });
  }

  if (license && license.length > 200) {
    errors.push({ field: 'license', message: 'ライセンスは200文字以内で入力してください' });
  }

  return errors;
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

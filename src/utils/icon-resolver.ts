import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export function resolveIcon(name: string, fallback: LucideIcon): LucideIcon {
  const icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name];
  return typeof icon === 'function' ? icon : fallback;
}

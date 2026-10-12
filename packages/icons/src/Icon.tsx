import { icons, type IconName } from './generated/icons';
import type { IconProps } from './types';

/** Render an icon by name: `<Icon name="goal" size={20} title="Goal" />`. */
export function Icon({ name, ...props }: IconProps & { name: IconName }) {
  const Component = icons[name];
  return <Component {...props} />;
}

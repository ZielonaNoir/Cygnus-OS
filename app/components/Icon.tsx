'use client';

import { Icon as IconifyIcon, IconProps as IconifyIconProps } from '@iconify/react';

export interface IconProps extends Omit<IconifyIconProps, 'icon'> {
  icon: string;
}

export function Icon({ icon, className, ...props }: IconProps) {
  return <IconifyIcon icon={icon} className={className} {...props} />;
}


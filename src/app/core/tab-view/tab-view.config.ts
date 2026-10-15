export type TabId = 'training' | 'body' | 'overview' | 'calendar' | 'more';

export interface TabConfig {
  id: TabId;
  icon: string;
  activeIcon?: string;
  requiresAuth: boolean;
}

export const TABS: readonly TabConfig[] = [
  {
    id: 'training',
    icon: 'bicycle-outline',
    activeIcon: 'bicycle',
    requiresAuth: true,
  },
  {
    id: 'body',
    icon: 'body-outline',
    activeIcon: 'body',
    requiresAuth: true,
  },
  {
    id: 'overview',
    icon: 'person-outline',
    activeIcon: 'person',
    requiresAuth: false,
  },
  {
    id: 'calendar',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    requiresAuth: true,
  },
  {
    id: 'more',
    icon: 'ellipsis-horizontal',
    requiresAuth: true,
  },
];

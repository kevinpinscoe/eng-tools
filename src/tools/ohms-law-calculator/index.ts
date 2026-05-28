import { Bolt } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.ohms-law-calculator.title'),
  path: '/ohms-law-calculator',
  description: translate('tools.ohms-law-calculator.description'),
  keywords: ['ohm', 'ohms', 'law', 'voltage', 'current', 'resistance', 'watts', 'electronics', 'calculator'],
  component: () => import('./ohms-law-calculator.vue'),
  icon: Bolt,
  createdAt: new Date('2026-05-28'),
});

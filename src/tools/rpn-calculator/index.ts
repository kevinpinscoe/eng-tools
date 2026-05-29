import { Calculator } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.rpn-calculator.title'),
  path: '/rpn-calculator',
  description: translate('tools.rpn-calculator.description'),
  keywords: ['rpn', 'reverse', 'polish', 'notation', 'postfix', 'stack', 'calculator', 'expression'],
  component: () => import('./rpn-calculator.vue'),
  icon: Calculator,
  createdAt: new Date('2026-05-29'),
});

import { BaseSupportOption } from 'prettier';

const a: BaseSupportOption<any> = {
  name: 'my-app',
  category: 'bla',
  since: '1.0.0',
  type: 'boolean',
};

a.category.length;

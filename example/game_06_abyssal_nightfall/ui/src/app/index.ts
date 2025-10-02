import { AppDom } from './dom';
import { AppController } from './AppController';

const dom = new AppDom();
const controller = new AppController(dom);

controller.init().catch(err => {
  console.error('[abyssal-nightfall] App init failed', err);
});

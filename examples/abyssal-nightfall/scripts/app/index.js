import { AppDom } from './dom.js';
import { AppController } from './AppController.js';
const dom = new AppDom();
const controller = new AppController(dom);
controller.init().catch(err => {
    console.error('[abyssal-nightfall] App init failed', err);
});

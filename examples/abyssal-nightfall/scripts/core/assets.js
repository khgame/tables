import { clamp } from './utils.js';
export class AssetManager {
    constructor() {
        this.imageCache = new Map();
        this.audioCache = new Map();
        this.imagePromises = new Map();
        this.audioPromises = new Map();
        this.bgmInstance = null;
    }
    resolvePath(path) {
        if (!path)
            return '';
        if (/^https?:/i.test(path))
            return path;
        if (path.startsWith('./') || path.startsWith('/'))
            return path;
        return `./${path}`;
    }
    async loadImage(path) {
        if (!path)
            return null;
        if (this.imageCache.has(path)) {
            return this.imageCache.get(path) ?? null;
        }
        if (this.imagePromises.has(path)) {
            return this.imagePromises.get(path) ?? null;
        }
        const resolved = this.resolvePath(path);
        const promise = new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                this.imageCache.set(path, img);
                this.imagePromises.delete(path);
                resolve(img);
            };
            img.onerror = err => {
                console.warn('[abyssal-nightfall] 图片资源加载失败', path, err);
                this.imagePromises.delete(path);
                resolve(null);
            };
            img.src = resolved;
        });
        this.imagePromises.set(path, promise);
        return promise;
    }
    async loadAudio(path) {
        if (!path)
            return null;
        if (this.audioCache.has(path)) {
            return this.audioCache.get(path) ?? null;
        }
        if (this.audioPromises.has(path)) {
            return this.audioPromises.get(path) ?? null;
        }
        const resolved = this.resolvePath(path);
        const promise = new Promise(resolve => {
            const audio = new Audio();
            const cleanup = () => {
                audio.removeEventListener('canplaythrough', onReady);
                audio.removeEventListener('error', onError);
            };
            const onReady = () => {
                cleanup();
                this.audioCache.set(path, audio);
                this.audioPromises.delete(path);
                resolve(audio);
            };
            const onError = (err) => {
                cleanup();
                this.audioPromises.delete(path);
                console.warn('[abyssal-nightfall] 音频资源加载失败', path, err);
                resolve(null);
            };
            audio.addEventListener('canplaythrough', onReady, { once: true });
            audio.addEventListener('error', onError, { once: true });
            audio.src = resolved;
            audio.load();
        });
        this.audioPromises.set(path, promise);
        return promise;
    }
    getImage(path) {
        if (!path)
            return null;
        return this.imageCache.get(path) ?? null;
    }
    getAudio(path) {
        if (!path)
            return null;
        return this.audioCache.get(path) ?? null;
    }
    async preload(imagePaths, audioPaths) {
        const imagePromises = Array.from(new Set(imagePaths)).map(path => this.loadImage(path));
        const audioPromises = Array.from(new Set(audioPaths)).map(path => this.loadAudio(path));
        await Promise.all([...imagePromises, ...audioPromises]);
    }
    playSound(path, options = {}) {
        if (!path)
            return;
        const base = this.getAudio(path);
        if (!base)
            return;
        try {
            const instance = base.cloneNode(true);
            if (options.volume !== undefined) {
                instance.volume = clamp(options.volume, 0, 1);
            }
            instance.play().catch(err => console.warn('[abyssal-nightfall] 音效播放失败', path, err));
        }
        catch (err) {
            console.warn('[abyssal-nightfall] 音效实例化失败', path, err);
        }
    }
    playBgm(path, options = {}) {
        if (!path)
            return;
        if (this.bgmInstance) {
            this.bgmInstance.pause();
            this.bgmInstance.currentTime = 0;
            this.bgmInstance = null;
        }
        const audio = this.getAudio(path);
        if (!audio)
            return;
        const instance = audio.cloneNode(true);
        instance.loop = options.loop ?? true;
        if (options.volume !== undefined) {
            instance.volume = clamp(options.volume, 0, 1);
        }
        instance.play().catch(err => console.warn('[abyssal-nightfall] BGM 播放失败', path, err));
        this.bgmInstance = instance;
    }
    stopBgm() {
        if (!this.bgmInstance)
            return;
        this.bgmInstance.pause();
        this.bgmInstance.currentTime = 0;
        this.bgmInstance = null;
    }
}

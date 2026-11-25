import { ref, watch, onUnmounted, type Ref } from 'vue';

/**
 * 无限滚动哨兵：返回一个绑定到列表底部占位元素的 ref。
 * 元素进入视口（rootMargin 底部预取 300px）且 `enabled()` 为 true 时调用 `onHit()`；
 * 组件卸载自动断开观察。防重复由调用方的 `enabled()` 负责（在途/无更多时返回 false）。
 */
export function useInfiniteSentinel(onHit: () => void, enabled: () => boolean): Ref<HTMLElement | null> {
    const sentinel = ref<HTMLElement | null>(null);
    let observer: IntersectionObserver | null = null;

    const disconnect = () => {
        observer?.disconnect();
        observer = null;
    };

    watch(sentinel, (el) => {
        disconnect();
        if (!el) return;
        observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting) && enabled()) onHit();
        }, { rootMargin: '0px 0px 300px 0px' });
        observer.observe(el);
    });

    onUnmounted(disconnect);
    return sentinel;
}

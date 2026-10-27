/**
 * 一键复制文本。
 * Clipboard API 仅在安全上下文（HTTPS/localhost）可用；后台常经局域网 IP 以 HTTP 访问，
 * 此时直接走临时 textarea + execCommand，保证仍是一键复制且不弹 prompt。
 */
export const copy_text = async (text: string): Promise<boolean> => {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // 权限被拒等：继续尝试 execCommand
        }
    }
    try {
        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.top = '-9999px';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        return ok;
    } catch {
        return false;
    }
};

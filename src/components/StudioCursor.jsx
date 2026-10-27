import { useEffect, useRef } from "react";
import "../studio-cursor.css";

const interactive = 'a[href], button:not(:disabled), [role="button"]:not([aria-disabled="true"]), summary';
const nativeSurface = 'dialog, [popover]:popover-open, input, textarea, select, video, audio, iframe, [contenteditable]:not([contenteditable="false"]), [data-native-cursor], :disabled, [aria-disabled="true"]';

export default function StudioCursor({ enabled }) {
  const cursor = useRef(null);

  useEffect(() => {
    const element = cursor.current;
    const preference = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let request = 0, visible = false, previousTime = 0;
    let x = 0, y = 0, ringX = 0, ringY = 0;

    function hide() {
      visible = false;
      element.dataset.visible = "false";
      element.dataset.pressed = "false";
      document.documentElement.classList.remove("has-studio-cursor");
      cancelAnimationFrame(request);
      request = 0;
      previousTime = 0;
    }

    function draw(time) {
      request = 0;
      if (!visible) return;
      const delta = previousTime ? Math.min(time - previousTime, 40) : 16;
      previousTime = time;
      const ease = 1 - Math.exp(-delta / 48);
      ringX += (x - ringX) * ease;
      ringY += (y - ringY) * ease;
      element.style.setProperty("--cursor-x", `${x}px`);
      element.style.setProperty("--cursor-y", `${y}px`);
      element.style.setProperty("--ring-x", `${ringX}px`);
      element.style.setProperty("--ring-y", `${ringY}px`);
      if (Math.abs(x - ringX) + Math.abs(y - ringY) > .08) request = requestAnimationFrame(draw);
      else previousTime = 0;
    }

    function wake() {
      if (!request) request = requestAnimationFrame(draw);
    }

    function updateTarget(target) {
      // Top-layer dialogs and popovers keep their native pointer and controls.
      if (!enabled || !preference.matches || document.hidden || document.fullscreenElement ||
          !(target instanceof Element) || target.closest(nativeSurface) ||
          document.querySelector('dialog[open], [popover]:popover-open')) {
        hide();
        return false;
      }
      element.dataset.interactive = String(Boolean(target.closest(interactive)));
      return true;
    }

    function move(event) {
      if (event.pointerType !== "mouse") { hide(); return; }
      if (!updateTarget(event.target)) return;
      x = event.clientX;
      y = event.clientY;
      if (!visible) {
        ringX = x;
        ringY = y;
        element.style.setProperty("--cursor-x", `${x}px`);
        element.style.setProperty("--cursor-y", `${y}px`);
        element.style.setProperty("--ring-x", `${x}px`);
        element.style.setProperty("--ring-y", `${y}px`);
      }
      visible = true;
      element.dataset.visible = "true";
      document.documentElement.classList.add("has-studio-cursor");
      wake();
    }

    function press(event) {
      if (visible && event.pointerType === "mouse" && event.button === 0) element.dataset.pressed = "true";
    }

    function release() { element.dataset.pressed = "false"; }

    function scroll() {
      if (!visible) return;
      updateTarget(document.elementFromPoint(x, y));
    }

    function toggle(event) {
      if (event.newState === "open") hide();
    }

    if (!enabled) { hide(); return hide; }
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", hide, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("blur", hide);
    document.documentElement.addEventListener("pointerleave", hide);
    document.addEventListener("visibilitychange", hide);
    document.addEventListener("fullscreenchange", hide);
    document.addEventListener("beforetoggle", toggle, true);
    preference.addEventListener("change", hide);
    return () => {
      hide();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", hide);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("blur", hide);
      document.documentElement.removeEventListener("pointerleave", hide);
      document.removeEventListener("visibilitychange", hide);
      document.removeEventListener("fullscreenchange", hide);
      document.removeEventListener("beforetoggle", toggle, true);
      preference.removeEventListener("change", hide);
    };
  }, [enabled]);

  return <div ref={cursor} className="studio-cursor" aria-hidden="true" data-visible="false"><span className="studio-cursor-ring" /><span className="studio-cursor-dot" /></div>;
}

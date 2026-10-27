import { useEffect, useRef } from "react";

// Move the filmed scene and its projected hotspots together, in viewport pixels.
// Text and navigation stay outside these transforms.
export default function useSceneParallax(root, { reduced, paused }) {
  const suspended = useRef(paused), recenter = useRef(null);
  suspended.current = paused;
  useEffect(() => { if (paused) recenter.current?.(); }, [paused]);

  useEffect(() => {
    const track = root.current;
    if (reduced || !track) return;
    const stage = track.querySelector(".video-scroll-stage");
    const preference = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const position = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let frame = 0, last = 0, width = 1, height = 1, visible = true;

    const paint = () => {
      track.style.setProperty("--scene-mouse-x", `${position.x.toFixed(3)}px`);
      track.style.setProperty("--scene-mouse-y", `${position.y.toFixed(3)}px`);
    };
    const snapToCenter = () => {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      position.x = position.y = position.targetX = position.targetY = 0;
      paint();
    };
    const draw = now => {
      frame = 0;
      if (document.hidden || !visible || !preference.matches) return;
      const elapsed = last ? Math.min(now - last, 64) : 16;
      last = now;
      const ease = 1 - Math.exp(-elapsed / 140);
      position.x += (position.targetX - position.x) * ease;
      position.y += (position.targetY - position.y) * ease;
      const settled = Math.hypot(position.targetX - position.x, position.targetY - position.y) < .015;
      if (settled) { position.x = position.targetX; position.y = position.targetY; }
      paint();
      if (!settled) frame = requestAnimationFrame(draw);
      else last = 0;
    };
    const wake = () => {
      if (!frame && !document.hidden && visible && preference.matches) frame = requestAnimationFrame(draw);
    };
    const center = () => { position.targetX = position.targetY = 0; wake(); };
    const resize = () => {
      width = Math.max(1, stage.clientWidth); height = Math.max(1, stage.clientHeight);
      // Reserve just enough image at every edge to cover the maximum offset.
      track.style.setProperty("--scene-mouse-scale", String(1 + Math.max(20 / width, 16 / height)));
      snapToCenter();
    };
    const configure = () => {
      if (preference.matches) { track.dataset.parallaxEnabled = "true"; resize(); }
      else { snapToCenter(); delete track.dataset.parallaxEnabled; }
    };
    const move = event => {
      if (event.pointerType !== "mouse" || suspended.current || !visible || !preference.matches || document.hidden) return;
      if (event.target instanceof Element && event.target.closest("header, dialog, [popover]:popover-open, .video-scroll-footer, .video-scene-cta")) return;
      const limit = value => Math.max(-1, Math.min(1, value));
      position.targetX = limit(event.clientX / width * 2 - 1) * 8;
      position.targetY = limit(event.clientY / height * 2 - 1) * 6;
      wake();
    };
    const visibility = () => { if (document.hidden) snapToCenter(); };
    const keydown = event => { if (event.key === "Tab") center(); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) snapToCenter();
    });
    observer.observe(stage);
    recenter.current = center;
    configure();
    preference.addEventListener("change", configure);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("blur", center);
    window.addEventListener("keydown", keydown);
    document.documentElement.addEventListener("pointerleave", center);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); recenter.current = null;
      preference.removeEventListener("change", configure);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", center);
      window.removeEventListener("keydown", keydown);
      document.documentElement.removeEventListener("pointerleave", center);
      document.removeEventListener("visibilitychange", visibility);
      delete track.dataset.parallaxEnabled;
      for (const property of ["--scene-mouse-x", "--scene-mouse-y", "--scene-mouse-scale"]) track.style.removeProperty(property);
    };
  }, [root, reduced]);
}

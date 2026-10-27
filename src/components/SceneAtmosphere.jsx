import { useEffect, useRef } from "react";

// Canvas sprites provide depth without a 3D engine or extra media downloads.
export default function SceneAtmosphere({ progress, paused }) {
  const canvasRef = useRef(null);
  const suspended = useRef(paused);
  const resume = useRef(null);
  const elapsed = useRef(0);
  suspended.current = paused;
  useEffect(() => { resume.current?.(); }, [paused]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    let width = 1, height = 1, request = 0, last = 0, visible = true, ticks = 0;
    let seed = 8913;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const points = Array.from({ length: 128 }, (_, index) => ({
      x: random(), y: random(), depth: index < 70 ? 0 : index < 112 ? 1 : 2,
      offsetX: 0, offsetY: 0,
      phase: random() * Math.PI * 2, speed: .35 + random() * .65,
      red: random() < .13, size: .6 + random() * .7,
    }));
    const foil = Array.from({ length: 14 }, (_, index) => ({
      x: index % 2 ? .84 + random() * .13 : .03 + random() * .13,
      y: random(), phase: random() * 6.28, speed: .6 + random() * .5,
      offsetX: 0, offsetY: 0,
    }));
    const sprites = ["245,242,232", "234,73,47"].map(color => {
      const sprite = document.createElement("canvas"); sprite.width = sprite.height = 48;
      const ctx = sprite.getContext("2d");
      const gradient = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
      gradient.addColorStop(0, `rgba(${color},.85)`);
      gradient.addColorStop(.24, `rgba(${color},.5)`);
      gradient.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 48, 48); return sprite;
    });
    const pointer = { x: -1, y: -1, targetX: -1, targetY: -1, active: false };
    const pulses = [];
    function repel(item, x, y, depth) {
      const dx = x - pointer.x, dy = y - pointer.y, distance = Math.hypot(dx, dy);
      const force = pointer.active ? Math.max(0, 1 - distance / 220) ** 1.3 * (65 + depth * 24) : 0;
      // Keep the displacement between frames so passing the cursor feels like stirring air.
      const ease = force > 0 ? .24 : .065;
      item.offsetX += (dx / Math.max(1, distance) * force - item.offsetX) * ease;
      item.offsetY += (dy / Math.max(1, distance) * force - item.offsetY) * ease;
      return [x + item.offsetX, y + item.offsetY];
    }
    function resize() {
      width = canvas.clientWidth; height = canvas.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function wake() {
      if (!request && visible && !document.hidden && !suspended.current) { last = 0; request = requestAnimationFrame(draw); }
      else if (suspended.current || document.hidden || !visible) { cancelAnimationFrame(request); request = 0; }
    }
    function draw(now) {
      request = 0;
      if (suspended.current || document.hidden || !visible) return;
      const delta = last ? now - last : 34;
      if (delta < 32) { request = requestAnimationFrame(draw); return; }
      last = now; elapsed.current += Math.min(delta, 70) / 1000;
      const time = elapsed.current, p = progress.current;
      const strength = p < .56 ? 1 : p < .79 ? .85 : .68;
      pointer.x += (pointer.targetX - pointer.x) * .32; pointer.y += (pointer.targetY - pointer.y) * .32;
      context.clearRect(0, 0, width, height);
      for (const point of points) {
        const depth = point.depth + 1;
        let x = (point.x + Math.sin(time * .09 * point.speed + point.phase) * .025) * width;
        let y = ((point.y - time * .005 * depth * point.speed) % 1 + 1) % 1 * height;
        if (pointer.active) {
          x += (pointer.x / width - .5) * depth * 7;
          y += (pointer.y / height - .5) * depth * 4;
        }
        [x, y] = repel(point, x, y, depth);
        for (const pulse of pulses) {
          const age = time - pulse.time, dx = x - pulse.x, dy = y - pulse.y;
          const distance = Math.hypot(dx, dy);
          const shift = Math.exp(-(((distance - age * 250) / 70) ** 2)) * Math.max(0, 1 - age / 1.6) * 48;
          x += dx / Math.max(1, distance) * shift; y += dy / Math.max(1, distance) * shift;
        }
        const inReadingArea = x > width * .24 && x < width * .77 && y > height * .23 && y < height * .76;
        const alpha = [.6, .78, .68][point.depth] * strength * (inReadingArea ? .42 : 1);
        context.globalAlpha = alpha;
        const size = [4.5, 11, 29][point.depth] * point.size;
        context.drawImage(sprites[point.red ? 1 : 0], x - size / 2, y - size / 2, size, size);
      }
      for (const piece of foil) {
        const angle = time * .65 * piece.speed + piece.phase;
        let x = (piece.x + Math.sin(time * .18 + piece.phase) * .025) * width;
        let y = ((piece.y + Math.sin(time * .12 + piece.phase) * .06) % 1 + 1) % 1 * height;
        [x, y] = repel(piece, x, y, 2);
        context.save(); context.translate(x, y); context.rotate(angle);
        context.scale(Math.max(.12, Math.abs(Math.cos(angle * 1.7))), 1);
        context.globalAlpha = (.3 + Math.abs(Math.sin(angle * 1.3)) * .55) * strength;
        context.fillStyle = Math.sin(angle) > 0 ? "#f2d8b8" : "#a69c94";
        context.beginPath(); context.moveTo(-2, -9); context.lineTo(2.5, -6);
        context.lineTo(2, 9); context.lineTo(-2.5, 6); context.closePath();
        context.fill(); context.restore();
      }
      while (pulses.length && time - pulses[0].time > 1.6) pulses.shift();
      for (const pulse of pulses) {
        const age = time - pulse.time;
        const fade = Math.max(0, 1 - age / 1.6) ** 1.4;
        context.save();
        context.strokeStyle = "#fff0dc"; context.lineWidth = 1.8;
        context.shadowColor = "#ffd7a0"; context.shadowBlur = 12;
        context.globalAlpha = .72 * fade;
        context.beginPath(); context.arc(pulse.x, pulse.y, 12 + age * 250, 0, Math.PI * 2); context.stroke();
        context.globalAlpha = .35 * fade; context.lineWidth = 1;
        context.beginPath(); context.arc(pulse.x, pulse.y, 6 + age * 185, 0, Math.PI * 2); context.stroke();
        context.globalAlpha = .3 * Math.max(0, 1 - age / .45);
        context.drawImage(sprites[0], pulse.x - 55, pulse.y - 55, 110, 110);
        context.restore();
      }
      context.globalAlpha = 1;
      if (++ticks % 15 === 0) canvas.dataset.tick = ticks;
      request = requestAnimationFrame(draw);
    }
    function move(event) {
      if (event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      pointer.targetX = event.clientX - rect.left; pointer.targetY = event.clientY - rect.top;
      if (!pointer.active) { pointer.x = pointer.targetX; pointer.y = pointer.targetY; }
      pointer.active = pointer.targetX >= 0 && pointer.targetX <= width && pointer.targetY >= 0 && pointer.targetY <= height;
    }
    function leave() { pointer.active = false; }
    function pulse(event) {
      if (!visible || suspended.current || event.button !== 0 || event.target.closest("button,a,dialog,input,select,textarea,[role='button']")) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      if (x < 0 || x > width || y < 0 || y > height) return;
      pulses.push({ x, y, time: elapsed.current });
      if (pulses.length > 3) pulses.shift();
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); });
    observer.observe(canvas);
    resize(); wake(); resume.current = wake;
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", pulse, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", wake);
    return () => {
      cancelAnimationFrame(request); observer.disconnect(); resume.current = null;
      window.removeEventListener("resize", resize); window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", pulse);
      document.documentElement.removeEventListener("pointerleave", leave); document.removeEventListener("visibilitychange", wake);
    };
  }, [progress]);
  return <canvas ref={canvasRef} className="scene-atmosphere" aria-hidden="true" />;
}

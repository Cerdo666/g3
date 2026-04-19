import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

interface Bubble {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function BubbleAnimation() {
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { id: '1', x: 20, y: 20, size: 80, color: '#d4b8be' },
    { id: '2', x: 70, y: 60, size: 100, color: '#c9a8b0' },
    { id: '3', x: 30, y: 80, size: 70, color: '#b88e98' },
  ]);

  const colors = ['#d4b8be', '#c9a8b0', '#b88e98', '#dcc5ca', '#c19da7'];

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(current => {
        const newBubbles: Bubble[] = [];

        current.forEach(bubble => {
          const action = Math.random();

          if (action > 0.7 && bubble.size > 40 && current.length < 5) {
            const newSize = bubble.size * 0.7;
            newBubbles.push({
              id: `${bubble.id}-a-${Date.now()}`,
              x: Math.max(10, Math.min(80, bubble.x - 10)),
              y: Math.max(10, Math.min(80, bubble.y - 10)),
              size: newSize,
              color: colors[Math.floor(Math.random() * colors.length)],
            });
            newBubbles.push({
              id: `${bubble.id}-b-${Date.now()}`,
              x: Math.max(10, Math.min(80, bubble.x + 10)),
              y: Math.max(10, Math.min(80, bubble.y + 10)),
              size: newSize,
              color: colors[Math.floor(Math.random() * colors.length)],
            });
          } else if (action < 0.3 && current.length > 2) {
            const mergeWith = current.find(b => b.id !== bubble.id && Math.random() > 0.5);
            if (mergeWith && !newBubbles.find(b => b.id.includes(bubble.id) && b.id.includes(mergeWith.id))) {
              newBubbles.push({
                id: `merged-${Date.now()}`,
                x: (bubble.x + mergeWith.x) / 2,
                y: (bubble.y + mergeWith.y) / 2,
                size: Math.min(120, bubble.size + mergeWith.size * 0.4),
                color: colors[Math.floor(Math.random() * colors.length)],
              });
            } else {
              newBubbles.push(bubble);
            }
          } else {
            newBubbles.push({
              ...bubble,
              x: Math.max(10, Math.min(80, bubble.x + (Math.random() - 0.5) * 20)),
              y: Math.max(10, Math.min(80, bubble.y + (Math.random() - 0.5) * 20)),
            });
          }
        });

        const unique = newBubbles.filter((bubble, index, self) =>
          index === self.findIndex(b => b.id === bubble.id)
        ).slice(0, 5);

        return unique.length > 0 ? unique : current;
      });
    }, 4000); // ← slightly longer interval gives exit animations room to breathe

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
        <g filter="url(#goo)" opacity="0.5">
          <AnimatePresence>
            {bubbles.map((bubble) => (
              <motion.circle
                key={bubble.id}
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.size}
                fill={bubble.color}
                initial={{ opacity: 0, r: 0 }}
                animate={{
                  opacity: 1,
                  cx: bubble.x,
                  cy: bubble.y,
                  r: bubble.size,
                }}
                exit={{
                  opacity: 0,
                  r: bubble.size * 0.6, // ← shrinks slightly as it fades, feels more organic
                  transition: {
                    opacity: { duration: 5, ease: 'easeIn' }, // ← slow, lingering fade
                    r: { duration: 5, ease: 'easeIn' },
                  },
                }}
                transition={{
                  opacity: { duration: 2.5, ease: 'easeOut' },
                  r: { duration: 2.5, ease: 'easeOut' },
                  cx: { duration: 3, ease: 'easeInOut' },
                  cy: { duration: 3, ease: 'easeInOut' },
                }}
              />
            ))}
          </AnimatePresence>
        </g>
      </svg>
    </div>
  );
}
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const EXCUSES = [
  "I'm debugging a critical production issue.",
  'My internet is acting up.',
  "I'm waiting for a deploy to finish.",
  'My laptop needs to restart for updates.',
  'I forgot what day it is.',
  'My cat is sitting on my keyboard.',
  'My kid is home sick and just threw up on the floor mid-sentence.',
  'Daycare called and said I need to come now, not later.',
  'The plumber turned the water off and then disappeared.',
  'My webcam is doing that thing where it turns me into a potato.',
  'I burned something and now my kitchen is smoky.',
  "I'm on hold with someone who keeps coming back every 30 seconds to say 'thanks for waiting'.",
  'A tree fell and took out power lines near the house.',
  "I'm currently experiencing an unscheduled power outage caused by a rogue squirrel chewing through my main line..",
  "I'm trying to join from my car, but my Wi-Fi is only picking up carrier pigeons.",
  'My sourdough starter just exploded and I have to contain the fallout.',
  "I'm testing out a new noise-canceling helmet, so my audio might be spotty.",
  "There's a very aggressive pigeon trying to get into my window.",
  'I was told to evacuate temporarily due to a nearby issue.',
  'SWAT team just showed up on the street and everyone was told to shelter in place.',
  'Authorities are investigating a possible biohazard nearby.',
  "There's an unfolding situation involving something they won't name yet.",
  'A flock of aggressive geese cornered my neighbors and I need to help.',
  "There's a suspicious ice cream truck rolling down the street I need to monitor and report.",
  "I'm selling furniture on Craigslist and the buyer just showed up.",
  'Dog got into the garbage and ate some jalapeños, now I have to clean the carpet befor it stinks up.',
  "I've got a poor connection due to kids playing Fortnite.",
];

// Retro carnival colors
const SLICE_COLORS = [
  'hsl(0, 75%, 50%)', // Red
  'hsl(35, 90%, 55%)', // Orange
  'hsl(48, 95%, 50%)', // Yellow
  'hsl(120, 60%, 40%)', // Green
  'hsl(200, 70%, 50%)', // Blue
  'hsl(280, 60%, 50%)', // Purple
  'hsl(330, 70%, 50%)', // Pink
  'hsl(15, 80%, 45%)', // Rust
  'hsl(175, 60%, 40%)', // Teal
  'hsl(55, 85%, 50%)', // Gold
];

const ExcuseWheel = () => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedExcuse, setSelectedExcuse] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef(0);

  const sliceAngle = 360 / EXCUSES.length;

  // Initialize audio context on first interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play quiet click sound
  const playTick = useCallback(() => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.02);
  }, [getAudioContext]);

  // Play fanfare
  const playFanfare = useCallback(() => {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'triangle';

      const startTime = ctx.currentTime + i * 0.15;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
  }, [getAudioContext]);

  const spinWheel = useCallback(() => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);
    setSelectedExcuse(null);
    lastTickRef.current = rotation;

    // Random number of full rotations (5-10) plus random final position
    const extraSpins = Math.floor(Math.random() * 5 + 5) * 360;
    const randomAngle = Math.random() * 360;
    const totalRotation = rotation + extraSpins + randomAngle;

    setRotation(totalRotation);

    // Calculate which excuse will be selected
    // The pointer is at the top (0 degrees), so we need to find which slice is there
    const normalizedRotation = totalRotation % 360;
    const selectedIndex = Math.floor(
      ((360 - normalizedRotation + sliceAngle / 2) % 360) / sliceAngle
    );

    // Animate ticks during spin
    const spinDuration = 5000;
    const startTime = Date.now();
    const startRotation = rotation;

    const tickInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (totalRotation - startRotation) * easeProgress;

      // Play tick when passing slice boundaries
      const currentSlice = Math.floor(currentRotation / sliceAngle);
      const lastSlice = Math.floor(lastTickRef.current / sliceAngle);

      if (currentSlice !== lastSlice) {
        playTick();
        lastTickRef.current = currentRotation;
      }

      if (progress >= 1) {
        clearInterval(tickInterval);
      }
    }, 16);

    // Show result after spin
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedExcuse(EXCUSES[selectedIndex]);
      setShowResult(true);
      playFanfare();
    }, spinDuration);
  }, [isSpinning, rotation, sliceAngle, playTick, playFanfare]);

  // Generate wheel slices
  const renderSlices = () => {
    return EXCUSES.map((excuse, index) => {
      const startAngle = index * sliceAngle - 90; // Start from top
      const endAngle = startAngle + sliceAngle;
      const color = SLICE_COLORS[index % SLICE_COLORS.length];

      // Calculate SVG arc path
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const radius = 45;
      const centerX = 50;
      const centerY = 50;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');

      // Text position (middle of slice)
      const textAngle = startAngle + sliceAngle / 2;
      const textRad = (textAngle * Math.PI) / 180;
      const textRadius = radius * 0.65;
      const textX = centerX + textRadius * Math.cos(textRad);
      const textY = centerY + textRadius * Math.sin(textRad);

      return (
        <g key={index}>
          <path d={pathData} fill={color} stroke="hsl(43, 74%, 49%)" strokeWidth="0.5" />
          <text
            x={textX}
            y={textY}
            fill="white"
            fontSize="2"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
            style={{
              textShadow: '0 0 2px rgba(0,0,0,0.8)',
              fontFamily: 'Georgia, serif',
            }}
          ></text>
        </g>
      );
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-carnival-dark p-4 overflow-hidden">
      {/* Title */}
      <h1 className="text-carnival-gold font-carnival text-4xl md:text-6xl mb-2 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        🎪 Wheel of Excuses 🎪
      </h1>

      <div className="mt-6 w-full max-w-6xl flex flex-col md:flex-row gap-8 items-start">
        {/* Left: Wheel (40%) */}
        <div className="w-full md:basis-[40%] md:flex-none flex justify-center">
          {/* Wheel Container */}
          <div className="mt-8 relative mb-8">
            {/* Outer decorative ring */}
            <div className="absolute inset-[-20px] rounded-full bg-gradient-to-b from-carnival-gold via-carnival-bronze to-carnival-gold shadow-2xl" />
            <div className="absolute inset-[-15px] rounded-full bg-carnival-dark" />
            <div className="absolute inset-[-10px] rounded-full bg-gradient-to-b from-carnival-gold via-carnival-bronze to-carnival-gold" />

            {/* Pointer */}
            <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 z-20">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-carnival-gold drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <div
              className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 5s cubic-bezier(0.2, 0.8, 0.3, 1)' : 'none',
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                {renderSlices()}
                {/* Center hub */}
                <circle
                  cx="50"
                  cy="50"
                  r="8"
                  fill="url(#hubGradient)"
                  stroke="hsl(43, 74%, 49%)"
                  strokeWidth="1"
                />
                <circle cx="50" cy="50" r="5" fill="hsl(43, 74%, 49%)" />
                <defs>
                  <radialGradient id="hubGradient">
                    <stop offset="0%" stopColor="hsl(43, 74%, 60%)" />
                    <stop offset="100%" stopColor="hsl(43, 74%, 30%)" />
                  </radialGradient>
                </defs>
              </svg>
            </div>

            {/* Light bulbs around the wheel */}
            <div className="absolute inset-[-25px] pointer-events-none">
              {[...Array(16)].map((_, i) => {
                const angle = (((i * 360) / 16) * Math.PI) / 180;
                const x = 50 + 50 * Math.cos(angle);
                const y = 50 + 50 * Math.sin(angle);
                return (
                  <div
                    key={i}
                    className={`absolute w-3 h-3 rounded-full ${isSpinning ? 'animate-pulse' : ''}`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: i % 2 === 0 ? 'hsl(48, 95%, 70%)' : 'hsl(0, 75%, 60%)',
                      boxShadow: `0 0 10px ${
                        i % 2 === 0 ? 'hsl(48, 95%, 70%)' : 'hsl(0, 75%, 60%)'
                      }`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Controls + Result (60%) */}
        <div className="w-full md:basis-[60%] md:flex-none flex flex-col items-center md:items-start">
          {/* Spin Button */}
          <Button
            onClick={spinWheel}
            disabled={isSpinning}
            className="mt-6 bg-gradient-to-b from-carnival-red to-carnival-darkRed hover:from-carnival-red/90 hover:to-carnival-darkRed/90 text-white font-carnival text-2xl md:text-3xl px-8 py-6 md:px-12 md:py-8 rounded-full border-4 border-carnival-gold shadow-lg disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
          >
            {isSpinning ? '🎰 Spinning...' : '🎯 SPIN THE WHEEL!'}
          </Button>

          {/* Result Display (reserve space so layout doesn't shift) */}
          <div className="mt-8 w-full max-w-2xl min-h-[140px]">
            <div
              className={`transition-all duration-500 ${
                showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <div className="bg-carnival-dark/80 p-6 md:p-8 shadow-2xl">
                <p className="text-white text-2xl md:text-4xl leading-tight">
                  {selectedExcuse ? `${selectedExcuse}` : '\u00A0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcuseWheel;

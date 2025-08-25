"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui-v2/button";

function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(34, 211, 238, ${0.05 + i * 0.02})`, // Revolutionary cyan
        width: 0.3 + i * 0.02,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-revolutionary-cyan"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Corp1o1 Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.08 + path.id * 0.02}
                        initial={{ pathLength: 0.2, opacity: 0.4 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.2, 0.6, 0.2],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 25 + Math.random() * 15,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths({
    title = "Say more, more powerfully",
    subtitle = "AI SYSTEM ACTIVE",
    description = "Fueled by first-party data, create personalized journeys across all channels with our AI-powered customer engagement platform.",
    primaryAction,
    secondaryAction,
}: {
    title?: string;
    subtitle?: string;
    description?: string;
    primaryAction?: {
        label: string;
        onClick?: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick?: () => void;
    };
}) {
    const words = title.split(" ");

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-revolutionary-blue/5">
            {/* Background paths */}
            <div className="absolute inset-0 opacity-30">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            {/* Additional background effects */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-revolutionary-cyan/20 rounded-full blur-3xl animate-glow-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-revolutionary-amber/20 rounded-full blur-2xl animate-glow-pulse" style={{ animationDelay: '3s' }}></div>
                <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-revolutionary-purple/20 rounded-full blur-xl animate-glow-pulse" style={{ animationDelay: '6s' }}></div>
            </div>

            <div className="relative z-10 container mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Subtitle */}
                    {subtitle && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="inline-flex items-center px-4 py-2 rounded-full glass border border-revolutionary-cyan/20 mb-8"
                        >
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                            <span className="text-sm font-semibold text-revolutionary-cyan uppercase tracking-wider">
                                {subtitle}
                            </span>
                        </motion.div>
                    )}

                    {/* Main Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6 tracking-normal leading-tight">
                        {words.map((word, wordIndex) => (
                            <span
                                key={wordIndex}
                                className="inline-block mr-3 last:mr-0"
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay:
                                                wordIndex * 0.05 +
                                                letterIndex * 0.02,
                                            type: "spring",
                                            stiffness: 120,
                                            damping: 20,
                                        }}
                                        className={`inline-block ${
                                            wordIndex >= 2 // "more powerfully"
                                                ? "text-transparent bg-clip-text bg-gradient-to-r from-revolutionary-cyan to-revolutionary-amber"
                                                : "text-white"
                                        }`}
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    {/* Description */}
                    {description && (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed font-normal"
                        >
                            {description}
                        </motion.p>
                    )}

                    {/* Action Buttons */}
                    {(primaryAction || secondaryAction) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.4 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        >
                            {primaryAction && (
                                <div className="inline-block group relative bg-gradient-to-b from-revolutionary-cyan/10 to-revolutionary-cyan/5 p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                                    <Button
                                        variant="primary"
                                        size="default"
                                        onClick={primaryAction.onClick}
                                        className="rounded-[1.15rem] px-4 py-2 text-sm font-medium backdrop-blur-md transition-all duration-300 group-hover:-translate-y-0.5 shadow-lg shadow-revolutionary-cyan/20"
                                    >
                                        <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                                            {primaryAction.label}
                                        </span>
                                        <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300">
                                            →
                                        </span>
                                    </Button>
                                </div>
                            )}

                            {secondaryAction && (
                                <div className="inline-block group relative bg-gradient-to-b from-white/5 to-black/5 p-px rounded-2xl backdrop-blur-lg overflow-hidden">
                                    <Button
                                        variant="secondary"
                                        size="default"
                                        onClick={secondaryAction.onClick}
                                        className="rounded-[1.15rem] px-4 py-2 text-sm font-medium backdrop-blur-md transition-all duration-300 group-hover:-translate-y-0.5"
                                    >
                                        <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                                            {secondaryAction.label}
                                        </span>
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.8 }}
                        className="flex items-center gap-6 text-sm text-muted-foreground justify-center mt-8"
                    >
                        <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            No credit card required
                        </span>
                        <span>•</span>
                        <span>Free 14-day trial</span>
                        <span>•</span>
                        <span>Cancel anytime</span>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
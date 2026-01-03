"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypeAnimationProps {
    words: string[];
    className?: string;
    cursorClassName?: string;
    wait?: number;
    typingSpeed?: "slow" | "fast" | "normal" | number;
    deletingSpeed?: "slow" | "fast" | "normal" | number;
    pauseDuration?: number;
    gradientFrom?: string;
    gradientTo?: string;
}

export default function Typeanimation({
    words,
    className,
    cursorClassName,
    typingSpeed = "normal",
    deletingSpeed = "normal",
    pauseDuration = 2000,
    gradientFrom,
    gradientTo,
}: TypeAnimationProps) {
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);
    const [blink, setBlink] = useState(true);

    // Speed mapping
    const getSpeed = (speed: string | number, type: "type" | "delete") => {
        if (typeof speed === "number") return speed;
        const base = type === "type" ? 150 : 100;
        switch (speed) {
            case "slow": return base * 2;
            case "fast": return base / 2;
            default: return base;
        }
    };

    const typeSpeedVal = getSpeed(typingSpeed, "type");
    const deleteSpeedVal = getSpeed(deletingSpeed, "delete");

    // Blinking cursor
    useEffect(() => {
        const timeout2 = setTimeout(() => {
            setBlink((prev) => !prev);
        }, 500);
        return () => clearTimeout(timeout2);
    }, [blink]);

    useEffect(() => {
        if (index === words.length) {
            setIndex(0); // loop
            return;
        }

        if (subIndex === words[index].length + 1 && !reverse) {
            // Finished typing word, wait then reverse
            const timeout = setTimeout(() => {
                setReverse(true);
            }, pauseDuration);
            return () => clearTimeout(timeout);
        }

        if (subIndex === 0 && reverse) {
            // Finished deleting, move to next
            setReverse(false);
            setIndex((prev) => (prev + 1) % words.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, reverse ? deleteSpeedVal : typeSpeedVal);

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse, words, pauseDuration, typeSpeedVal, deleteSpeedVal]);

    const currentWord = words[index];
    const displayText = currentWord ? currentWord.substring(0, subIndex) : "";

    return (
        <span className={cn("inline-block", className)}>
            <span
                className={cn(
                    gradientFrom && gradientTo ? `bg-clip-text text-transparent bg-gradient-to-r ${gradientFrom} ${gradientTo}` : ""
                )}
            >
                {displayText}
            </span>
            <span className={cn("ml-1 inline-block w-[2px] h-[1em] bg-current align-middle animate-pulse", cursorClassName)}>|</span>
        </span>
    );
}

"use client";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TextGenerateEffectProps = {
  words: string;
  className?: string;
};

export const TextGenerateEffect = ({
  words,
  className,
}: TextGenerateEffectProps) => {
  const wordsArray = words.split(" ");
  const [currentWord, setCurrentWord] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const typeSpeed = 100;
    const deleteSpeed = 50;
    const pauseTime = 2000;

    const timeout = setTimeout(() => {
      if (isPaused) {
        setIsPaused(false);
        setIsDeleting(true);
        return;
      }

      if (isDeleting) {
        setCurrentText((prev) => prev.slice(0, -1));
        if (currentText === "") {
          setIsDeleting(false);
          setCurrentWord((prev) => (prev + 1) % wordsArray.length);
        }
      } else {
        const targetWord = wordsArray[currentWord];
        setCurrentText((prev) => {
          const nextChar = targetWord[prev.length];
          return prev + nextChar;
        });

        if (currentText === targetWord) {
          setIsPaused(true);
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWord, wordsArray, isPaused]);

  return (
    <div className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="text-black dark:text-white">
          {currentText}
          <span className="animate-pulse">|</span>
        </div>
      </div>
    </div>
  );
};

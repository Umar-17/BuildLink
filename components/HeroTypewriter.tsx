"use client";

import { useEffect, useState } from "react";

const DEFAULT_WORDS = [
  "at your doorstep.",
  "on your job site.",
  "verified & on demand.",
  "with rapid dispatch.",
];

export default function HeroTypewriter({
  words = DEFAULT_WORDS,
}: {
  words?: string[];
}) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(words[0].length);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const currentWord = words[index % words.length];

    if (!isDeleting && subIndex === currentWord.length) {
      const timeout = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && subIndex === 0) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(
      () => {
        setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
      },
      isDeleting ? 40 : 80
    );

    return () => clearTimeout(timeout);
  }, [subIndex, isDeleting, index, words, isMounted]);

  const currentWord = words[index % words.length];
  const displayedText = currentWord.substring(0, subIndex);

  return (
    <span className="text-accent underline decoration-accent/30 underline-offset-4 inline-block">
      {displayedText}
      <span
        className="inline-block w-[3px] h-[0.85em] bg-accent ml-1 align-baseline animate-pulse"
        aria-hidden="true"
      />
    </span>
  );
}

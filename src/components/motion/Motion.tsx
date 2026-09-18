import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/utils/cn";

export const EASE = [0.16, 1, 0.3, 1] as const;

/** ظهور عند دخول الإطار — transform/opacity فقط (أداء 60fps) */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  as = "div",
  once = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: ElementType;
  once?: boolean;
  id?: string;
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as as "div"] ?? motion.div;

  return (
    <MotionTag
      id={id}
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

/** حاوية تتابع لأبنائها */
export function Stagger({
  children,
  className,
  gap = 0.08,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, amount: 0.15 }}
      variants={{ show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/** كشف نصّي كلمة بكلمة — يحافظ على تشكيل الحروف العربية (لا نقسم الحروف) */
export function WordsReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  /** يُطبَّق على كل كلمة — ضروري لتدرّج النص (background-clip) */
  wordClassName?: string;
  delay?: number;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  if (reduce)
    return (
      <Tag className={className}>
        <span className={wordClassName}>{text}</span>
      </Tag>
    );

  return (
    <Tag className={cn("inline-block", className)}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className={cn("inline-block whitespace-pre", wordClassName)}
          initial={{ opacity: 0, y: "0.45em", filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.85, ease: EASE, delay: delay + i * 0.055 }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Tag>
  );
}

export { motion, useReducedMotion };

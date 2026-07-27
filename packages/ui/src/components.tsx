import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`rl-button rl-button--${variant} ${className}`.trim()} {...props} />;
}

export function Card({
  elevated = false,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & { elevated?: boolean }) {
  return (
    <section
      className={`rl-card${elevated ? " rl-card--elevated" : ""} ${className}`.trim()}
      {...props}
    />
  );
}

export function Metric({
  label,
  value,
  trend,
  tone = "neutral"
}: {
  label: string;
  value: string;
  trend?: string;
  tone?: "neutral" | "positive" | "negative" | "caution";
}) {
  return (
    <div className={`rl-metric rl-tone--${tone}`}>
      <span className="rl-metric__label">{label}</span>
      <strong className="rl-metric__value">{value}</strong>
      {trend === undefined ? null : <span className="rl-metric__trend">{trend}</span>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "caution" | "evidence";
}) {
  return <span className={`rl-badge rl-badge--${tone}`}>{children}</span>;
}

export function Input({
  label,
  error,
  hint,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const message = error ?? hint;
  const messageId = message === undefined || id === undefined ? undefined : `${id}-message`;
  return (
    <label className="rl-field" htmlFor={id}>
      <span className="rl-field__label">{label}</span>
      <input
        aria-describedby={messageId}
        aria-invalid={error === undefined ? undefined : true}
        className="rl-input"
        id={id}
        {...props}
      />
      {message === undefined ? null : (
        <span className={error === undefined ? "rl-field__hint" : "rl-field__error"} id={messageId}>
          {message}
        </span>
      )}
    </label>
  );
}

interface OverlayProps {
  children: ReactNode;
  description?: string;
  open: boolean;
  title: string;
}

export function Sheet({ children, description, open, title }: OverlayProps) {
  if (!open) return null;
  return (
    <div className="rl-overlay rl-overlay--inline">
      <section aria-label={title} className="rl-sheet">
        <div className="rl-sheet__handle" />
        <h3>{title}</h3>
        {description === undefined ? null : <p>{description}</p>}
        {children}
      </section>
    </div>
  );
}

export function Modal({ children, description, open, title }: OverlayProps) {
  if (!open) return null;
  return (
    <div className="rl-overlay rl-overlay--inline">
      <section aria-modal="true" className="rl-modal" role="dialog">
        <h3>{title}</h3>
        {description === undefined ? null : <p>{description}</p>}
        {children}
      </section>
    </div>
  );
}

export function EmptyState({
  action,
  description,
  icon = "◇",
  title
}: {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <div className="rl-empty">
      <span aria-hidden="true" className="rl-empty__icon">
        {icon}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

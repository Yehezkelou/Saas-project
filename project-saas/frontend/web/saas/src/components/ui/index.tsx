// src/components/ui/index.tsx
// Design system web — tous les composants de base

import React, { useState, useEffect } from "react";
import { formatPrice, orderStatusConfig } from "../../theme";
import { motion, AnimatePresence } from "framer-motion";

// ── CSS injecté une fois ───────────────────────────────────
const styles = `
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px; border-radius: var(--radius-md); font-weight: 600;
  font-family: var(--font); cursor: pointer; border: none;
  transition: opacity .15s, transform .1s; white-space: nowrap;
}
.btn:hover:not(:disabled) { opacity: .88; }
.btn:active:not(:disabled) { transform: scale(.97); }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-primary  { background: var(--color-primary);  color: #fff; }
.btn-success  { background: var(--color-success);  color: #fff; }
.btn-danger   { background: var(--color-danger);   color: #fff; }
.btn-outline  { background: transparent; color: var(--color-primary); border: 2px solid var(--color-primary); }
.btn-ghost    { background: transparent; color: var(--color-text-secondary); border: 1.5px solid var(--color-border); }
.btn-sm  { height: 32px; padding: 0 12px; font-size: var(--text-sm); }
.btn-md  { height: 40px; padding: 0 18px; font-size: var(--text-base); }
.btn-lg  { height: 50px; padding: 0 24px; font-size: var(--text-md); }
.btn-full { width: 100%; }

.card {
  background: var(--color-surface); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm); overflow: hidden;
}
.card-p { padding: var(--sp-base); }
.card-p-lg { padding: var(--sp-xl); }

.badge {
  display: inline-flex; align-items: center; padding: 2px 10px;
  border-radius: var(--radius-full); font-size: var(--text-xs);
  font-weight: 600; white-space: nowrap;
}

.input-wrap { display: flex; flex-direction: column; gap: 6px; }
.input-label { font-size: 12px; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.input-field {
  background: var(--color-bg); border: 2px solid var(--color-border-light);
  border-radius: 14px; padding: 12px 16px; font-family: var(--font);
  font-size: 15px; color: var(--color-text-primary); font-weight: 600;
  transition: all .2s cubic-bezier(0.4, 0, 0.2, 1); width: 100%;
}
.input-field:focus { border-color: var(--color-text-primary); background: var(--color-surface); box-shadow: 0 4px 12px rgba(0,0,0,0.05); outline: none; }
.input-field::placeholder { color: var(--color-text-tertiary); font-weight: 500; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: var(--sp-base);
}
.modal-box {
  background: var(--color-surface); border-radius: 24px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.2), 0 0 0 1px var(--color-border-light);
  width: 100%; max-width: 500px; max-height: 94vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px 32px 16px; border-bottom: none; flex-shrink: 0;
}
.modal-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: var(--color-text-primary); }
.modal-close {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg); border: none; cursor: pointer;
  font-size: 20px; color: var(--color-text-secondary); transition: all 0.2s;
}
.modal-close:hover { background: var(--color-border); color: var(--color-text-primary); transform: rotate(90deg); }
.modal-body { padding: 8px 32px 32px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; flex: 1; }
.modal-footer { padding: 24px 32px; border-top: 1px solid var(--color-border-light); background: var(--color-bg); display: flex; justify-content: flex-end; gap: 12px; border-radius: 0 0 24px 24px; flex-shrink: 0; }

.spinner {
  width: 20px; height: 20px; border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin .6s linear infinite; flex-shrink: 0;
}
.spinner-dark { border-color: rgba(0,0,0,.1); border-top-color: var(--color-primary); }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: var(--sp-xxxl);
  color: var(--color-text-tertiary); gap: var(--sp-sm); text-align: center;
}
.empty-state-icon { font-size: 48px; }

.skeleton {
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-border-light) 50%, var(--color-border) 75%);
  background-size: 200% 100%; animation: skeleton 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}
@keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  background: var(--color-text-primary); color: #fff;
  padding: 12px 18px; border-radius: var(--radius-lg);
  font-size: var(--text-sm); box-shadow: var(--shadow-lg);
  animation: slideUp .2s ease-out; max-width: 360px;
}
.toast-success { background: var(--color-success); }
.toast-error   { background: var(--color-danger); }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--sp-lg) var(--sp-xl);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}
.page-title { font-size: var(--text-xl); font-weight: 700; }
.page-body  { flex: 1; overflow-y: auto; padding: var(--sp-xl); }

.tab-bar {
  display: flex; gap: var(--sp-xs);
  padding: var(--sp-sm) var(--sp-xl);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}
.tab-item {
  padding: 6px 16px; border-radius: var(--radius-full);
  font-size: var(--text-sm); font-weight: 500; white-space: nowrap;
  cursor: pointer; color: var(--color-text-secondary);
  transition: all .15s; border: none; background: none;
}
.tab-item.active {
  background: var(--color-primary); color: #fff;
}
.tab-item:hover:not(.active) { background: var(--color-bg); }

.switch-wrap { display: flex; align-items: center; gap: var(--sp-sm); cursor: pointer; }
.switch-track {
  width: 44px; height: 24px; border-radius: 12px;
  background: var(--color-border); transition: background .2s;
  position: relative; flex-shrink: 0;
}
.switch-track.on { background: var(--color-success); }
.switch-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; transition: transform .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.switch-track.on .switch-thumb { transform: translateX(20px); }

.select-field {
  background: var(--color-bg); border: 2px solid var(--color-border-light);
  border-radius: 14px; padding: 12px 16px; font-family: var(--font);
  font-size: 15px; color: var(--color-text-primary); font-weight: 600;
  width: 100%; cursor: pointer; transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
  appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat; background-position: right 16px top 50%; background-size: 12px auto;
}
.select-field:focus { border-color: var(--color-text-primary); outline: none; background-color: var(--color-surface); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.glass-dark {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

`;

// Injecter les styles une seule fois immédiatement ou au premier import
if (typeof document !== "undefined") {
  const el = document.createElement("style");
  el.id = "saas-ui-styles";
  el.textContent = styles;
  document.head.appendChild(el);
}

// ── Button ─────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  "primary" | "outline" | "ghost" | "danger" | "success";
  size?:     "sm" | "md" | "lg";
  loading?:  boolean;
  fullWidth?: boolean;
  children:  React.ReactNode;
}

export function Button({
  variant = "primary", size = "md", loading, fullWidth, children, className = "", ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? "btn-full" : ""} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        {loading && <Spinner size={16} />}
        <span>{children}</span>
      </span>
    </button>
  );
}

// ── Card ───────────────────────────────────────────────────
interface CardProps {
  children:  React.ReactNode;
  className?: string;
  padding?:  "sm" | "md" | "lg" | "none";
  onClick?:  () => void;
  style?:    React.CSSProperties;
}

export function Card({ children, className = "", padding = "md", onClick, style }: CardProps) {
  const padClass = padding === "none" ? "" : padding === "lg" ? "card-p-lg" : "card-p";
  return (
    <div
      className={`card ${padClass} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : undefined, ...style }}
    >
      {children}
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="input-wrap">
      {label && <label className="input-label">{label}</label>}
      <input className={`input-field ${className}`} {...props} />
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  options:  { value: string; label: string }[];
}

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <div className="input-wrap">
      {label && <label className="input-label">{label}</label>}
      <select className={`select-field ${className}`} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, ...props }: TextareaProps) {
  return (
    <div className="input-wrap">
      {label && <label className="input-label">{label}</label>}
      <textarea
        className="input-field"
        style={{ minHeight: 80, resize: "vertical" }}
        {...props}
      />
    </div>
  );
}

// ── OrderStatusBadge ───────────────────────────────────────
export function OrderStatusBadge({ status }: { status: string }) {
  const cfg = orderStatusConfig[status] ?? orderStatusConfig.PENDING;
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────────────
interface ModalProps {
  open:      boolean;
  onClose:   () => void;
  title:     string;
  children:  React.ReactNode;
  footer?:   React.ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, children, footer, maxWidth }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else       document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="modal-box" style={maxWidth ? { maxWidth } : undefined}
          >
            <div className="modal-header">
              <span className="modal-title">{title}</span>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Spinner ────────────────────────────────────────────────
export function Spinner({ dark, size = 20 }: { dark?: boolean; size?: number }) {
  return (
    <span
      className={`spinner ${dark ? "spinner-dark" : ""}`}
      style={{ width: size, height: size }}
    />
  );
}

// ── LoadingPage ────────────────────────────────────────────
export function LoadingPage({ message = "Chargement..." }: { message?: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100%", gap: 16,
      color: "var(--color-text-secondary)",
    }}>
      <Spinner dark size={32} />
      <span>{message}</span>
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────
export function EmptyState({ icon = "📭", title, subtitle }: {
  icon?:     React.ReactNode;
  title:     string;
  subtitle?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <strong style={{ fontSize: "var(--text-lg)", color: "var(--color-text-primary)" }}>{title}</strong>
      {subtitle && <span style={{ fontSize: "var(--text-sm)" }}>{subtitle}</span>}
    </div>
  );
}

// ── Price ──────────────────────────────────────────────────
export function Price({ amount, large, bold }: { amount: number; large?: boolean; bold?: boolean }) {
  return (
    <span style={{
      fontSize:   large ? "var(--text-xl)" : "var(--text-base)",
      fontWeight: bold  ? 700 : 500,
      color:      "var(--color-primary)",
    }}>
      {formatPrice(amount)}
    </span>
  );
}

// ── Switch ─────────────────────────────────────────────────
export function Switch({ checked, onChange, label }: {
  checked:  boolean;
  onChange: (v: boolean) => void;
  label?:   string;
}) {
  return (
    <label className="switch-wrap" onClick={() => onChange(!checked)}>
      <div className={`switch-track ${checked ? "on" : ""}`}>
        <div className="switch-thumb" />
      </div>
      {label && <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{label}</span>}
    </label>
  );
}

// ── Toast simple ───────────────────────────────────────────
let toastTimeout: ReturnType<typeof setTimeout>;

export function showToast(message: string, type: "default" | "success" | "error" = "default") {
  const existing = document.getElementById("app-toast");
  if (existing) existing.remove();
  clearTimeout(toastTimeout);

  const el = document.createElement("div");
  el.id = "app-toast";
  el.className = `toast ${type === "success" ? "toast-success" : type === "error" ? "toast-error" : ""}`;
  el.textContent = message;
  document.body.appendChild(el);

  toastTimeout = setTimeout(() => el.remove(), 3500);
}

// ── PageHeader ─────────────────────────────────────────────
export function PageHeader({ title, action }: {
  title:   string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── SafeImage ──────────────────────────────────────────────
export function SafeImage({ src, alt, fallback, style, className }: {
  src?: string;
  alt?: string;
  fallback: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ position: "relative", overflow: "hidden", ...style }} className={className}>
      {loading && !error && src && (
        <div className="skeleton" style={{ position: "absolute", inset: 0, zIndex: 1 }} />
      )}
      {!error && src ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
          style={{ 
            width: "100%", height: "100%", objectFit: "cover",
            opacity: loading ? 0 : 1, transition: "opacity 0.4s ease-out"
          }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
          {fallback}
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────
export function StatCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode; label: string; value: string;
  color?: string; sub?: string;
}) {
  return (
    <div className="card card-p" style={{ flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 28, marginBottom: 8, color: color ?? "var(--color-text-primary)" }}>{icon}</div>
      <div style={{ fontSize: "var(--text-xxl)", fontWeight: 700, color: color ?? "var(--color-text-primary)" }}>
        {value}
      </div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: 2 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
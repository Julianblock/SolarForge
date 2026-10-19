"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const links: Array<[string, string]> = [
  ["Tools", "/solar-calculator"],
  ["Learn", "/learn"],
  ["Pricing", "/pricing"],
  ["Dashboard", "/dashboard"],
];

export function SunMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#122238" />
      <circle cx="16" cy="13" r="4.5" fill="#f5b942" />
      <path d="M6 23h20M8 20h16M10 17h12" stroke="#f07a32" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <a className="skip" href="#content">Skip to content</a>
      <div className="wrap nav-inner">
        <Link className="brand" href="/">
          <SunMark />
          <span>SolarForge</span>
        </Link>
        <nav className={open ? "nav-links open" : "nav-links"} aria-label="Primary">
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <ThemeToggle />
          <Link className="btn btn-primary" href="/start" onClick={() => setOpen(false)}>
            Start Designing — Free
          </Link>
        </nav>
        <button className="btn btn-secondary nav-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          Menu
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap foot-grid">
        <div>
          <strong>SolarForge</strong>
          <p>Preliminary solar planning for homes, cabins, vans, and small commercial roofs. Not an engineering stamp.</p>
        </div>
        <div>
          <strong>Product</strong>
          <p><Link href="/solar-calculator">Calculators</Link></p>
          <p><Link href="/pricing">Pricing</Link></p>
          <p><Link href="/dashboard">Dashboard</Link></p>
        </div>
        <div>
          <strong>Learn</strong>
          <p><Link href="/learn/what-is-solar-azimuth">Azimuth</Link></p>
          <p><Link href="/learn/how-to-size-a-solar-system">System size</Link></p>
          <p><Link href="/learn/how-to-size-a-battery-bank">Batteries</Link></p>
        </div>
        <div>
          <strong>Company</strong>
          <p><Link href="/about">About</Link></p>
          <p><Link href="/contact">Contact</Link></p>
          <p><Link href="/privacy">Privacy</Link></p>
          <p><Link href="/terms">Terms</Link></p>
        </div>
      </div>
    </footer>
  );
}

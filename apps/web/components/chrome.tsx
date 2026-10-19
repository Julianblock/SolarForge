"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const links: Array<[string, string]> = [
  ["How it works", "/#how"],
  ["Prices", "/pricing"],
  ["My plans", "/dashboard"],
];

export function SunMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="#111111" />
      <circle cx="16" cy="14" r="4.2" fill="#f5b942" />
      <path d="M7 24h18M9 21h14" stroke="#f5b942" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <a className="skip" href="#content">Skip to content</a>
      <div className="wrap nav-inner">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
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
            Start free
          </Link>
        </nav>
        <button className="btn btn-secondary nav-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? "Close" : "Menu"}
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
          <p>A planner that estimates solar panels, batteries, and cost before you buy anything.</p>
          <p className="fine">It is not a permit and not an engineering stamp.</p>
          <p className="fine">Photos from Pexels and Unsplash.</p>
        </div>
        <div>
          <strong>Start here</strong>
          <p><Link href="/start">Design a system</Link></p>
          <p><Link href="/solar-calculator">Calculators</Link></p>
          <p><Link href="/pricing">Prices</Link></p>
        </div>
        <div>
          <strong>Learn the words</strong>
          <p><Link href="/learn/what-is-solar-azimuth">Which way is south</Link></p>
          <p><Link href="/learn/how-to-size-a-solar-system">How many panels</Link></p>
          <p><Link href="/learn/how-to-size-a-battery-bank">Battery size</Link></p>
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

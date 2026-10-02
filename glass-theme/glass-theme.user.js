// ==UserScript==
// @name         BIIGLE Glass Theme
// @namespace    https://github.com/biigle/community-resources
// @version      1.0.0
// @description  An optional alternative look for the BIIGLE web interface: a dark theme with translucent surfaces, gradient accents and optional animations.
// @author       Daniel Langenkämper
// @license      MIT
// @homepageURL  https://github.com/biigle/community-resources/tree/master/glass-theme
// @downloadURL  https://raw.githubusercontent.com/biigle/community-resources/master/glass-theme/glass-theme.user.js
// @updateURL    https://raw.githubusercontent.com/biigle/community-resources/master/glass-theme/glass-theme.user.js
// @match        https://biigle.de/*
// @match        https://*.biigle.de/*
// @exclude      https://biigle.de/api/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    const ACCENTS = ['abyss', 'jellyfish', 'kelp', 'coral'];

    // Cross-document view transitions between BIIGLE pages. Both the old and the new page
    // must opt in, so leaving the rule out on the annotation and video tools disables the
    // transition into and out of them (they load a lot of data, which would hold the animation).
    const TRANSITION_CSS = String.raw`
@view-transition {
    navigation: auto;
}

.navbar {
    view-transition-name: gt-navbar;
}

/* Shown behind the page snapshots while they move, instead of a blank viewport. */
::view-transition {
    background-color: var(--gt-bg);
}

::view-transition-old(root) {
    animation: gt-vt-out .22s cubic-bezier(.4, 0, 1, 1) both;
    mix-blend-mode: normal;
}

::view-transition-new(root) {
    animation: gt-vt-in .45s cubic-bezier(.2, .8, .2, 1) .05s both;
    mix-blend-mode: normal;
}

/* The navbar swaps instantly and stays in place while the content fades. */
::view-transition-group(gt-navbar) {
    animation: none;
}

::view-transition-old(gt-navbar) {
    display: none;
}

::view-transition-new(gt-navbar) {
    animation: none;
    mix-blend-mode: normal;
}

@keyframes gt-vt-out {
    to { opacity: 0; transform: translateY(-14px) scale(.985); filter: blur(4px); }
}

@keyframes gt-vt-in {
    from { opacity: 0; transform: translateY(32px) scale(.98); filter: blur(8px); }
}

@media (prefers-reduced-motion: reduce) {
    @view-transition {
        navigation: none;
    }
}
`;

    // In-page motion that is switched together with the page transitions. Only the tab
    // contents move: the tab width snaps so the annotation canvas resizes exactly once.
    const MOTION_CSS = String.raw`
.sidebar .sidebar__tab--open {
    animation: gt-sidebar-in-right .34s cubic-bezier(.2, .8, .2, 1) backwards;
}

.sidebar.sidebar--left .sidebar__tab--open {
    animation-name: gt-sidebar-in-left;
}

.sidebar .sidebar__button.active::before {
    animation: gt-sidebar-bar .3s cubic-bezier(.2, .8, .2, 1) backwards;
}

@keyframes gt-sidebar-in-right {
    from { opacity: 0; transform: translateX(24px); }
}

@keyframes gt-sidebar-in-left {
    from { opacity: 0; transform: translateX(-24px); }
}

@keyframes gt-sidebar-bar {
    from { transform: translateY(-50%) scaleY(0); }
}
`;

    const IS_TOOL_PAGE = /^\/(images|videos)\/\d+\/annotations|^\/videos\/\d+\/?$/.test(location.pathname);

    // Individually switchable extras. Each one sets a gt-f-<key> class on <html>.
    const FEATURES = {
        toasts: 'message toasts',
        ripple: 'click ripples',
        drift: 'background drift',
        glow: 'input glow',
        glide: 'tab highlight',
        gridline: 'grid progress line',
        sidebarscroll: 'hidden sidebar scrollbars',
    };

    // Page background. Everything else that is dark is derived from it.
    const BACKGROUNDS = {
        'midnight': {name: 'Midnight', color: '#04070f'},
        'navy': {name: 'Navy', color: '#070c18'},
        'ink': {name: 'Ink', color: '#020308'},
        'graphite': {name: 'Graphite', color: '#0b0c0e'},
    };

    // Used for all text except the logo.
    const TEXT_FONTS = {
        'roboto-slab': {name: 'Roboto Slab', stack: '"Roboto Slab", Rockwell, "Zilla Slab", Georgia, serif', query: 'Roboto+Slab:wght@300..800'},
        'inter': {name: 'Inter', stack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', query: 'Inter:wght@300..800'},
        'nunito': {name: 'Nunito', stack: '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', query: 'Nunito:wght@300..900'},
        'lexend': {name: 'Lexend', stack: '"Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', query: 'Lexend:wght@300..800'},
        'plex-sans': {name: 'IBM Plex Sans', stack: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', query: 'IBM+Plex+Sans:wght@300;400;500;600;700'},
        'system': {name: 'System UI', stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', query: null},
    };

    // Used for the "BIIGLE" logo only.
    const LOGO_FONTS = {
        'quicksand': {name: 'Quicksand', query: 'Quicksand:wght@700', weight: 700, spacing: '.05em'},
        'outfit': {name: 'Outfit', query: 'Outfit:wght@600', weight: 600, spacing: '.05em'},
        'sora': {name: 'Sora', query: 'Sora:wght@600', weight: 600, spacing: '.04em'},
        'lexend': {name: 'Lexend', query: 'Lexend:wght@600', weight: 600, spacing: '.05em'},
        'comfortaa': {name: 'Comfortaa', query: 'Comfortaa:wght@700', weight: 700, spacing: '.03em'},
        'nunito': {name: 'Nunito', query: 'Nunito:wght@800', weight: 800, spacing: '.05em'},
        'poppins': {name: 'Poppins', query: 'Poppins:wght@600', weight: 600, spacing: '.05em'},
        'space-grotesk': {name: 'Space Grotesk', query: 'Space+Grotesk:wght@600', weight: 600, spacing: '.04em'},
        'roboto-slab': {name: 'Roboto Slab', query: 'Roboto+Slab:wght@700', weight: 700, spacing: '.06em'},
    };

    const store = {
        get(key, fallback) {
            try {
                if (typeof GM_getValue === 'function') return GM_getValue(key, fallback);
                const value = localStorage.getItem(`biigle-glass:${key}`);
                return value === null ? fallback : JSON.parse(value);
            } catch (e) {
                return fallback;
            }
        },
        set(key, value) {
            try {
                if (typeof GM_setValue === 'function') return GM_setValue(key, value);
                localStorage.setItem(`biigle-glass:${key}`, JSON.stringify(value));
            } catch (e) {
                // Ignore storage errors, the theme still works for this page view.
            }
        },
    };

    const CSS = String.raw`
/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */
:root {
    color-scheme: dark;

    --gt-a1: #22d3ee;
    --gt-a2: #818cf8;
    --gt-accent: color-mix(in oklab, var(--gt-a1), var(--gt-a2));
    --gt-link: color-mix(in oklab, var(--gt-accent) 62%, white);
    --gt-grad: linear-gradient(135deg, var(--gt-a1), var(--gt-a2));
    --gt-grad-deep: linear-gradient(135deg,
        color-mix(in oklab, var(--gt-a1) 60%, #0b1030),
        color-mix(in oklab, var(--gt-a2) 72%, #0b1030));
    --gt-tint: color-mix(in srgb, var(--gt-accent) 15%, transparent);
    --gt-tint-2: color-mix(in srgb, var(--gt-accent) 26%, transparent);
    --gt-glow: color-mix(in srgb, var(--gt-accent) 45%, transparent);
    --gt-ring: 0 0 0 3px color-mix(in srgb, var(--gt-accent) 30%, transparent);

    --gt-bg: #04070f; /* The script overrides this with the selected background. */
    --gt-surface: rgba(148, 163, 184, .045);
    --gt-surface-2: rgba(148, 163, 184, .085);
    --gt-card: color-mix(in srgb, var(--gt-bg), #94a3b8 3%);
    --gt-solid: color-mix(in srgb, var(--gt-bg), #94a3b8 8%);
    --gt-solid-2: color-mix(in srgb, var(--gt-bg), #94a3b8 13%);
    --gt-glass: color-mix(in srgb, var(--gt-bg) 62%, transparent);
    --gt-input: rgba(0, 0, 0, .28);
    --gt-field: color-mix(in srgb, var(--gt-bg), black 35%);
    --gt-border: rgba(148, 163, 184, .14);
    --gt-border-2: rgba(148, 163, 184, .28);
    --gt-text: #d8e0ec;
    --gt-strong: #f8fafc;
    --gt-muted: #8794a9;

    --gt-success: #34d399;
    --gt-info: #38bdf8;
    --gt-warning: #fbbf24;
    --gt-danger: #fb7185;

    --gt-r-sm: 8px;
    --gt-r: 11px;
    --gt-r-lg: 16px;
    --gt-shadow: inset 0 1px 0 rgba(255, 255, 255, .035), 0 14px 34px -18px rgba(0, 0, 0, .75);
    --gt-shadow-lg: 0 30px 70px -20px rgba(0, 0, 0, .85), 0 0 0 1px rgba(255, 255, 255, .03);
    --gt-ease: cubic-bezier(.2, .8, .2, 1);
    --gt-noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    /* The script overrides these with the selected fonts. */
    --gt-font: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --gt-logo-font: "Nunito", var(--gt-font);
    --gt-logo-weight: 800;
    --gt-logo-spacing: .05em;
}

:root[data-gt-accent="jellyfish"] { --gt-a1: #c084fc; --gt-a2: #f472b6; }
:root[data-gt-accent="kelp"]      { --gt-a1: #34d399; --gt-a2: #22d3ee; }
:root[data-gt-accent="coral"]     { --gt-a1: #fbbf24; --gt-a2: #f43f5e; }

/* ------------------------------------------------------------------ */
/* Base                                                                */
/* ------------------------------------------------------------------ */
body {
    font-family: var(--gt-font);
    color: var(--gt-text);
    background-color: var(--gt-bg);
    background-image: var(--gt-noise);
    background-attachment: fixed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
}

body::backdrop {
    background-color: var(--gt-bg);
}

::selection {
    background: color-mix(in srgb, var(--gt-accent) 38%, transparent);
    color: #fff;
}

* {
    scrollbar-width: thin;
    scrollbar-color: rgba(148, 163, 184, .28) transparent;
}

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, .25);
    border-radius: 999px;
    border: 3px solid transparent;
    background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, .45); }

input[type="checkbox"], input[type="radio"], input[type="range"], progress {
    accent-color: var(--gt-accent);
}

h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6 {
    font-weight: 650;
    letter-spacing: -.015em;
    color: var(--gt-strong);
}

h1 small, h2 small, h3 small, h4 small, h5 small, h6 small,
.h1 small, .h2 small, .h3 small, .h4 small, .h5 small, .h6 small {
    color: var(--gt-muted);
    font-weight: 400;
    letter-spacing: 0;
}

.lead {
    font-weight: 600;
    color: var(--gt-strong);
    letter-spacing: -.01em;
}

a {
    color: var(--gt-link);
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
    transition: color .15s ease;
}

a:hover, a:focus {
    color: color-mix(in oklab, var(--gt-link) 55%, white);
    text-decoration-color: color-mix(in srgb, var(--gt-accent) 60%, transparent);
}

hr { border-top-color: var(--gt-border); }

legend {
    color: var(--gt-strong);
    border-bottom-color: var(--gt-border);
    font-weight: 600;
}

.text-muted, .help-block { color: var(--gt-muted); }
.text-primary { color: var(--gt-link); }
.text-success { color: var(--gt-success); }
.text-info { color: var(--gt-info); }
.text-warning { color: var(--gt-warning); }
.text-danger { color: var(--gt-danger); }

code {
    color: color-mix(in oklab, var(--gt-accent) 55%, white);
    background: var(--gt-tint);
    border-radius: 6px;
    padding: 2px 6px;
}

pre {
    color: var(--gt-text);
    background: var(--gt-input);
    border: 1px solid var(--gt-border);
    border-radius: var(--gt-r);
}

kbd {
    color: var(--gt-strong);
    background: var(--gt-solid-2);
    border: 1px solid var(--gt-border-2);
    border-bottom-width: 2px;
    border-radius: 6px;
    box-shadow: none;
    font-family: var(--gt-font);
    font-weight: 600;
    font-size: 85%;
    padding: 1px 6px;
}

.close {
    color: var(--gt-strong);
    text-shadow: none;
    opacity: .55;
    transition: opacity .15s ease;
}
.close:hover, .close:focus { color: var(--gt-strong); opacity: 1; }

:focus-visible { outline: 2px solid color-mix(in srgb, var(--gt-accent) 75%, transparent); outline-offset: 2px; }

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */
.navbar-default {
    background-color: color-mix(in srgb, var(--gt-bg) 62%, transparent);
    -webkit-backdrop-filter: saturate(170%) blur(18px);
    backdrop-filter: saturate(170%) blur(18px);
    border-style: solid;
    border-width: 0 0 1px;
    border-image: linear-gradient(90deg,
        transparent,
        color-mix(in srgb, var(--gt-a1) 45%, transparent) 30%,
        color-mix(in srgb, var(--gt-a2) 45%, transparent) 70%,
        transparent) 1;
    box-shadow: 0 12px 30px -20px rgba(0, 0, 0, .9);
}

.navbar-static-top {
    position: sticky;
    top: 0;
    z-index: 1030;
}

.messages.container-fluid {
    z-index: 1040;
    top: 8px;
}

.logo {
    font-family: var(--gt-logo-font);
}

.navbar-default .navbar-brand.logo {
    font-weight: var(--gt-logo-weight);
    letter-spacing: var(--gt-logo-spacing);
    transition: filter .3s ease;
}

.logo__biigle {
    background: linear-gradient(90deg, var(--gt-strong) 10%, color-mix(in oklab, var(--gt-accent) 55%, white));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.logo__biigle:before {
    transition: transform .5s var(--gt-ease), filter .5s ease;
}

.logo:hover .logo__biigle:before, .logo__biigle:hover:before {
    transform: translateY(-2px) rotate(-10deg) scale(1.08);
    filter: drop-shadow(0 0 10px var(--gt-glow));
}

.logo--standalone .logo__biigle {
    font-weight: var(--gt-logo-weight);
    letter-spacing: var(--gt-logo-spacing);
}

.navbar-default .navbar-text,
.navbar-default .navbar-text a {
    color: var(--gt-text);
}

.navbar-default .navbar-text a:hover {
    color: var(--gt-strong);
}

.navbar-btn-link .btn {
    border-radius: 10px;
}

.navbar-btn-link .btn-default {
    border-color: transparent;
    color: var(--gt-muted);
}

.navbar-btn-link .btn-default:not(:hover) {
    background-color: transparent;
}

.navbar-btn-link .btn-default:hover,
.navbar-btn-link .btn-default:focus,
.navbar-nav > .open > a .btn-default {
    color: var(--gt-strong);
    background-color: var(--gt-surface-2);
    border-color: var(--gt-border);
}

.notifications-icon .btn-info {
    color: #fff;
    background-image: var(--gt-grad-deep);
    animation: gt-pulse 2.4s ease-in-out infinite;
}

.sudo-mode-indicator .btn-danger {
    border-radius: 999px;
    font-weight: 700;
    letter-spacing: .06em;
}

.navbar-header .announcement .btn-warning {
    border-radius: 999px;
    color: var(--gt-warning);
    background-color: color-mix(in srgb, var(--gt-warning) 12%, transparent);
    border-color: color-mix(in srgb, var(--gt-warning) 40%, transparent);
    padding-left: 12px;
    padding-right: 12px;
}

.navbar-header .announcement .btn-warning:hover {
    color: var(--gt-strong);
    background-color: color-mix(in srgb, var(--gt-warning) 22%, transparent);
    box-shadow: 0 0 22px -6px color-mix(in srgb, var(--gt-warning) 60%, transparent);
}

/* ------------------------------------------------------------------ */
/* Dropdowns                                                           */
/* ------------------------------------------------------------------ */
.dropdown-menu {
    background-color: color-mix(in srgb, var(--gt-solid) 94%, transparent) !important;
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid var(--gt-border);
    border-radius: 14px;
    padding: 6px;
    box-shadow: var(--gt-shadow-lg);
    animation: gt-pop .16s var(--gt-ease);
    transform-origin: top center;
}

.dropdown-menu > li > a,
.navbar-default .navbar-nav .open .dropdown-menu > li > a {
    color: var(--gt-text) !important;
    border-radius: var(--gt-r-sm);
    padding: 7px 12px;
    transition: background-color .12s ease, color .12s ease;
}

.dropdown-menu > li > a:hover,
.dropdown-menu > li > a:focus,
.navbar-default .navbar-nav .open .dropdown-menu > li > a:hover,
.navbar-default .navbar-nav .open .dropdown-menu > li > a:focus {
    color: var(--gt-strong) !important;
    background-color: var(--gt-tint);
}

.dropdown-menu > .active > a,
.dropdown-menu > .active > a:hover,
.dropdown-menu > .active > a:focus {
    color: var(--gt-strong) !important;
    background-color: var(--gt-tint-2);
}

.dropdown-menu > .disabled > a,
.dropdown-menu > .disabled > a:hover,
.dropdown-menu > .disabled > a:focus {
    color: var(--gt-muted) !important;
    opacity: .6;
    background-color: transparent;
}

.dropdown-menu .divider {
    background-color: var(--gt-border);
    margin: 6px 4px;
}

.dropdown-header {
    color: var(--gt-muted);
    padding: 6px 12px;
}

.dropdown-header strong { color: var(--gt-strong); }

.dropdown-footer a:hover { color: var(--gt-strong); }

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
.btn {
    border-radius: var(--gt-r);
    font-weight: 500;
    transition: background-color .18s ease, border-color .18s ease, color .18s ease, box-shadow .2s ease, transform .15s var(--gt-ease);
}

.btn-sm, .btn-xs, .btn-group-sm > .btn, .btn-group-xs > .btn { border-radius: var(--gt-r-sm); }
.btn-lg, .btn-group-lg > .btn { border-radius: 13px; }

.btn:focus, .btn:active:focus, .btn.active:focus, .btn.focus, .btn:active.focus, .btn.active.focus {
    outline: none;
}

.btn:focus-visible {
    box-shadow: var(--gt-ring);
}

.btn:not(.btn-group > .btn):not(.btn-block):not(.sidebar__button):not(.control-button):not(:disabled):not(.disabled):hover {
    transform: translateY(-1px);
}

.btn:not(.sidebar__button):not(.control-button):not(:disabled):not(.disabled):active {
    transform: translateY(0) scale(.98);
}

/* Default */
.btn-default {
    color: var(--gt-text);
    background-color: var(--gt-surface);
    border-color: var(--gt-border);
}

.btn-default:hover,
.btn-default:focus,
.btn-default.focus {
    color: var(--gt-strong);
    background-color: var(--gt-surface-2);
    border-color: var(--gt-border-2);
}

.btn-default:active,
.btn-default.active,
.open > .btn-default.dropdown-toggle,
.btn-default:active:hover,
.btn-default.active:hover,
.open > .btn-default.dropdown-toggle:hover,
.btn-default:active:focus,
.btn-default.active:focus,
.open > .btn-default.dropdown-toggle:focus,
.btn-default:active.focus,
.btn-default.active.focus,
.open > .btn-default.dropdown-toggle.focus {
    color: var(--gt-strong);
    background-color: var(--gt-tint);
    border-color: color-mix(in srgb, var(--gt-accent) 45%, transparent);
    box-shadow: inset 0 1px 6px rgba(0, 0, 0, .25);
}

.btn-default.disabled:hover,
.btn-default[disabled]:hover,
fieldset[disabled] .btn-default:hover,
.btn-default.disabled:focus,
.btn-default[disabled]:focus,
fieldset[disabled] .btn-default:focus {
    background-color: var(--gt-surface);
    border-color: var(--gt-border);
}

/* Filled: primary / info (accent) and success (emerald) */
.btn-primary, .btn-info { --gt-btn-grad: var(--gt-grad-deep); }
.btn-success { --gt-btn-grad: linear-gradient(135deg, #059669, #0f766e); }

.btn-primary, .btn-info, .btn-success {
    color: #fff;
    border-color: transparent;
    background-color: transparent;
    background-image: var(--gt-btn-grad);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .16), 0 8px 22px -12px var(--gt-glow);
    text-shadow: 0 1px 1px rgba(0, 0, 0, .2);
}

.btn-success {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .16), 0 8px 22px -12px rgba(16, 185, 129, .7);
}

:is(.btn-primary, .btn-info, .btn-success):hover,
:is(.btn-primary, .btn-info, .btn-success):focus,
:is(.btn-primary, .btn-info, .btn-success).focus,
:is(.btn-primary, .btn-info, .btn-success):active,
:is(.btn-primary, .btn-info, .btn-success).active,
.open > :is(.btn-primary, .btn-info, .btn-success).dropdown-toggle,
:is(.btn-primary, .btn-info, .btn-success):active:hover,
:is(.btn-primary, .btn-info, .btn-success).active:hover,
:is(.btn-primary, .btn-info, .btn-success):active:focus,
:is(.btn-primary, .btn-info, .btn-success).active:focus,
.open > :is(.btn-primary, .btn-info, .btn-success).dropdown-toggle:hover,
.open > :is(.btn-primary, .btn-info, .btn-success).dropdown-toggle:focus {
    color: #fff;
    border-color: transparent;
    background-color: transparent;
    /* Bootstrap resets background-image for :active/.active states. */
    background-image: var(--gt-btn-grad);
    filter: brightness(1.12) saturate(1.05);
}

:is(.btn-primary, .btn-info):hover {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .2), 0 10px 28px -10px var(--gt-glow);
}

.btn-success:hover {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .2), 0 10px 28px -10px rgba(16, 185, 129, .75);
}

:is(.btn-primary, .btn-info, .btn-success):is(.disabled, [disabled]),
fieldset[disabled] :is(.btn-primary, .btn-info, .btn-success),
:is(.btn-primary, .btn-info, .btn-success):is(.disabled, [disabled]):hover,
:is(.btn-primary, .btn-info, .btn-success):is(.disabled, [disabled]):focus {
    filter: saturate(.4);
    background-color: transparent;
    background-image: var(--gt-btn-grad);
    border-color: transparent;
    box-shadow: none;
}

/* Soft: warning / danger */
.btn-warning { --gt-c: var(--gt-warning); }
.btn-danger { --gt-c: var(--gt-danger); }

.btn-warning, .btn-danger {
    color: color-mix(in oklab, var(--gt-c) 55%, white);
    background-color: color-mix(in srgb, var(--gt-c) 14%, transparent);
    border-color: color-mix(in srgb, var(--gt-c) 40%, transparent);
}

:is(.btn-warning, .btn-danger):hover,
:is(.btn-warning, .btn-danger):focus,
:is(.btn-warning, .btn-danger).focus,
:is(.btn-warning, .btn-danger):active,
:is(.btn-warning, .btn-danger).active,
.open > :is(.btn-warning, .btn-danger).dropdown-toggle,
:is(.btn-warning, .btn-danger):active:hover,
:is(.btn-warning, .btn-danger).active:hover,
:is(.btn-warning, .btn-danger):active:focus,
:is(.btn-warning, .btn-danger).active:focus {
    color: #fff;
    background-color: color-mix(in srgb, var(--gt-c) 26%, transparent);
    border-color: color-mix(in srgb, var(--gt-c) 62%, transparent);
    box-shadow: 0 8px 22px -12px var(--gt-c);
}

:is(.btn-warning, .btn-danger):is(.disabled, [disabled]):hover,
:is(.btn-warning, .btn-danger):is(.disabled, [disabled]):focus {
    background-color: color-mix(in srgb, var(--gt-c) 14%, transparent);
    border-color: color-mix(in srgb, var(--gt-c) 40%, transparent);
    box-shadow: none;
}

.btn-link { color: var(--gt-link); }
.btn-link:hover, .btn-link:focus { color: color-mix(in oklab, var(--gt-link) 55%, white); }

.btn .badge { border-radius: 999px; }

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */
.form-control {
    color: var(--gt-strong);
    background-color: var(--gt-input);
    border: 1px solid var(--gt-border);
    border-radius: 10px;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, .25);
    transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;
}

.form-control:hover {
    border-color: var(--gt-border-2);
}

.form-control:focus {
    border-color: color-mix(in srgb, var(--gt-accent) 70%, transparent);
    background-color: rgba(0, 0, 0, .4);
    box-shadow: var(--gt-ring);
    outline: 0;
}

.form-control::placeholder { color: #5f6b80; }

.form-control[disabled], .form-control[readonly], fieldset[disabled] .form-control {
    background-color: var(--gt-surface);
    opacity: .7;
}

.input-sm, .form-group-sm .form-control, .input-group-sm > .form-control { border-radius: var(--gt-r-sm); }
.input-lg, .form-group-lg .form-control, .input-group-lg > .form-control { border-radius: 13px; }

select.form-control option, select.form-control optgroup {
    background-color: var(--gt-solid);
    color: var(--gt-text);
}

.input-group-addon {
    color: var(--gt-muted);
    background-color: var(--gt-surface);
    border-color: var(--gt-border);
    border-radius: 10px;
}

.has-feedback .form-control-feedback { color: var(--gt-accent); }

.has-error .form-control:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--gt-danger) 30%, transparent); }
.has-success .form-control:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--gt-success) 30%, transparent); }
.has-warning .form-control:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--gt-warning) 30%, transparent); }

/* ------------------------------------------------------------------ */
/* Navs                                                                */
/* ------------------------------------------------------------------ */
.nav-tabs {
    border-bottom-color: var(--gt-border);
}

.nav-tabs > li > a {
    color: var(--gt-muted);
    border-color: transparent;
    border-radius: 10px 10px 0 0;
    margin-right: 4px;
    transition: color .15s ease, background-color .15s ease;
}

.nav-tabs > li > a:hover,
.nav-tabs > li > a:focus {
    color: var(--gt-strong);
    background-color: var(--gt-surface);
    border-color: transparent;
}

.nav-tabs > li.active > a,
.nav-tabs > li.active > a:hover,
.nav-tabs > li.active > a:focus {
    color: var(--gt-strong);
    background-color: transparent;
    background-image: linear-gradient(to top, var(--gt-tint), transparent 85%);
    border-color: transparent;
}

.nav-tabs > li.active > a::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: -1px;
    height: 2px;
    border-radius: 2px;
    background: var(--gt-grad);
    box-shadow: 0 0 12px var(--gt-glow);
}

/* Search: keep all result sections in one row by sharing the available width. */
.search-form + .nav-tabs {
    display: flex;
    flex-wrap: nowrap;
}

.search-form + .nav-tabs::before,
.search-form + .nav-tabs::after {
    display: none;
}

.search-form + .nav-tabs > li {
    float: none;
    flex: 1 1 auto;
    min-width: 0;
}

.search-form + .nav-tabs > li > a {
    margin-right: 2px;
    padding: 10px 6px;
    text-align: center;
    white-space: nowrap;
}

.search-form + .nav-tabs .badge {
    padding: 3px 6px;
    margin-left: 2px;
}

.nav .badge {
    color: var(--gt-text);
    background-color: var(--gt-surface-2);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.nav-tabs > li.active > a .badge {
    color: #fff;
    background-image: var(--gt-grad-deep);
}

.nav-pills > li > a {
    color: var(--gt-muted);
    border-radius: var(--gt-r);
    transition: color .15s ease, background-color .15s ease;
}

.nav > li > a:hover, .nav > li > a:focus {
    background-color: var(--gt-surface);
    color: var(--gt-strong);
}

.nav-pills > li.active > a,
.nav-pills > li.active > a:hover,
.nav-pills > li.active > a:focus {
    color: var(--gt-strong);
    background-color: var(--gt-tint);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gt-accent) 35%, transparent);
}

.nav-pills.nav-stacked > li > a { position: relative; }

.nav-pills.nav-stacked > li.active > a::before {
    content: '';
    position: absolute;
    left: 0;
    top: 22%;
    bottom: 22%;
    width: 3px;
    border-radius: 3px;
    background: var(--gt-grad);
}

.breadcrumb {
    background-color: var(--gt-surface);
    border: 1px solid var(--gt-border);
    border-radius: var(--gt-r);
}

.pagination > li > a,
.pagination > li > span {
    color: var(--gt-text);
    background-color: var(--gt-surface);
    border-color: var(--gt-border);
    margin: 0 2px;
    border-radius: var(--gt-r-sm);
}

.pagination > li:first-child > a,
.pagination > li:first-child > span,
.pagination > li:last-child > a,
.pagination > li:last-child > span {
    border-radius: var(--gt-r-sm);
}

.pagination > li > a:hover,
.pagination > li > span:hover,
.pagination > li > a:focus,
.pagination > li > span:focus {
    color: var(--gt-strong);
    background-color: var(--gt-surface-2);
    border-color: var(--gt-border-2);
}

.pagination > .active > a,
.pagination > .active > span,
.pagination > .active > a:hover,
.pagination > .active > span:hover,
.pagination > .active > a:focus,
.pagination > .active > span:focus {
    color: #fff;
    background-color: transparent;
    background-image: var(--gt-grad-deep);
    border-color: transparent;
}

.pagination > .disabled > span,
.pagination > .disabled > span:hover,
.pagination > .disabled > a,
.pagination > .disabled > a:hover {
    color: var(--gt-muted);
    background-color: transparent;
    border-color: var(--gt-border);
}

/* ------------------------------------------------------------------ */
/* Surfaces: panels, wells, list groups, tables                        */
/* ------------------------------------------------------------------ */
.panel {
    background-color: var(--gt-surface);
    border: 1px solid var(--gt-border);
    border-radius: var(--gt-r-lg);
    box-shadow: var(--gt-shadow);
}

.panel-default { border-color: var(--gt-border); }

.panel > .panel-heading {
    border-top-left-radius: 15px;
    border-top-right-radius: 15px;
    font-weight: 600;
}

.panel-default > .panel-heading {
    color: var(--gt-strong);
    background-color: rgba(148, 163, 184, .05);
    border-color: var(--gt-border);
}

.panel-footer {
    background-color: rgba(148, 163, 184, .035);
    border-top-color: var(--gt-border);
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
}

.panel > .list-group:first-child .list-group-item:first-child,
.panel > .panel-collapse > .list-group:first-child .list-group-item:first-child {
    border-top-left-radius: 15px;
    border-top-right-radius: 15px;
}

.panel > .list-group:last-child .list-group-item:last-child,
.panel > .panel-collapse > .list-group:last-child .list-group-item:last-child {
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
}

.panel-heading + .list-group .list-group-item:first-child {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.panel > .panel-body + .table,
.panel > .panel-body + .table-responsive,
.panel > .table + .panel-body,
.panel > .table-responsive + .panel-body {
    border-top-color: var(--gt-border);
}

.well {
    background-color: var(--gt-surface);
    border: 1px solid var(--gt-border);
    border-radius: var(--gt-r-lg);
    box-shadow: var(--gt-shadow);
}

.well-sm { border-radius: 14px; }
.well-lg { border-radius: 18px; }

.list-group-item {
    color: var(--gt-text);
    background-color: rgba(148, 163, 184, .025);
    border-color: var(--gt-border);
    transition: background-color .15s ease;
}

.list-group-item:first-child {
    border-top-left-radius: var(--gt-r);
    border-top-right-radius: var(--gt-r);
}

.list-group-item:last-child {
    border-bottom-left-radius: var(--gt-r);
    border-bottom-right-radius: var(--gt-r);
}

a.list-group-item, button.list-group-item { color: var(--gt-text); }

a.list-group-item:hover, button.list-group-item:hover,
a.list-group-item:focus, button.list-group-item:focus {
    color: var(--gt-strong);
    background-color: var(--gt-surface-2);
}

.list-group-item.active,
.list-group-item.active:hover,
.list-group-item.active:focus {
    color: var(--gt-strong);
    background-color: var(--gt-tint-2);
    border-color: color-mix(in srgb, var(--gt-accent) 45%, transparent);
}

.list-group-item.active .list-group-item-text,
.list-group-item.active:hover .list-group-item-text,
.list-group-item.active:focus .list-group-item-text {
    color: var(--gt-text);
}

.list-group-item-heading { color: var(--gt-strong); }

.table > thead > tr > th,
.table > tbody > tr > th,
.table > tfoot > tr > th,
.table > thead > tr > td,
.table > tbody > tr > td,
.table > tfoot > tr > td {
    border-top-color: var(--gt-border);
}

.table > thead > tr > th {
    color: var(--gt-muted);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    border-bottom: 1px solid var(--gt-border-2);
}

.table-striped > tbody > tr:nth-of-type(odd) { background-color: rgba(148, 163, 184, .035); }
.table-hover > tbody > tr { transition: background-color .12s ease; }
.table-hover > tbody > tr:hover { background-color: var(--gt-tint); }

.table-bordered,
.table-bordered > thead > tr > th,
.table-bordered > tbody > tr > th,
.table-bordered > tfoot > tr > th,
.table-bordered > thead > tr > td,
.table-bordered > tbody > tr > td,
.table-bordered > tfoot > tr > td {
    border-color: var(--gt-border);
}

/* ------------------------------------------------------------------ */
/* Overlays: modals, popovers, tooltips, alerts                        */
/* ------------------------------------------------------------------ */
.modal-backdrop { background-color: color-mix(in srgb, var(--gt-bg), black 40%); }
.modal-backdrop.in {
    opacity: .6;
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
}

.modal.fade .modal-dialog {
    transform: translateY(14px) scale(.97);
    transition: transform .28s var(--gt-ease);
}

.modal.in .modal-dialog { transform: none; }

.modal-content {
    background-color: color-mix(in srgb, var(--gt-solid) 93%, transparent);
    -webkit-backdrop-filter: blur(22px) saturate(160%);
    backdrop-filter: blur(22px) saturate(160%);
    border: 1px solid var(--gt-border);
    border-radius: 20px;
    box-shadow: var(--gt-shadow-lg);
}

.modal-header {
    border-bottom-color: var(--gt-border);
    padding: 18px 22px;
}

.modal-title { font-weight: 650; color: var(--gt-strong); }
.modal-body { padding: 20px 22px; }

.modal-footer {
    border-top-color: var(--gt-border);
    padding: 14px 22px;
}

.popover {
    color: var(--gt-text);
    background-color: var(--gt-solid-2);
    border: 1px solid var(--gt-border-2);
    border-radius: 14px;
    box-shadow: var(--gt-shadow-lg);
    font-family: var(--gt-font);
}

.popover-title {
    color: var(--gt-strong);
    background-color: rgba(148, 163, 184, .06);
    border-bottom-color: var(--gt-border);
    border-radius: 13px 13px 0 0;
    font-weight: 600;
}

.popover.top > .arrow { border-top-color: var(--gt-border-2); }
.popover.top > .arrow:after { border-top-color: var(--gt-solid-2); }
.popover.bottom > .arrow { border-bottom-color: var(--gt-border-2); }
.popover.bottom > .arrow:after { border-bottom-color: var(--gt-solid-2); }
.popover.left > .arrow { border-left-color: var(--gt-border-2); }
.popover.left > .arrow:after { border-left-color: var(--gt-solid-2); }
.popover.right > .arrow { border-right-color: var(--gt-border-2); }
.popover.right > .arrow:after { border-right-color: var(--gt-solid-2); }

.tooltip { font-family: var(--gt-font); }
.tooltip.in { opacity: 1; }

.tooltip-inner {
    color: var(--gt-strong);
    background-color: var(--gt-solid-2);
    border: 1px solid var(--gt-border);
    border-radius: 8px;
    padding: 5px 10px;
    font-weight: 500;
    box-shadow: 0 10px 24px -10px rgba(0, 0, 0, .8);
}

.tooltip.top .tooltip-arrow, .tooltip.top-left .tooltip-arrow, .tooltip.top-right .tooltip-arrow { border-top-color: var(--gt-solid-2); }
.tooltip.bottom .tooltip-arrow, .tooltip.bottom-left .tooltip-arrow, .tooltip.bottom-right .tooltip-arrow { border-bottom-color: var(--gt-solid-2); }
.tooltip.left .tooltip-arrow { border-left-color: var(--gt-solid-2); }
.tooltip.right .tooltip-arrow { border-right-color: var(--gt-solid-2); }

.alert {
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--gt-c, var(--gt-accent)) 38%, transparent);
    color: color-mix(in oklab, var(--gt-c, var(--gt-accent)) 35%, white);
    background-color: color-mix(in srgb, var(--gt-c, var(--gt-accent)) 13%, var(--gt-solid));
    box-shadow: inset 3px 0 0 var(--gt-c, var(--gt-accent)), 0 16px 36px -18px rgba(0, 0, 0, .8);
}

.alert-success { --gt-c: var(--gt-success); }
.alert-info { --gt-c: var(--gt-info); }
.alert-warning { --gt-c: var(--gt-warning); }
.alert-danger { --gt-c: var(--gt-danger); }

.alert .alert-link { color: #fff; }

.messages__message {
    animation: gt-drop .45s var(--gt-ease) backwards;
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
}

/* ------------------------------------------------------------------ */
/* Labels, badges, progress                                            */
/* ------------------------------------------------------------------ */
.label {
    border-radius: 999px;
    padding: .25em .7em .3em;
    font-weight: 600;
    letter-spacing: .02em;
}

.label-default:not(.label-hollow) { background-color: rgba(148, 163, 184, .22); color: var(--gt-strong); }
.label-primary:not(.label-hollow) { background-image: var(--gt-grad-deep); }
.label-success:not(.label-hollow) { background-color: #059669; }
.label-info:not(.label-hollow) { background-color: #0284c7; }
.label-warning:not(.label-hollow) { background-color: #b45309; }
.label-danger:not(.label-hollow) { background-color: #e11d48; }

.badge {
    color: var(--gt-strong);
    background-color: rgba(148, 163, 184, .2);
    border-radius: 999px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.progress {
    background-color: rgba(148, 163, 184, .1);
    border-radius: 999px;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, .35);
}

.progress-bar {
    box-shadow: none;
    transition: width .5s var(--gt-ease);
}

.progress-bar:not([class*="progress-bar-"]) {
    background-color: transparent;
    background-image: var(--gt-grad);
    box-shadow: 0 0 14px -2px var(--gt-glow);
    color: #06101f;
    font-weight: 600;
}

.loader {
    border-color: rgba(148, 163, 184, .18);
    border-left-color: var(--gt-accent);
}

.loader.loader--fancy {
    background-color: color-mix(in srgb, var(--gt-bg) 70%, transparent);
    box-shadow: 0 0 0 1px var(--gt-border), 0 0 40px -6px var(--gt-glow);
}

.message-curtain {
    background-color: color-mix(in srgb, var(--gt-bg) 50%, transparent);
}

/* Loader blocks stay in the DOM while inactive, so only blur active ones. */
.message-curtain:not(.loader-block--inactive) {
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
}

.message-curtain .message-curtain--text {
    background-color: var(--gt-glass);
    border: 1px solid var(--gt-border);
    border-radius: 14px;
    box-shadow: var(--gt-shadow-lg);
}

/* ------------------------------------------------------------------ */
/* Thumbnails and cards                                                */
/* ------------------------------------------------------------------ */
.preview-thumbnail,
.image-thumbnail,
.activity-item {
    border: 0;
    border-radius: 18px;
    background-color: var(--gt-card);
    box-shadow: 0 0 0 1px var(--gt-border), 0 14px 30px -18px rgba(0, 0, 0, .9);
    isolation: isolate;
    transition: transform .4s var(--gt-ease), box-shadow .4s var(--gt-ease);
}

a:hover > .preview-thumbnail,
.preview-thumbnail:hover,
.image-thumbnail:hover,
.activity-item:hover {
    transform: translateY(-4px);
    box-shadow:
        0 0 0 1px color-mix(in srgb, var(--gt-accent) 55%, transparent),
        0 24px 44px -18px rgba(0, 0, 0, .95),
        0 0 36px -10px var(--gt-glow);
}

/*
 * Safari does not clip transformed children with overflow + border-radius, so the
 * zoomed image would spill over the card edge. The images fill the card, so we clip
 * them directly and shrink the clip by the zoom factor: 1.045 zoom needs an inset of
 * (1 - 1 / 1.045) / 2 = 2.153% and a radius of 18px / 1.045 = 17.22px.
 */
.preview-thumbnail img,
.image-thumbnail img,
.activity-item img {
    clip-path: inset(0 round 18px);
    transition: transform .7s var(--gt-ease), clip-path .7s var(--gt-ease), opacity .25s ease;
}

a:hover > .preview-thumbnail img,
.preview-thumbnail:hover img,
.image-thumbnail:hover img,
.activity-item:hover img {
    transform: scale(1.045);
    clip-path: inset(2.153% round 17.22px);
}

.preview-thumbnail::after,
.image-thumbnail::after,
.activity-item::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    border-radius: inherit;
    background: radial-gradient(420px circle at var(--gt-mx, 50%) var(--gt-my, 0%), rgba(255, 255, 255, .13), transparent 45%);
    opacity: 0;
    transition: opacity .35s ease;
}

a:hover > .preview-thumbnail::after,
.preview-thumbnail:hover::after,
.image-thumbnail:hover::after,
.activity-item:hover::after {
    opacity: 1;
}

.preview-thumbnail figcaption,
.image-thumbnail .caption,
.activity-item-image figcaption {
    padding: 2.4em .9em .7em;
    font-weight: 550;
    letter-spacing: .005em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, .7);
    background: linear-gradient(to bottom, transparent, color-mix(in srgb, var(--gt-bg) 55%, transparent) 40%, color-mix(in srgb, var(--gt-bg) 92%, transparent));
    opacity: .92;
}

.preview-thumbnail__icon,
.activity-item .icon {
    top: .6em;
    right: .6em;
    padding: 4px 7px;
    border-radius: 9px;
    background: color-mix(in srgb, var(--gt-bg) 45%, transparent);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, .08);
    opacity: .9;
}

.preview-thumbnail__progress {
    height: 3px;
    background-image: var(--gt-grad);
    opacity: .9;
    border-radius: 0 3px 3px 0;
}

/* Thumbnails that are embedded in an image grid should stay flat. */
.image-grid__image .preview-thumbnail,
.image-grid__image .preview-thumbnail:hover,
a:hover > .image-grid__image .preview-thumbnail {
    transform: none;
    box-shadow: none;
    border-radius: var(--gt-r-sm);
}

.image-grid__image .preview-thumbnail img,
.image-grid__image .preview-thumbnail:hover img {
    transform: none;
    clip-path: none;
}

/* Dashboard */
.activity-items > div > .well {
    padding: 14px;
}

.activity-items .col-xs-6 { padding-top: 7px; padding-bottom: 7px; }

.dashboard-project {
    padding-bottom: 6px;
}

.dashboard-project h4 {
    font-size: 19px;
    font-weight: 650;
    margin-bottom: 14px;
}

.dashboard-project h4 a {
    color: var(--gt-strong);
    text-decoration: none;
    background: linear-gradient(var(--gt-accent), var(--gt-accent)) no-repeat 0 100% / 0 2px;
    transition: background-size .35s var(--gt-ease), color .2s ease;
}

.dashboard-project h4 a:hover {
    color: var(--gt-strong);
    background-size: 100% 2px;
}

.dashboard__all-projects .btn {
    border-radius: 999px;
    padding-left: 28px;
    padding-right: 28px;
    border: 1px solid transparent;
    background:
        linear-gradient(var(--gt-bg), var(--gt-bg)) padding-box,
        var(--gt-grad) border-box;
}

.dashboard__all-projects .btn:hover,
.dashboard__all-projects .btn:focus {
    border-color: transparent;
    background:
        linear-gradient(color-mix(in srgb, var(--gt-accent) 14%, var(--gt-bg)), color-mix(in srgb, var(--gt-accent) 14%, var(--gt-bg))) padding-box,
        var(--gt-grad) border-box;
    box-shadow: 0 0 30px -8px var(--gt-glow);
}

/* Project page */
#projects-title h2 {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -.025em;
}

.project-tabs { margin-bottom: 20px; }

.preview-thumbnail--projects { height: 160px; }

/* ------------------------------------------------------------------ */
/* Image grids (volume overview, Largo)                                */
/* ------------------------------------------------------------------ */
.image-grid__image {
    border-color: transparent;
    border-radius: 14px;
    background-color: var(--gt-card);
    box-shadow: 0 0 0 1px var(--gt-border);
    transition: border-color .25s ease, box-shadow .25s ease;
}

.image-grid__image img { border-radius: 10px; }

.image-grid__image:hover {
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--gt-accent) 55%, transparent), 0 10px 26px -12px var(--gt-glow);
}

.image-grid__image .image-button {
    background-color: color-mix(in srgb, var(--gt-bg) 65%, transparent);
    border-radius: var(--gt-r-sm);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, .08);
}

.image-grid__image--volume .image-filename,
.image-grid__image--volume .image-labels {
    background-color: color-mix(in srgb, var(--gt-bg) 72%, transparent);
    border-radius: var(--gt-r-sm);
}

/* ------------------------------------------------------------------ */
/* Sidebars (volume overview, annotation tool, video tool)             */
/* ------------------------------------------------------------------ */
.sidebar.sidebar--right .sidebar__tab,
.sidebar.sidebar--right .sidebar__buttons {
    border-left-color: var(--gt-border);
}

.sidebar.sidebar--left .sidebar__tab,
.sidebar.sidebar--left .sidebar__buttons {
    border-right-color: var(--gt-border);
}

/* Sidebars, canvas and image grids share one flat backdrop below the navbar. */
.sidebar-container,
.settings-tab__top-actions {
    background-color: var(--gt-bg);
    background-image: var(--gt-noise);
}

.sidebar .sidebar__button {
    position: relative;
    justify-content: center;
    color: var(--gt-muted);
    background-color: transparent;
    background-image: none;
    box-shadow: none;
    filter: none;
    text-shadow: none;
}

.sidebar .sidebar__button:not(:last-child) {
    border-bottom-color: var(--gt-border);
}

.sidebar .sidebar__button:hover,
.sidebar .sidebar__button:focus {
    color: var(--gt-strong);
    background-color: var(--gt-surface);
    background-image: none;
    filter: none;
}

.sidebar .sidebar__button.active,
.sidebar .sidebar__button.active:hover,
.sidebar .sidebar__button.active:focus {
    color: var(--gt-strong);
    background-color: var(--gt-tint);
    background-image: none;
    box-shadow: none;
    filter: none;
}

.sidebar .sidebar__button.active::before {
    content: '';
    position: absolute;
    top: 50%;
    height: 44px;
    max-height: 60%;
    transform: translateY(-50%);
    width: 3px;
    border-radius: 3px;
    background: var(--gt-grad);
    box-shadow: 0 0 12px var(--gt-glow);
}

.sidebar.sidebar--right .sidebar__button.active::before { left: 0; }
.sidebar.sidebar--left .sidebar__button.active::before { right: 0; }

.sidebar .sidebar__button:is(.btn-info, .btn-success, .btn-warning, .btn-danger, .btn-primary) {
    color: color-mix(in oklab, var(--gt-c, var(--gt-accent)) 55%, white);
    background-color: color-mix(in srgb, var(--gt-c, var(--gt-accent)) 12%, transparent);
}

.sidebar .sidebar__button.btn-success { --gt-c: var(--gt-success); }
.sidebar .sidebar__button.btn-warning { --gt-c: var(--gt-warning); }
.sidebar .sidebar__button.btn-danger { --gt-c: var(--gt-danger); }

.sidebar-tab__section {
    border-bottom-color: var(--gt-border);
}

/* Label trees */
.label-tree-label .label-tree-label__name {
    border-radius: var(--gt-r-sm);
    transition: background-color .12s ease, color .12s ease;
}

.label-tree-label .label-tree-label__name:hover {
    color: var(--gt-strong);
    background-color: var(--gt-surface-2);
}

.label-tree-label.label-tree-label--selected > .label-tree-label__name {
    color: var(--gt-strong);
    background-color: var(--gt-tint);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gt-accent) 38%, transparent);
}

.label-tree-label .label-tree-label__color {
    border-color: rgba(255, 255, 255, .9);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, .35), 0 2px 6px rgba(0, 0, 0, .4);
}

/* ------------------------------------------------------------------ */
/* Annotation and video tools                                          */
/* ------------------------------------------------------------------ */
.annotation-canvas__toolbar .btn-group,
.video-screen .controls .btn-group {
    padding: 4px;
    border-radius: 15px;
    background-color: var(--gt-glass);
    -webkit-backdrop-filter: blur(14px) saturate(150%);
    backdrop-filter: blur(14px) saturate(150%);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, .08), 0 14px 34px -14px rgba(0, 0, 0, .85);
}

.annotation-canvas__toolbar .btn-group:hover,
.video-screen .controls .btn-group:hover {
    background-color: color-mix(in srgb, var(--gt-bg) 78%, transparent);
}

/* Nested groups (sub-controls) cannot sample the canvas through the parent glass. */
.annotation-canvas__toolbar .btn-group .btn-group,
.video-screen .controls .btn-group .btn-group {
    background-color: color-mix(in srgb, var(--gt-solid) 94%, transparent);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
}

.control-button {
    color: #dbe3ee;
    background-color: transparent;
    border: 0;
    border-radius: 10px !important;
}

.control-button:not(:last-child) { margin-right: 3px; }

.control-button:hover,
.control-button:focus {
    color: #fff;
    background-color: rgba(255, 255, 255, .1);
}

.control-button.active,
.control-button:not(.control-button--danger).active {
    color: #fff;
    background-color: transparent;
    background-image: var(--gt-grad-deep);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .18), 0 0 18px -4px var(--gt-glow);
}

.control-button.control-button--danger.active { background-color: #be123c; background-image: none; }
.control-button.control-button--info.active { background-color: #0369a1; background-image: none; }
.control-button.control-button--success.active { background-color: #047857; background-image: none; }
.control-button.control-button--warning.active { background-color: #b45309; background-image: none; }

.control-button .control-button__tooltip { color: var(--gt-text); }

.control-button__sub-controls .btn { border-radius: 9px !important; }

.zoom-level-indicator,
.mouse-position-indicator,
.scale-line-indicator,
.label-indicator,
.labelbot-indicator,
.video-screen .indicator {
    color: var(--gt-text);
    background-color: var(--gt-glass);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, .08);
    border-radius: 10px;
    box-shadow: 0 10px 26px -14px rgba(0, 0, 0, .9);
    font-variant-numeric: tabular-nums;
}

/* Replaces BIIGLE's grey noise.png backdrop behind the image. */
.annotation-canvas,
.video-screen {
    background-color: var(--gt-bg);
    background-image:
        var(--gt-noise),
        radial-gradient(ellipse at 50% 45%, rgba(148, 163, 184, .07), transparent 70%);
}

.minimap {
    border: 0;
    border-radius: 12px;
    background-color: var(--gt-bg);
    background-image: var(--gt-noise);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, .14), 0 14px 34px -14px rgba(0, 0, 0, .9);
}

.ol-control {
    --ol-subtle-background-color: var(--gt-glass);
    padding: 3px;
    border-radius: 12px;
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, .08), 0 10px 26px -14px rgba(0, 0, 0, .9);
}

.ol-control:hover {
    --ol-subtle-background-color: color-mix(in srgb, var(--gt-bg) 80%, transparent);
}

.ol-control button {
    --ol-background-color: rgba(255, 255, 255, .06);
    border-radius: 9px;
}

.ol-control button:hover,
.ol-control button:focus,
.ol-control button.active {
    --ol-background-color: color-mix(in srgb, var(--gt-accent) 45%, transparent);
}

.ol-zoom .ol-zoom-in, .ol-zoom .ol-zoom-out { border-radius: 9px; }

.video-timeline,
.video-timeline .static-strip {
    border-color: var(--gt-border);
}

/* ------------------------------------------------------------------ */
/* Login and standalone forms                                          */
/* ------------------------------------------------------------------ */
.center-form .well {
    padding: 24px;
    border-radius: 22px;
    background-color: color-mix(in srgb, var(--gt-solid) 55%, transparent);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    backdrop-filter: blur(24px) saturate(160%);
    box-shadow: var(--gt-shadow-lg), 0 0 80px -30px var(--gt-glow);
}

.center-form .logo--standalone {
    font-size: 30px;
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */
.footer {
    border-top: 1px solid transparent;
    border-image: linear-gradient(90deg, transparent, var(--gt-border-2), transparent) 1;
}

.footer .footer-menu, .footer a { color: var(--gt-muted); }
.footer a:hover { color: var(--gt-strong); }

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */
@keyframes gt-pop {
    from { opacity: 0; transform: translateY(-4px) scale(.98); }
    to { opacity: 1; transform: none; }
}

@keyframes gt-rise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: none; }
}

@keyframes gt-drop {
    from { opacity: 0; transform: translateY(-14px); }
    to { opacity: 1; transform: none; }
}

@keyframes gt-pulse {
    0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--gt-accent) 55%, transparent); }
    50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--gt-accent) 0%, transparent); }
}

body > .container,
body > .container-fluid:not(.messages) {
    animation: gt-rise .5s var(--gt-ease) backwards;
}

.dashboard-project,
.activity-items .col-xs-6,
.project-volumes > .row > div {
    animation: gt-rise .55s var(--gt-ease) backwards;
}

.dashboard-project:nth-child(2), .activity-items .col-xs-6:nth-child(2), .project-volumes > .row > div:nth-child(2) { animation-delay: .05s; }
.dashboard-project:nth-child(3), .activity-items .col-xs-6:nth-child(3), .project-volumes > .row > div:nth-child(3) { animation-delay: .1s; }
.dashboard-project:nth-child(4), .activity-items .col-xs-6:nth-child(4), .project-volumes > .row > div:nth-child(4) { animation-delay: .15s; }
.dashboard-project:nth-child(5), .activity-items .col-xs-6:nth-child(5), .project-volumes > .row > div:nth-child(5) { animation-delay: .2s; }
.dashboard-project:nth-child(6), .activity-items .col-xs-6:nth-child(6), .project-volumes > .row > div:nth-child(6) { animation-delay: .25s; }
.dashboard-project:nth-child(7), .activity-items .col-xs-6:nth-child(7), .project-volumes > .row > div:nth-child(7) { animation-delay: .3s; }
.dashboard-project:nth-child(n+8), .activity-items .col-xs-6:nth-child(n+8), .project-volumes > .row > div:nth-child(n+8) { animation-delay: .35s; }


/* ------------------------------------------------------------------ */
/* Background glows (drift when the "drift" feature is on)             */
/* ------------------------------------------------------------------ */
/* Oversized so the edges never show while drifting. Positions are the former viewport
   positions converted to this 130% box. */
body::before {
    content: '';
    position: fixed;
    inset: -15%;
    z-index: -1;
    pointer-events: none;
    background-image:
        radial-gradient(1100px 620px at 17.7% 2.3%, color-mix(in srgb, var(--gt-a1) 13%, transparent), transparent 62%),
        radial-gradient(900px 560px at 90% 6.9%, color-mix(in srgb, var(--gt-a2) 12%, transparent), transparent 60%),
        radial-gradient(900px 700px at 50% 107.7%, color-mix(in srgb, var(--gt-a2) 7%, transparent), transparent 60%);
}

html.gt-f-drift:not(.gt-tool) body::before {
    animation: gt-drift 70s ease-in-out infinite alternate;
}

@keyframes gt-drift {
    0% { transform: translate3d(0, 0, 0) scale(1); }
    35% { transform: translate3d(5%, 3%, 0) scale(1.06); }
    70% { transform: translate3d(-4%, 5%, 0) scale(.97); }
    100% { transform: translate3d(3%, -3%, 0) scale(1.04); }
}

/* ------------------------------------------------------------------ */
/* Scroll progress instead of the page scrollbar                       */
/* ------------------------------------------------------------------ */
html {
    scrollbar-width: none;
}

html::-webkit-scrollbar,
body::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
}

/* The image grids (volume overview, Largo) have their own scroll control. With the
   gridline feature it is hidden and its position is shown by the progress line. */
html.gt-f-gridline .image-grid-progress {
    display: none;
}

/* Sidebars and everything scrolling inside them (label trees, lists) scroll without a bar. */
html.gt-f-sidebarscroll .sidebar,
html.gt-f-sidebarscroll .sidebar * {
    scrollbar-width: none;
}

html.gt-f-sidebarscroll .sidebar::-webkit-scrollbar,
html.gt-f-sidebarscroll .sidebar ::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
}

#biigle-glass-progress {
    background-image: var(--gt-grad);
    box-shadow: 0 0 10px var(--gt-glow);
    border-radius: 0 2px 2px 0;
    transition: opacity .3s ease;
}

/* ------------------------------------------------------------------ */
/* Message toasts                                                      */
/* ------------------------------------------------------------------ */
html.gt-f-toasts .messages__message {
    overflow: hidden;
    animation: gt-toast-in .5s var(--gt-ease) backwards;
}

/* BIIGLE closes non-error messages after 15s unless they are hovered. */
html.gt-f-toasts .messages__message:not(.alert-danger)::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 2px;
    background-color: var(--gt-c, var(--gt-accent));
    opacity: .75;
    transform-origin: left center;
    animation: gt-toast-timer 15s linear forwards;
    transition: opacity .3s ease;
}

html.gt-f-toasts .messages__message.gt-kept::after {
    opacity: 0;
}

/* Let closing messages fade out (BIIGLE removes them right away by default). */
html.gt-f-toasts .messages__message.scale-up-leave-active {
    display: block;
    animation: gt-toast-out .3s ease forwards;
}

@keyframes gt-toast-in {
    from { opacity: 0; transform: translateY(-18px) scale(.95); filter: blur(4px); }
}

@keyframes gt-toast-timer {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
}

@keyframes gt-toast-out {
    to { opacity: 0; transform: translateY(-12px) scale(.96); }
}

/* ------------------------------------------------------------------ */
/* Label selection pulse                                               */
/* ------------------------------------------------------------------ */
/* background: inherit picks up the dot's inline label colour. */
.label-tree-label .label-tree-label__color::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: inherit;
    opacity: 0;
    pointer-events: none;
}

.label-tree-label.label-tree-label--selected > .label-tree-label__name .label-tree-label__color::after {
    animation: gt-label-pulse .9s ease-out 2;
}

@keyframes gt-label-pulse {
    from { opacity: .7; transform: scale(1); }
    to { opacity: 0; transform: scale(2.8); }
}

/* ------------------------------------------------------------------ */
/* Loading shimmer                                                     */
/* ------------------------------------------------------------------ */
.gt-loading {
    background-image: linear-gradient(100deg, transparent 30%, rgba(148, 163, 184, .1) 50%, transparent 70%);
    background-size: 250% 100%;
    background-repeat: no-repeat;
    animation: gt-shimmer 1.3s linear infinite;
}

@keyframes gt-shimmer {
    from { background-position: 100% 0; }
    to { background-position: -150% 0; }
}

/* ------------------------------------------------------------------ */
/* Click ripple                                                        */
/* ------------------------------------------------------------------ */
.gt-ripple {
    position: fixed;
    z-index: 2147483000;
    overflow: hidden;
    pointer-events: none;
}

.gt-ripple > span {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, .35), rgba(255, 255, 255, .12) 60%, transparent 70%);
    animation: gt-ripple .55s cubic-bezier(.2, .8, .2, 1) forwards;
}

@keyframes gt-ripple {
    from { transform: scale(0); opacity: 1; }
    to { transform: scale(1); opacity: 0; }
}

/* ------------------------------------------------------------------ */
/* Input glow: a light runs along the border of the focused field      */
/* ------------------------------------------------------------------ */
@property --gt-angle {
    syntax: '<angle>';
    inherits: false;
    initial-value: 0deg;
}

html.gt-f-glow input.form-control:focus,
html.gt-f-glow textarea.form-control:focus {
    border-color: transparent;
    background:
        linear-gradient(var(--gt-field), var(--gt-field)) padding-box,
        conic-gradient(from var(--gt-angle), transparent 0 62%, var(--gt-a1) 80%, var(--gt-a2) 92%, transparent) border-box,
        linear-gradient(color-mix(in srgb, var(--gt-accent) 35%, transparent), color-mix(in srgb, var(--gt-accent) 35%, transparent)) border-box;
    animation: gt-spin 2.8s linear infinite;
}

html.gt-f-glow .has-error input.form-control:focus,
html.gt-f-glow .has-error textarea.form-control:focus {
    border-color: var(--gt-danger);
    background: var(--gt-field);
    animation: none;
}

@keyframes gt-spin {
    to { --gt-angle: 360deg; }
}

/* ------------------------------------------------------------------ */
/* Tab highlight that glides between tabs under the pointer            */
/* ------------------------------------------------------------------ */
html.gt-f-glide .nav-tabs {
    position: relative;
}

html.gt-f-glide .nav-tabs::before {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: var(--gt-glide-w, 0);
    height: var(--gt-glide-h, 0);
    transform: translate(var(--gt-glide-x, 0), var(--gt-glide-y, 0));
    border-radius: 10px 10px 0 0;
    background-color: var(--gt-surface-2);
    opacity: var(--gt-glide-o, 0);
    pointer-events: none;
    transition:
        transform var(--gt-glide-d, .3s) var(--gt-ease),
        width var(--gt-glide-d, .3s) var(--gt-ease),
        height var(--gt-glide-d, .3s) var(--gt-ease),
        opacity .2s ease;
}

html.gt-f-glide .nav-tabs > li > a:hover,
html.gt-f-glide .nav-tabs > li > a:focus {
    background-color: transparent;
}

/* ------------------------------------------------------------------ */
/* Focus mode in the annotation and video tools (Shift+Z)                    */
/* ------------------------------------------------------------------ */
html.gt-tool :is(.navbar, .sidebar, .annotation-canvas__left-indicators, .annotation-canvas__right-indicators, .minimap, .ol-control, .video-timeline, .video-screen .indicators) {
    transition: opacity .4s ease;
}

html.gt-tool.gt-focus :is(.navbar, .sidebar, .annotation-canvas__left-indicators, .annotation-canvas__right-indicators, .minimap, .ol-control, .video-timeline, .video-screen .indicators):not(:hover) {
    opacity: .12;
}

@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: .01ms !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
    }
}
`;

    // Page transitions only work if the opt-in rule exists before the first paint, so
    // record how early the userscript manager ran us (see biigleGlass.diagnostics()).
    const startState = {
        readyState: document.readyState,
        hadBody: !!document.body,
        paintedBefore: performance.getEntriesByType('paint').map((entry) => entry.name),
        time: performance.now(),
    };
    let revealedWithTransition = null;
    let atReveal = null;
    window.addEventListener('pagereveal', (event) => {
        revealedWithTransition = !!event.viewTransition;
        const sheet = document.getElementById('biigle-glass-transitions')?.sheet;
        atReveal = {
            msAfterScriptStart: Math.round(performance.now() - startState.time),
            optInRulePresent: !!sheet && [...sheet.cssRules].some((rule) => rule.type === CSSRule.VIEW_TRANSITION_RULE || rule.constructor.name === 'CSSViewTransitionRule'),
        };
    });
    window.addEventListener('pageswap', (event) => {
        try {
            sessionStorage.setItem('biigle-glass:swap', JSON.stringify({
                from: location.pathname,
                startedTransition: !!event.viewTransition,
            }));
        } catch (e) {
            // Diagnostics only.
        }
    });

    const root = document.documentElement;
    let enabled = store.get('enabled', true);
    let accent = store.get('accent', ACCENTS[0]);
    let textFont = store.get('textFont', 'plex-sans');
    let logoFont = store.get('logoFont', 'nunito');
    let background = store.get('background', 'midnight');
    let transitions = store.get('transitions', true);
    const features = {};
    Object.keys(FEATURES).forEach((key) => {
        features[key] = store.get(`feature:${key}`, true) !== false;
    });

    if (!ACCENTS.includes(accent)) accent = ACCENTS[0];
    if (!TEXT_FONTS[textFont]) textFont = 'plex-sans';
    if (!LOGO_FONTS[logoFont]) logoFont = 'nunito';
    if (!BACKGROUNDS[background]) background = 'midnight';

    // Remove leftovers if the script is evaluated twice (e.g. during development).
    document.getElementById('biigle-glass-style')?.remove();
    document.getElementById('biigle-glass-font')?.remove();
    document.getElementById('biigle-glass-transitions')?.remove();

    const font = document.createElement('link');
    font.id = 'biigle-glass-font';
    font.rel = 'stylesheet';

    const style = document.createElement('style');
    style.id = 'biigle-glass-style';
    style.textContent = CSS;

    const transitionStyle = document.createElement('style');
    transitionStyle.id = 'biigle-glass-transitions';

    function fontsUrl() {
        // Keyed by family so a logo font that is also the text font is requested once.
        // The text font request covers a weight range that includes the logo weight.
        const families = new Map();
        families.set(LOGO_FONTS[logoFont].name, LOGO_FONTS[logoFont].query);
        if (TEXT_FONTS[textFont].query) {
            families.set(TEXT_FONTS[textFont].name, TEXT_FONTS[textFont].query);
        }
        const params = [...families.values()].map((query) => `family=${query}`).join('&');

        return `https://fonts.googleapis.com/css2?${params}&display=swap`;
    }

    function applySettings() {
        const text = TEXT_FONTS[textFont];
        const logo = LOGO_FONTS[logoFont];
        root.dataset.gtAccent = accent;
        root.classList.toggle('gt-tool', IS_TOOL_PAGE);
        Object.keys(FEATURES).forEach((key) => {
            root.classList.toggle(`gt-f-${key}`, enabled && features[key]);
        });
        root.style.setProperty('--gt-bg', BACKGROUNDS[background].color);
        root.style.setProperty('--gt-font', text.stack);
        root.style.setProperty('--gt-logo-font', `"${logo.name}", ${text.stack}`);
        root.style.setProperty('--gt-logo-weight', logo.weight);
        root.style.setProperty('--gt-logo-spacing', logo.spacing);

        const href = fontsUrl();
        if (font.href !== href) font.href = href;
        style.media = enabled ? 'all' : 'not all';
        font.media = enabled ? 'all' : 'not all';
        // Emptied rather than disabled via media, so the @view-transition opt-in is gone for sure.
        transitionStyle.textContent = enabled && transitions
            ? MOTION_CSS + (IS_TOOL_PAGE ? '' : TRANSITION_CSS)
            : '';
    }

    // BIIGLE's own stylesheets are loaded in <head>. Our rules must come last so they win
    // at equal specificity, so we keep the style element at the end of <head>.
    function keepLast() {
        const parent = document.head || root;
        if (!font.isConnected) parent.appendChild(font);
        if (!transitionStyle.isConnected) parent.appendChild(transitionStyle);
        if (style.parentNode !== parent || parent.lastElementChild !== style) {
            parent.appendChild(style);
        }
    }

    applySettings();
    keepLast();
    // The browser checks the page transition opt-in when the page is first revealed. A style
    // element inserted by script is only picked up at the next style update, which can come
    // too late if the userscript manager ran us after parsing already reached <body>. Reading
    // a computed style forces that update right now.
    getComputedStyle(root).getPropertyValue('color');

    const observer = new MutationObserver(() => {
        keepLast();
        if (document.head && !observingHead) {
            observer.observe(document.head, {childList: true});
            observingHead = true;
        }
    });
    let observingHead = false;
    observer.observe(root, {childList: true});
    if (document.head) {
        observer.observe(document.head, {childList: true});
        observingHead = true;
    }

    // Spotlight that follows the pointer over thumbnails.
    document.addEventListener('pointermove', (event) => {
        if (!enabled || !(event.target instanceof Element)) return;
        const card = event.target.closest('.preview-thumbnail, .activity-item, .image-thumbnail');
        if (!card || card.closest('.image-grid__image')) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--gt-mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--gt-my', `${event.clientY - rect.top}px`);
    }, {passive: true});

    function motionEnabled() {
        return enabled && transitions && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Closing a sidebar tab hides it at once with display: none, which CSS cannot animate.
    // Instead a static copy of the tab is laid over its old spot and faded out. The real
    // layout still changes in one step, so the annotation canvas resizes only once.
    const openTabs = new WeakMap();

    function rememberTab(tab) {
        if (tab.classList.contains('sidebar__tab--open')) {
            openTabs.set(tab, {rect: tab.getBoundingClientRect(), scrollTop: tab.scrollTop});
        }
    }

    const tabResizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => rememberTab(entry.target));
    });

    // A click on a sidebar button is what usually closes a tab, so take a fresh snapshot.
    document.addEventListener('pointerdown', () => {
        document.querySelectorAll('.sidebar__tab--open').forEach(rememberTab);
    }, {capture: true, passive: true});

    document.addEventListener('scroll', (event) => {
        if (event.target instanceof Element && event.target.classList.contains('sidebar__tab--open')) {
            rememberTab(event.target);
        }
    }, {capture: true, passive: true});

    function animateTabClose(tab) {
        const state = openTabs.get(tab);
        if (!state || state.rect.width === 0) return;
        const sidebar = tab.closest('.sidebar');

        // Keep the sidebar classes so the copy is styled like the original.
        const ghost = document.createElement('div');
        ghost.className = sidebar ? sidebar.className : 'sidebar';
        ghost.setAttribute('aria-hidden', 'true');
        ghost.style.cssText = [
            'position: fixed', `left: ${state.rect.left}px`, `top: ${state.rect.top}px`,
            `width: ${state.rect.width}px`, `height: ${state.rect.height}px`,
            'z-index: 20', 'margin: 0', 'display: block', 'pointer-events: none',
        ].join(';');

        const copy = tab.cloneNode(true);
        copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
        copy.classList.add('sidebar__tab--open');
        copy.style.cssText = [
            'display: block', 'width: 100%', 'height: 100%', 'animation: none',
            'background-color: var(--gt-bg)', 'background-image: var(--gt-noise)',
        ].join(';');

        ghost.appendChild(copy);
        document.body.appendChild(ghost);
        copy.scrollTop = state.scrollTop;

        const direction = sidebar && sidebar.classList.contains('sidebar--left') ? -1 : 1;
        ghost.animate([
            {opacity: 1, transform: 'none'},
            {opacity: 0, transform: `translateX(${direction * 24}px)`},
        ], {duration: 240, easing: 'cubic-bezier(.4, 0, 1, 1)'})
            .finished
            .catch(() => {})
            .then(() => ghost.remove());
    }

    new MutationObserver((mutations) => {
        const closed = [];
        mutations.forEach(({target, oldValue}) => {
            if (!target.classList.contains('sidebar__tab')) return;
            const wasOpen = (oldValue || '').split(/\s+/).includes('sidebar__tab--open');
            const isOpen = target.classList.contains('sidebar__tab--open');
            if (isOpen) tabResizeObserver.observe(target);
            if (wasOpen && !isOpen) closed.push(target);
        });

        if (!motionEnabled()) return;
        closed.forEach((tab) => {
            // Switching to another tab of the same sidebar is covered by its slide-in.
            const sidebar = tab.closest('.sidebar');
            if (sidebar && sidebar.querySelector('.sidebar__tab--open')) return;
            animateTabClose(tab);
        });
    }).observe(root, {subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true});

    const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    const featureOn = (key) => enabled && features[key];

    // Toasts: BIIGLE stops the auto-close timer once a message is hovered, so hide the
    // countdown bar from then on.
    document.addEventListener('mouseover', (event) => {
        if (event.target instanceof Element) {
            event.target.closest('.messages__message')?.classList.add('gt-kept');
        }
    }, {passive: true});

    // Loading shimmer on thumbnails whose image has not arrived yet.
    const SHIMMER_HOSTS = '.preview-thumbnail, .activity-item, .image-thumbnail, .image-grid__image';

    function trackImage(img) {
        const host = img.closest(SHIMMER_HOSTS);
        if (host) host.classList.toggle('gt-loading', enabled && !img.complete);
    }

    function settleImage(event) {
        if (event.target instanceof HTMLImageElement) {
            event.target.closest(SHIMMER_HOSTS)?.classList.remove('gt-loading');
        }
    }

    document.addEventListener('load', settleImage, true);
    document.addEventListener('error', settleImage, true);

    new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes') {
                if (mutation.target instanceof HTMLImageElement) trackImage(mutation.target);
                return;
            }
            mutation.addedNodes.forEach((node) => {
                if (node instanceof HTMLImageElement) {
                    trackImage(node);
                } else if (node instanceof Element) {
                    node.querySelectorAll('img').forEach(trackImage);
                }
            });
        });
    }).observe(root, {subtree: true, childList: true, attributes: true, attributeFilter: ['src']});

    // Click ripple. It is drawn in a fixed overlay clipped to the button, so the buttons
    // themselves (and their absolutely positioned popups) stay untouched.
    const RIPPLE_TARGETS = '.btn, .dropdown-menu > li > a, .nav-tabs > li > a, .nav-pills > li > a, a.list-group-item';

    document.addEventListener('pointerdown', (event) => {
        if (!featureOn('ripple') || event.button !== 0 || reducedMotion()) return;
        if (!(event.target instanceof Element)) return;
        const target = event.target.closest(RIPPLE_TARGETS);
        if (!target || target.matches(':disabled, .disabled') || target.closest('.disabled')) return;

        const rect = target.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.className = 'gt-ripple';
        overlay.style.cssText = `left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px; border-radius: ${getComputedStyle(target).borderRadius};`;

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const size = 2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
        const wave = document.createElement('span');
        wave.style.cssText = `left: ${x - size / 2}px; top: ${y - size / 2}px; width: ${size}px; height: ${size}px;`;

        overlay.appendChild(wave);
        document.body.appendChild(overlay);
        wave.addEventListener('animationend', () => overlay.remove());
        setTimeout(() => overlay.remove(), 1000);
    }, {capture: true, passive: true});

    // Tab highlight that glides to the tab under the pointer.
    document.addEventListener('pointerover', (event) => {
        if (!featureOn('glide') || !(event.target instanceof Element)) return;
        const link = event.target.closest('.nav-tabs > li > a');
        if (!link) return;
        const list = link.closest('.nav-tabs');
        const listRect = list.getBoundingClientRect();
        const rect = link.getBoundingClientRect();
        // Appear in place instead of sliding in from the left edge.
        const hidden = list.style.getPropertyValue('--gt-glide-o') !== '1';
        list.style.setProperty('--gt-glide-d', hidden ? '0s' : '.3s');
        list.style.setProperty('--gt-glide-x', `${rect.left - listRect.left}px`);
        list.style.setProperty('--gt-glide-y', `${rect.top - listRect.top}px`);
        list.style.setProperty('--gt-glide-w', `${rect.width}px`);
        list.style.setProperty('--gt-glide-h', `${rect.height}px`);
        list.style.setProperty('--gt-glide-o', '1');
    }, {passive: true});

    document.addEventListener('pointerout', (event) => {
        if (!(event.target instanceof Element)) return;
        const list = event.target.closest('.nav-tabs');
        if (list && !list.contains(event.relatedTarget)) {
            list.style.setProperty('--gt-glide-o', '0');
        }
    }, {passive: true});

    // Tab badge counts ("4k", "28k", "9M", "505") roll up once when the page loads.
    function countUp(badge) {
        const original = badge.textContent.trim();
        const match = original.match(/^(\d+(?:[.,]\d+)?)([kKmMbB]?)$/);
        if (!match) return;
        const target = parseFloat(match[1].replace(',', '.'));
        const decimals = (match[1].split(/[.,]/)[1] || '').length;
        const start = performance.now();
        const duration = 900;
        let written = original;

        function frame(now) {
            // Stop if BIIGLE changed the badge in the meantime.
            if (badge.textContent !== written) return;
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            written = progress < 1 ? (target * eased).toFixed(decimals) + match[2] : original;
            badge.textContent = written;
            if (progress < 1) requestAnimationFrame(frame);
        }

        written = (0).toFixed(decimals) + match[2];
        badge.textContent = written;
        requestAnimationFrame(frame);
    }

    // Thin progress line below the navbar instead of the (hidden) page scrollbar.
    let progressBar = null;
    let progressQueued = false;

    function updateProgress() {
        progressQueued = false;
        if (!progressBar) return;
        const navbar = document.querySelector('.navbar');
        progressBar.style.top = `${navbar ? Math.max(0, navbar.getBoundingClientRect().bottom) : 0}px`;

        // Image grids scroll internally; BIIGLE tracks their position as the height of
        // the (hidden) progress bar filling.
        const gridProgress = featureOn('gridline') && document.querySelector('.image-grid-progress__inner');
        let visible;
        let fraction;
        if (gridProgress) {
            visible = true;
            fraction = (parseFloat(gridProgress.style.height) || 0) / 100;
        } else {
            const scrollable = root.scrollHeight - root.clientHeight;
            visible = scrollable > 8;
            fraction = scrollable > 0 ? root.scrollTop / scrollable : 0;
        }
        progressBar.style.opacity = enabled && visible ? '1' : '0';
        progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, fraction))})`;
    }

    new MutationObserver((mutations) => {
        if (mutations.some(({target}) => target.classList.contains('image-grid-progress__inner'))) {
            queueProgress();
        }
    }).observe(root, {subtree: true, attributes: true, attributeFilter: ['style']});

    function queueProgress() {
        if (!progressQueued) {
            progressQueued = true;
            requestAnimationFrame(updateProgress);
        }
    }

    window.addEventListener('scroll', queueProgress, {passive: true});
    window.addEventListener('resize', queueProgress, {passive: true});

    // Focus mode in the annotation and video tools: Shift+Z dims everything but the image
    // and the toolbar (plain Z is taken by the annotation tool). Hovering a dimmed part brings it back while the pointer is on it.
    let focusMode = false;

    function setFocusMode(on) {
        focusMode = IS_TOOL_PAGE && on;
        root.classList.toggle('gt-focus', enabled && focusMode);
        return focusMode;
    }

    document.addEventListener('keydown', (event) => {
        if (!IS_TOOL_PAGE || !enabled || event.repeat) return;
        if (event.key.toLowerCase() !== 'z' || !event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
        const target = event.target;
        if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]')) return;
        setFocusMode(!focusMode);
        toast(focusMode ? 'Focus mode on (press Shift+Z to leave)' : 'Focus mode off');
    });

    function onReady() {
        progressBar = document.createElement('div');
        progressBar.id = 'biigle-glass-progress';
        progressBar.setAttribute('aria-hidden', 'true');
        progressBar.style.cssText = 'position: fixed; left: 0; width: 100%; height: 2px; z-index: 1031; pointer-events: none; opacity: 0; transform-origin: 0 50%; transform: scaleX(0);';
        document.body.appendChild(progressBar);
        queueProgress();
        // Content (e.g. thumbnails) can change the page height after load.
        new ResizeObserver(queueProgress).observe(document.body);

        document.querySelectorAll('img').forEach(trackImage);

        if (enabled && !reducedMotion()) {
            document.querySelectorAll('.nav-tabs .badge, .nav-pills .badge').forEach(countUp);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }

    // Short confirmation for the menu commands. Styled inline so it also shows while
    // the theme itself is switched off.
    let toastTimeout;
    function toast(message) {
        if (!document.body) return;
        let element = document.getElementById('biigle-glass-toast');
        if (!element) {
            element = document.createElement('div');
            element.id = 'biigle-glass-toast';
            element.style.cssText = [
                'position: fixed', 'left: 50%', 'bottom: 24px', 'z-index: 2000',
                'padding: 8px 16px', 'border-radius: 999px', 'pointer-events: none',
                'font: 500 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                'color: #f8fafc', 'background: rgba(9, 14, 27, .9)',
                '-webkit-backdrop-filter: blur(12px)', 'backdrop-filter: blur(12px)',
                'box-shadow: 0 0 0 1px rgba(148, 163, 184, .2), 0 16px 40px -12px rgba(0, 0, 0, .8)',
                'opacity: 0', 'transform: translate(-50%, 8px)',
                'transition: opacity .2s ease, transform .2s ease',
            ].join(';');
            document.body.appendChild(element);
            // Flush styles so the first toast animates in.
            element.getBoundingClientRect();
        }
        element.textContent = message;
        element.style.opacity = '1';
        element.style.transform = 'translate(-50%, 0)';
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            element.style.opacity = '0';
            element.style.transform = 'translate(-50%, 8px)';
        }, 1800);
    }

    function nextOf(keys, current) {
        return keys[(keys.indexOf(current) + 1) % keys.length];
    }

    // Also handy from the devtools console, e.g. biigleGlass.logoFont('outfit').
    const api = {
        accents: ACCENTS.slice(),
        textFonts: Object.keys(TEXT_FONTS),
        logoFonts: Object.keys(LOGO_FONTS),
        backgrounds: Object.keys(BACKGROUNDS),
        accent(name) {
            if (!ACCENTS.includes(name)) return accent;
            accent = name;
            store.set('accent', accent);
            applySettings();
            return accent;
        },
        font(name) {
            if (!TEXT_FONTS[name]) return textFont;
            textFont = name;
            store.set('textFont', textFont);
            applySettings();
            return textFont;
        },
        logoFont(name) {
            if (!LOGO_FONTS[name]) return logoFont;
            logoFont = name;
            store.set('logoFont', logoFont);
            applySettings();
            return logoFont;
        },
        background(name) {
            if (!BACKGROUNDS[name]) return background;
            background = name;
            store.set('background', background);
            applySettings();
            return background;
        },
        transitions(force) {
            transitions = typeof force === 'boolean' ? force : !transitions;
            store.set('transitions', transitions);
            applySettings();
            return transitions;
        },
        features: Object.keys(FEATURES),
        feature(name, force) {
            if (!(name in FEATURES)) return null;
            features[name] = typeof force === 'boolean' ? force : !features[name];
            store.set(`feature:${name}`, features[name]);
            applySettings();
            queueProgress();
            return features[name];
        },
        focus(force) {
            return setFocusMode(typeof force === 'boolean' ? force : !focusMode);
        },
        diagnostics() {
            let previousPage = null;
            try {
                previousPage = JSON.parse(sessionStorage.getItem('biigle-glass:swap'));
            } catch (e) {
                // Diagnostics only.
            }
            return {
                viewTransitionsSupported: typeof CSSViewTransitionRule !== 'undefined',
                transitionsEnabled: motionEnabled(),
                toolPage: IS_TOOL_PAGE,
                scriptStart: startState,
                injectedInTime: startState.paintedBefore.length === 0,
                revealedWithTransition,
                atReveal,
                previousPage,
            };
        },
        toggle(force) {
            enabled = typeof force === 'boolean' ? force : !enabled;
            store.set('enabled', enabled);
            applySettings();
            return enabled;
        },
    };

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('Toggle theme', () => {
            api.toggle();
            toast(enabled ? 'Glass theme on' : 'Glass theme off');
        });

        GM_registerMenuCommand('Toggle transitions', () => {
            api.transitions();
            toast(transitions ? 'Transitions on' : 'Transitions off');
        });

        Object.entries(FEATURES).forEach(([key, label]) => {
            GM_registerMenuCommand(`Toggle ${label}`, () => {
                const on = api.feature(key);
                toast(`${label.charAt(0).toUpperCase()}${label.slice(1)} ${on ? 'on' : 'off'}`);
            });
        });

        GM_registerMenuCommand('Next accent colour', () => {
            api.accent(nextOf(api.accents, accent));
            toast(`Accent: ${accent}`);
        });

        GM_registerMenuCommand('Next background', () => {
            api.background(nextOf(api.backgrounds, background));
            toast(`Background: ${BACKGROUNDS[background].name}`);
        });

        GM_registerMenuCommand('Next text font', () => {
            api.font(nextOf(api.textFonts, textFont));
            toast(`Text font: ${TEXT_FONTS[textFont].name}`);
        });

        GM_registerMenuCommand('Next logo font', () => {
            api.logoFont(nextOf(api.logoFonts, logoFont));
            toast(`Logo font: ${LOGO_FONTS[logoFont].name}`);
        });
    }

    try {
        (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).biigleGlass = api;
    } catch (e) {
        window.biigleGlass = api;
    }
})();

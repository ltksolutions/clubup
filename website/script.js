// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2
//
// ClubUp.sk — nav interactivity (responsive hamburger, dropdown menus, current page highlight)

(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 1024; // must match the CSS @media (max-width: 1024px)

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    const body = document.body;

    // Insert hamburger bars (3 spans the CSS animates into an X) ONCE.
    if (toggle && !toggle.querySelector('.bar')) {
      toggle.innerHTML =
        '<span class="bar" aria-hidden="true"></span>' +
        '<span class="bar" aria-hidden="true"></span>' +
        '<span class="bar" aria-hidden="true"></span>';
      toggle.setAttribute('aria-label', 'Otvoriť menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', 'nav-links');
      toggle.setAttribute('type', 'button');
    }
    if (links && !links.id) {
      links.id = 'nav-links';
    }

    // Insert backdrop overlay element (created once)
    let backdrop = document.querySelector('.nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nav-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    const isOpen = () => links && links.classList.contains('open');

    const openMenu = () => {
      if (!links || !toggle) return;
      links.classList.add('open');
      toggle.classList.add('is-open');
      backdrop.classList.add('is-open');
      body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Zavrieť menu');
    };

    const closeMenu = () => {
      if (!links || !toggle) return;
      links.classList.remove('open');
      toggle.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Otvoriť menu');
    };

    const toggleMenu = () => (isOpen() ? closeMenu() : openMenu());

    if (toggle && links) {
      toggle.addEventListener('click', toggleMenu);
    }

    backdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) closeMenu();
    });

    if (links) {
      links.addEventListener('click', (e) => {
        const target = e.target;
        if (target && target.tagName === 'A' && isOpen()) {
          closeMenu();
        }
      });
    }

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const onMqChange = (e) => { if (!e.matches) closeMenu(); };
    if (mq.addEventListener) {
      mq.addEventListener('change', onMqChange);
    } else if (mq.addListener) {
      mq.addListener(onMqChange);
    }

    // Highlight current page in nav
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href) return;
      if (href === path || (path === '' && href === 'index.html')) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });

    // Dropdown menus
    const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;

    const closeAllDropdowns = (except = null) => {
      document.querySelectorAll('.nav-dropdown-btn').forEach((btn) => {
        if (btn !== except) btn.setAttribute('aria-expanded', 'false');
      });
    };

    document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
      const btn = dropdown.querySelector('.nav-dropdown-btn');
      const menu = dropdown.querySelector('.nav-dropdown-menu');
      if (!btn || !menu) return;

      const isDdOpen = () => btn.getAttribute('aria-expanded') === 'true';
      const open = () => { closeAllDropdowns(btn); btn.setAttribute('aria-expanded', 'true'); };
      const close = () => btn.setAttribute('aria-expanded', 'false');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        isDdOpen() ? close() : open();
      });

      dropdown.addEventListener('mouseenter', () => { if (!isMobile()) open(); });
      dropdown.addEventListener('mouseleave', () => { if (!isMobile()) close(); });

      menu.addEventListener('click', (e) => {
        if (e.target.closest('a')) closeAllDropdowns();
      });

      const childLinks = Array.from(menu.querySelectorAll('a[href]'))
        .map(a => a.getAttribute('href').split('/').pop());
      if (childLinks.includes(path) || (path === '' && childLinks.includes('index.html'))) {
        btn.classList.add('dd-active');
      }
      if (btn.dataset.dropdown === 'ecosystem' && path === 'ekosystem.html') {
        btn.classList.add('dd-active');
      }

      menu.querySelectorAll('.dd-item').forEach((a) => {
        const href = (a.getAttribute('href') || '').split('/').pop();
        if (href === path || (path === '' && href === 'index.html')) {
          a.classList.add('dd-current');
        }
      });
    });

    document.addEventListener('click', () => closeAllDropdowns());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllDropdowns();
    });
  });
})();

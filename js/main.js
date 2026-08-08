/* ============================================================
   Адвокат Иванцов С. А. — одностраничный лендинг
   Модули: шапка · меню · плавный скролл · аккордеоны ·
   появление секций · hero-сцена · Яндекс Метрика
   ============================================================ */

'use strict';

/* ---------- Конфигурация ---------- */

// Номер счётчика Яндекс Метрики.
// Счётчик инициализируется здесь и только здесь: второй установки
// (инлайн в index.html, код из панели конструктора) быть не должно —
// иначе визиты и цели учитываются дважды.
// ТЕСТОВАЯ КОПИЯ: счётчик включается только на рабочем домене.
// Заходы на тестовую ссылку в статистику клиента не попадают.
const METRIKA_ID = /(^|\.)advokativantsov\.ru$/.test(location.hostname) ? 111023266 : 0;

/* Единый источник телефона, мессенджеров и цен (ТЗ, раздел 14).
   Эти значения встречаются в шапке, hero, экстренном блоке, консультациях,
   FAQ, контактах, футере и мобильной панели. Меняем их ТОЛЬКО здесь:
   разметка помечена атрибутами data-site="…" и подтягивает значения сама.
   В HTML те же значения оставлены как запасной вариант — страница
   остаётся корректной, даже если JS не выполнится. */
const SITE = {
  phone: '+79260730999',
  phoneLabel: '+7 (926) 073-09-99',
  telegram: 'https://t.me/advokat_ivantsov',
  telegramLabel: '@advokat_ivantsov',
  whatsapp: 'https://wa.me/79260730999',
  email: 'law@advokativantsov.ru',
  priceExpress: '5 000 ₽',
  priceOffline: '15 000 ₽',
};

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Единообразие телефона, мессенджеров и цен ---------- */

// Ключ data-site → что подставить: href и/или текст.
// Неразрывные пробелы в вёрстке приводим к обычным при сравнении,
// чтобы «5 000 ₽» и «5&nbsp;000&nbsp;₽» не считались расхождением.
const SITE_BINDINGS = {
  'phone-link': { href: () => `tel:${SITE.phone}` },
  'phone-text': { text: () => SITE.phoneLabel },
  'telegram-link': { href: () => SITE.telegram },
  'telegram-text': { text: () => SITE.telegramLabel },
  'whatsapp-link': { href: () => SITE.whatsapp },
  'email-link': { href: () => `mailto:${SITE.email}` },
  'email-text': { text: () => SITE.email },
  'price-express': { text: () => SITE.priceExpress },
  'price-offline': { text: () => SITE.priceOffline },
};

const normalize = (value) => value.replace(/ /g, ' ').trim();

function initSiteData() {
  document.querySelectorAll('[data-site]').forEach((el) => {
    const binding = SITE_BINDINGS[el.dataset.site];
    if (!binding) return;

    if (binding.href) {
      const value = binding.href();
      // Расхождение вёрстки и константы — повод поправить HTML-запасной вариант
      if (el.getAttribute('href') !== value) {
        console.warn(`[site] href «${el.dataset.site}» в разметке отличается от константы:`, el.getAttribute('href'), '→', value);
        el.setAttribute('href', value);
      }
    }

    if (binding.text) {
      const value = binding.text();
      if (normalize(el.textContent) !== value) {
        console.warn(`[site] текст «${el.dataset.site}» в разметке отличается от константы:`, normalize(el.textContent), '→', value);
      }
      // Неразрывный пробел сохраняем: цена и номер не должны переноситься
      el.textContent = value.replace(/ /g, ' ');
    }
  });
}

/* ---------- Шапка: фон при скролле, скрытие при чтении вниз ---------- */

function initHeader() {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  if (!header) return;

  let lastY = window.scrollY;

  const update = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 8);

    // Вниз — шапка уходит, освобождая экран; вверх — сразу возвращается
    const menuOpen = nav && nav.classList.contains('is-open');
    if (y > 200 && y > lastY && !menuOpen) {
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }
    lastY = y;
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---------- Подсветка активного пункта меню (scrollspy) ---------- */

function initScrollSpy() {
  const links = document.querySelectorAll('.nav__link');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const sectionToLink = new Map();
  links.forEach((link) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) sectionToLink.set(target, link);
  });

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.remove('is-active'));
        sectionToLink.get(entry.target).classList.add('is-active');
      });
    },
    // Секция считается активной, когда пересекает середину экрана
    { rootMargin: '-45% 0px -50% 0px' }
  );

  sectionToLink.forEach((link, section) => spy.observe(section));
}

/* ---------- Мобильное меню ---------- */

function initMenu() {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  if (!burger || !nav) return;

  const close = () => {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    nav.classList.remove('is-open');
  };

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
    nav.classList.toggle('is-open', !isOpen);
  });

  // Переход по якорю закрывает меню
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

/* ---------- Плавный скролл по якорям ---------- */

function initSmoothScroll() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (hash === '#') return;

    const target = document.getElementById(hash.slice(1));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' });

    // Адрес пересобираем из текущих path и search: UTM-метки рекламной
    // ссылки (?utm_source=…&utm_campaign=…#urgent) обязаны пережить
    // переход по якорю — иначе источник обращения теряется (ТЗ, п. 4)
    history.pushState(null, '', location.pathname + location.search + hash);
  });
}

/* ---------- Аккордеоны (защита бизнеса, FAQ) ---------- */

function initAccordions() {
  document.querySelectorAll('.acc__head').forEach((head) => {
    const panel = document.getElementById(head.getAttribute('aria-controls'));
    if (!panel) return;

    // Начальное состояние берётся из aria-expanded в разметке
    const expanded = head.getAttribute('aria-expanded') === 'true';
    panel.classList.toggle('is-open', expanded);
    if (!expanded) panel.setAttribute('aria-hidden', 'true');

    head.addEventListener('click', () => {
      const isOpen = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', String(!isOpen));
      panel.classList.toggle('is-open', !isOpen);
      if (isOpen) {
        panel.setAttribute('aria-hidden', 'true');
      } else {
        panel.removeAttribute('aria-hidden');
      }
    });
  });
}

/* ---------- Появление секций при скролле ---------- */

function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  // Небольшая задержка между соседними элементами внутри группы
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    group.querySelectorAll('[data-reveal]').forEach((item, index) => {
      item.style.setProperty('--reveal-delay', `${index * 0.12}s`);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
  );

  items.forEach((item) => observer.observe(item));
}

/* ---------- Hero: оркестрованная сцена загрузки ---------- */

function initHero() {
  // Класс .is-loaded запускает проявление фигуры из фона
  // и каскад текста (задержки заданы в CSS)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('is-loaded');
    });
  });
}

/* ---------- Hero: лёгкий параллакс фигуры при скролле ---------- */

function initParallax() {
  // Двигаем обёртку, а не сам <img>: на изображении живёт бесконечный
  // дрейф из CSS, и запись transform в него погасила бы анимацию
  const layer = document.querySelector('.hero__parallax');
  if (!layer || REDUCED_MOTION) return;

  const wide = window.matchMedia('(min-width: 64em)');
  let ticking = false;

  const update = () => {
    ticking = false;
    if (!wide.matches) {
      layer.style.transform = '';
      return;
    }
    const y = window.scrollY;
    // Кадр отстаёт от текста, пока первый экран в поле зрения
    layer.style.transform = y < window.innerHeight ? `translate3d(0, ${y * 0.12}px, 0)` : '';
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
}

/* ---------- Яндекс Метрика и цели ---------- */

/* Показатели в блоке «Почему мне доверяют» больше не анимируются:
   счётчик, набегающий от нуля, при медленной загрузке или отключённом JS
   показывал «000+» и «00%» — техническая ошибка на самом видном месте
   (ТЗ, раздел 2). Формулировки теперь статичные, скрипт им не нужен. */

// Одно и то же событие за просмотр страницы отправляем один раз:
// повторный reachGoal конверсию не добавляет, а данные засоряет (ТЗ, п. 11)
const sentGoals = new Set();

function reachGoal(goal) {
  if (!goal || sentGoals.has(goal)) return;
  sentGoals.add(goal);

  if (METRIKA_ID && typeof window.ym === 'function') {
    window.ym(METRIKA_ID, 'reachGoal', goal);
  }
}

function initMetrika() {
  if (!METRIKA_ID) return;

  // Стандартный загрузчик Метрики, вынесенный из инлайна
  window.ym =
    window.ym ||
    function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
  window.ym.l = Date.now();

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.appendChild(script);

  window.ym(METRIKA_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
}

/* Каждая точка контакта помечена своим data-goal — так видно, какое именно
   место страницы приводит обращения (ТЗ, п. 11):
     phone_header · phone_hero · phone_urgent · phone_consultation ·
     phone_contacts · phone_mobile_panel
     telegram_hero · telegram_urgent · telegram_consultation ·
     telegram_contacts · telegram_footer · telegram_mobile_panel
     whatsapp_contacts · whatsapp_mobile_panel
     email_contacts · consultation_button
   Обработчик один на документ: второго слушателя, который отправил бы
   то же событие повторно, на странице нет. */
function initGoals() {
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-goal]');
    if (target) {
      reachGoal(target.dataset.goal);
    }
  });
}

/* ---------- Запуск ---------- */

document.documentElement.classList.add('js');

initSiteData();
initHeader();
initScrollSpy();
initMenu();
initSmoothScroll();
initAccordions();
initReveal();
initHero();
initParallax();
initMetrika();
initGoals();

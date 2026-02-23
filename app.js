/* app.js — JOHNGALTAZ MVP (frontend-only)
   Логика: каталог/фильтры/поиск/сортировка/корзина/избранное/сравнение/валюта/язык (демо)
   Хранение: localStorage
*/

(() => {
  "use strict";

  // ----------------------------
  // Helpers
  // ----------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const LS_KEYS = {
    cart: "jg_cart_v1",
    wishlist: "jg_wishlist_v1",
    compare: "jg_compare_v1",
    currency: "jg_currency_v1",
    lang: "jg_lang_v1",
  };

  const safeJSON = (value, fallback) => {
    try { return JSON.parse(value); } catch { return fallback; }
  };

  const readLS = (k, fallback) => safeJSON(localStorage.getItem(k), fallback);
  const writeLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const escapeHTML = (s) =>
    String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

  const formatInt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

  // ----------------------------
  // Currency (demo conversion)
  // ----------------------------
  // NOTE: коэффициенты демонстрационные. Позже подключим реальные курсы.
  const FX = {
    KZT: 1,
    RUB: 0.20, // 1 KZT ~ 0.20 RUB (пример)
    USD: 0.0022, // 1 KZT ~ 0.0022 USD (пример)
  };

  const CURRENCY_SIGNS = {
    KZT: "₸",
    RUB: "₽",
    USD: "$",
  };

  const getCurrency = () => readLS(LS_KEYS.currency, "KZT");
  const setCurrency = (c) => { writeLS(LS_KEYS.currency, c); refreshCurrencyUI(); rerenderAll(); };

  const priceToCurrency = (kzt) => {
    const cur = getCurrency();
    const val = kzt * (FX[cur] ?? 1);
    if (cur === "USD") return `${val.toFixed(0)} ${CURRENCY_SIGNS[cur]}`;
    return `${formatInt(val)} ${CURRENCY_SIGNS[cur]}`;
  };

  // ----------------------------
  // Language (demo only)
  // ----------------------------
  const getLang = () => readLS(LS_KEYS.lang, "ru");
  const setLang = (lang) => { writeLS(LS_KEYS.lang, lang); refreshLangUI(); };

  const refreshLangUI = () => {
    const lang = getLang().toUpperCase();
    $$('[data-menu="langMenu"]').forEach((btn) => (btn.textContent = lang));
  };

  const refreshCurrencyUI = () => {
    const cur = getCurrency();
    $$('[data-menu="curMenu"]').forEach((btn) => (btn.textContent = cur));
  };

  // ----------------------------
  // Demo dataset
  // ----------------------------
  // Категории: laptops | periphery | appliances | cosmo | medical
  // Наличие: in_stock | preorder
  // Для мед/косм: requiresQuote (запрос КП вместо корзины), importantNotice
  const PRODUCTS = [
    {
      id: "lap-911x-4060",
      cat: "laptops",
      brand: "THUNDEROBOT",
      name: "THUNDEROBOT 911X — RTX 4060 / Ryzen 7",
      priceKZT: 649000,
      oldPriceKZT: 699000,
      stock: "preorder",
      preorderDaysToAlmaty: 8,
      tags: ["RTX 4060", "Ryzen 7", "16GB", "512GB", "15.6", "165Hz"],
      specs: {
        cpu: "Ryzen 7",
        gpu: "RTX 4060",
        ram: "16GB",
        ssd: "512GB",
        screen: "15.6",
        hz: "165",
        matrix: "IPS",
        os: "No OS",
      },
      image: null,
    },
    {
      id: "lap-g15-4070",
      cat: "laptops",
      brand: "THUNDEROBOT",
      name: "THUNDEROBOT G15 — RTX 4070 / i7",
      priceKZT: 899000,
      oldPriceKZT: null,
      stock: "in_stock",
      preorderDaysToAlmaty: 8,
      tags: ["RTX 4070", "i7", "32GB", "1TB", "16", "240Hz"],
      specs: {
        cpu: "Core i7",
        gpu: "RTX 4070",
        ram: "32GB",
        ssd: "1TB",
        screen: "16",
        hz: "240",
        matrix: "IPS",
        os: "Windows",
      },
      image: null,
    },
    {
      id: "per-mouse-x1",
      cat: "periphery",
      brand: "LogiPro",
      name: "Игровая мышь X1 (RGB)",
      priceKZT: 18990,
      oldPriceKZT: 24990,
      stock: "in_stock",
      preorderDaysToAlmaty: 8,
      tags: ["Мышь", "RGB", "12000 DPI"],
      specs: { type: "mouse" },
      image: null,
    },
    {
      id: "per-kb-mech",
      cat: "periphery",
      brand: "KeyForge",
      name: "Механическая клавиатура (Hot-swap)",
      priceKZT: 34990,
      oldPriceKZT: null,
      stock: "preorder",
      preorderDaysToAlmaty: 8,
      tags: ["Клавиатура", "Hot-swap", "TKL"],
      specs: { type: "keyboard" },
      image: null,
    },
    {
      id: "app-kettle",
      cat: "appliances",
      brand: "HomeLite",
      name: "Электрочайник 1.7L (сталь)",
      priceKZT: 15990,
      oldPriceKZT: null,
      stock: "in_stock",
      preorderDaysToAlmaty: 8,
      tags: ["1.7L", "Сталь"],
      specs: { type: "kettle" },
      image: null,
    },
    {
      id: "cos-laser-mini",
      cat: "cosmo",
      brand: "DermaPro",
      name: "Диодный лазер (компакт)",
      priceKZT: 1250000,
      oldPriceKZT: null,
      stock: "preorder",
      preorderDaysToAlmaty: 8,
      requiresQuote: true,
      importantNotice: "Перед покупкой требуется консультация специалиста. Уточните противопоказания.",
      tags: ["Запрос КП", "Документы"],
      specs: { type: "cosmo_device" },
      image: null,
    },
    {
      id: "med-ecg-12",
      cat: "medical",
      brand: "MedLine",
      name: "ЭКГ аппарат 12 каналов",
      priceKZT: 890000,
      oldPriceKZT: null,
      stock: "preorder",
      preorderDaysToAlmaty: 8,
      requiresQuote: true,
      importantNotice: "Использовать по назначению. Требуются документы/рег. удостоверение (если применимо).",
      tags: ["Запрос КП", "Сертификаты"],
      specs: { type: "medical_device" },
      image: null,
    },
  ];

  const CATS = {
    laptops: "Игровые ноутбуки",
    periphery: "Периферия",
    appliances: "Мелко-бытовая техника",
    cosmo: "Косметическое оборудование",
    medical: "Медицинское оборудование",
    b2b: "Юр. лица",
  };

  // ----------------------------
  // State stores
  // ----------------------------
  const getCart = () => readLS(LS_KEYS.cart, {}); // {productId: qty}
  const setCart = (obj) => { writeLS(LS_KEYS.cart, obj); updateBadges(); renderCartDrawer(); };

  const getWishlist = () => readLS(LS_KEYS.wishlist, []); // [id]
  const setWishlist = (arr) => { writeLS(LS_KEYS.wishlist, arr); updateBadges(); renderWishlistDrawer(); };

  const getCompare = () => readLS(LS_KEYS.compare, []); // [id] max 4
  const setCompare = (arr) => { writeLS(LS_KEYS.compare, arr); updateBadges(); renderCompareDrawer(); };

  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

  // ----------------------------
  // Badges
  // ----------------------------
  const updateBadges = () => {
    const cart = getCart();
    const wish = getWishlist();
    const cmp = getCompare();
    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

    $$('[data-badge="cart"]').forEach((el) => (el.textContent = String(cartCount)));
    $$('[data-badge="wishlist"]').forEach((el) => (el.textContent = String(wish.length)));
    $$('[data-badge="compare"]').forEach((el) => (el.textContent = String(cmp.length)));
  };

  // ----------------------------
  // Drawer controls
  // ----------------------------
  const drawers = {
    cart: "#drawerCart",
    wishlist: "#drawerWishlist",
    compare: "#drawerCompare",
  };

  const openDrawer = (key) => {
    const el = $(drawers[key]);
    if (!el) return;
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };

  const closeDrawer = (rootEl) => {
    if (!rootEl) return;
    rootEl.classList.remove("is-open");
    rootEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  const initDrawers = () => {
    $$("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => openDrawer(btn.dataset.open));
    });
    $$("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => closeDrawer(btn.closest(".drawer")));
    });
  };

  // ----------------------------
  // Select menus (lang/currency)
  // ----------------------------
  const initSelectMenus = () => {
    $$("[data-menu]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const menuId = btn.dataset.menu;
        const menu = $("#" + menuId);
        const expanded = btn.getAttribute("aria-expanded") === "true";
        // close all
        $$("[data-menu]").forEach((b) => b.setAttribute("aria-expanded", "false"));
        $$(".select__menu").forEach((m) => m.classList.remove("is-open"));
        if (!expanded) {
          btn.setAttribute("aria-expanded", "true");
          menu?.classList.add("is-open");
        }
      });
    });

    document.addEventListener("click", () => {
      $$("[data-menu]").forEach((b) => b.setAttribute("aria-expanded", "false"));
      $$(".select__menu").forEach((m) => m.classList.remove("is-open"));
    });

    // lang
    $$("[data-lang]").forEach((item) => {
      item.addEventListener("click", () => {
        setLang(item.dataset.lang);
      });
    });

    // currency
    $$("[data-currency]").forEach((item) => {
      item.addEventListener("click", () => {
        setCurrency(item.dataset.currency);
      });
    });
  };

  // ----------------------------
  // Actions: cart/wishlist/compare
  // ----------------------------
  const toggleWishlist = (id) => {
    const list = getWishlist();
    const idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(id);
    setWishlist(list);
  };

  const toggleCompare = (id) => {
    const list = getCompare();
    const idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1);
    else {
      if (list.length >= 4) {
        alert("В сравнении максимум 4 товара.");
        return;
      }
      list.push(id);
    }
    setCompare(list);
  };

  const addToCart = (id, qty = 1) => {
    const p = findProduct(id);
    if (!p) return;
    if (p.requiresQuote) {
      alert("Для этого товара доступен только «Запрос КП». Откройте карточку/форму заявки (будет на следующем шаге).");
      return;
    }
    const cart = getCart();
    cart[id] = (cart[id] ?? 0) + qty;
    cart[id] = clamp(cart[id], 1, 99);
    setCart(cart);
  };

  const setCartQty = (id, qty) => {
    const cart = getCart();
    if (qty <= 0) delete cart[id];
    else cart[id] = clamp(qty, 1, 99);
    setCart(cart);
  };

  // ----------------------------
  // Render: mini cards (Home)
  // ----------------------------
  const renderHomeFeatured = () => {
    const wrap = $("#homeFeatured");
    if (!wrap) return;

    const featured = PRODUCTS.slice(0, 4);
    wrap.innerHTML = featured.map((p) => miniCardHTML(p)).join("");
    bindCardActions(wrap);
  };

  const miniCardHTML = (p) => {
    const stock = p.stock === "in_stock"
      ? `<span class="pill pill--ok">в наличии</span>`
      : `<span class="pill pill--warn">предзаказ</span>`;

    const price = `<b class="price">${priceToCurrency(p.priceKZT)}</b>`;
    const old = p.oldPriceKZT ? `<span class="old">${priceToCurrency(p.oldPriceKZT)}</span>` : "";

    return `
      <article class="miniCard">
        <div class="miniCard__top">
          ${stock}
          <div class="miniCard__actions">
            <button class="chipbtn" type="button" data-wish="${escapeHTML(p.id)}" aria-label="В избранное">❤</button>
            <button class="chipbtn" type="button" data-compare="${escapeHTML(p.id)}" aria-label="Сравнить">≡</button>
          </div>
        </div>
        <div class="miniCard__body">
          <div class="miniCard__title">${escapeHTML(p.name)}</div>
          <div class="miniCard__meta">
            ${price} ${old}
          </div>
          <div class="miniCard__tags">
            ${(p.tags || []).slice(0, 3).map(t => `<span>${escapeHTML(t)}</span>`).join("")}
          </div>
        </div>
        <div class="miniCard__foot">
          ${p.requiresQuote
            ? `<button class="btn btn--ghost btn--full" type="button" data-quote="${escapeHTML(p.id)}">Запрос КП</button>`
            : `<button class="btn btn--accent btn--full" type="button" data-cart="${escapeHTML(p.id)}">В корзину</button>`
          }
        </div>
      </article>
    `;
  };

  // ----------------------------
  // Catalog page: filters/search/sort/render
  // ----------------------------
  const parseQuery = () => {
    const u = new URL(location.href);
    const q = u.searchParams.get("q") || "";
    const cat = u.searchParams.get("cat") || "";
    const brand = u.searchParams.get("brand") || "";
    const stock = u.searchParams.get("stock") || "";
    const sort = u.searchParams.get("sort") || "popular";
    const min = u.searchParams.get("min") ? Number(u.searchParams.get("min")) : null;
    const max = u.searchParams.get("max") ? Number(u.searchParams.get("max")) : null;

    // laptop filters
    const cpu = u.searchParams.get("cpu") || "";
    const gpu = u.searchParams.get("gpu") || "";
    const ram = u.searchParams.get("ram") || "";
    const ssd = u.searchParams.get("ssd") || "";
    const screen = u.searchParams.get("screen") || "";
    const hz = u.searchParams.get("hz") || "";

    return { q, cat, brand, stock, sort, min, max, cpu, gpu, ram, ssd, screen, hz };
  };

  const setQuery = (patch) => {
    const u = new URL(location.href);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "" || Number.isNaN(v)) u.searchParams.delete(k);
      else u.searchParams.set(k, String(v));
    });
    history.replaceState({}, "", u.toString());
  };

  const filterProducts = (params) => {
    const q = params.q.trim().toLowerCase();

    let list = PRODUCTS.slice();

    if (params.cat && params.cat !== "b2b") {
      list = list.filter((p) => p.cat === params.cat);
    }

    if (q) {
      list = list.filter((p) => {
        const hay = `${p.name} ${p.brand} ${(p.tags || []).join(" ")} `.toLowerCase();
        return hay.includes(q);
      });
    }

    if (params.brand) list = list.filter((p) => p.brand.toLowerCase() === params.brand.toLowerCase());
    if (params.stock) list = list.filter((p) => p.stock === params.stock);

    if (params.min != null) list = list.filter((p) => p.priceKZT >= params.min);
    if (params.max != null) list = list.filter((p) => p.priceKZT <= params.max);

    // laptop-specific
    const needsLaptopFilters = ["cpu", "gpu", "ram", "ssd", "screen", "hz"].some((k) => params[k]);
    if (needsLaptopFilters) {
      list = list.filter((p) => p.cat === "laptops");
      if (params.cpu) list = list.filter((p) => (p.specs?.cpu || "") === params.cpu);
      if (params.gpu) list = list.filter((p) => (p.specs?.gpu || "") === params.gpu);
      if (params.ram) list = list.filter((p) => (p.specs?.ram || "") === params.ram);
      if (params.ssd) list = list.filter((p) => (p.specs?.ssd || "") === params.ssd);
      if (params.screen) list = list.filter((p) => (p.specs?.screen || "") === params.screen);
      if (params.hz) list = list.filter((p) => (p.specs?.hz || "") === params.hz);
    }

    // sort
    switch (params.sort) {
      case "price_asc":
        list.sort((a, b) => a.priceKZT - b.priceKZT);
        break;
      case "price_desc":
        list.sort((a, b) => b.priceKZT - a.priceKZT);
        break;
      case "new":
        list.sort((a, b) => (a.id < b.id ? 1 : -1)); // демо
        break;
      default:
        // popular - демо
        list.sort((a, b) => (a.oldPriceKZT ? 1 : 0) - (b.oldPriceKZT ? 1 : 0)).reverse();
    }

    return list;
  };

  const renderCatalog = () => {
    const grid = $("#catalogGrid");
    const countEl = $("#catalogCount");
    const titleEl = $("#catalogTitle");
    if (!grid) return;

    const params = parseQuery();
    const list = filterProducts(params);

    if (titleEl) {
      titleEl.textContent = params.cat ? (CATS[params.cat] || "Каталог") : "Каталог";
    }
    if (countEl) countEl.textContent = `${list.length}`;

    grid.innerHTML = list.map((p) => productCardHTML(p)).join("");
    bindCardActions(grid);

    // sync UI controls
    syncCatalogControls(params, list);
  };

  const productCardHTML = (p) => {
    const stock = p.stock === "in_stock"
      ? `<span class="pill pill--ok">в наличии</span>`
      : `<span class="pill pill--warn">предзаказ</span>`;

    const preorderHint = p.stock === "preorder"
      ? `<div class="hint">Поставка до Алматы ~ <b>${escapeHTML(p.preorderDaysToAlmaty ?? 8)}</b> дней + доставка по городу/в регионы</div>`
      : "";

    const old = p.oldPriceKZT ? `<span class="old">${priceToCurrency(p.oldPriceKZT)}</span>` : "";

    const laptopLine = p.cat === "laptops"
      ? `<div class="specLine">
          <span>${escapeHTML(p.specs?.cpu || "-")}</span>
          <span>${escapeHTML(p.specs?.gpu || "-")}</span>
          <span>${escapeHTML(p.specs?.ram || "-")}</span>
          <span>${escapeHTML(p.specs?.ssd || "-")}</span>
          <span>${escapeHTML(p.specs?.screen || "-")}"</span>
          <span>${escapeHTML(p.specs?.hz || "-")}Hz</span>
        </div>`
      : `<div class="specLine">${(p.tags || []).slice(0, 4).map(t => `<span>${escapeHTML(t)}</span>`).join("")}</div>`;

    const actions = p.requiresQuote
      ? `<button class="btn btn--ghost btn--full" type="button" data-quote="${escapeHTML(p.id)}">Запрос КП</button>`
      : `<button class="btn btn--accent btn--full" type="button" data-cart="${escapeHTML(p.id)}">В корзину</button>`;

    return `
      <article class="pCard">
        <div class="pCard__top">
          ${stock}
          <div class="pCard__tools">
            <button class="chipbtn" type="button" data-wish="${escapeHTML(p.id)}" aria-label="В избранное">❤</button>
            <button class="chipbtn" type="button" data-compare="${escapeHTML(p.id)}" aria-label="Сравнить">≡</button>
          </div>
        </div>

        <div class="pCard__body">
          <div class="pCard__brand muted">${escapeHTML(p.brand)}</div>
          <div class="pCard__name">${escapeHTML(p.name)}</div>
          <div class="pCard__price">
            <b class="price">${priceToCurrency(p.priceKZT)}</b>
            ${old}
          </div>
          ${laptopLine}
          ${preorderHint}

          ${p.importantNotice
            ? `<div class="notice"><b>Важно:</b> ${escapeHTML(p.importantNotice)}</div>`
            : ""
          }
        </div>

        <div class="pCard__foot">
          <div class="pCard__row">
            ${actions}
          </div>
          <div class="pCard__row">
            <button class="btn btn--ghost btn--full" type="button" data-oneclick="${escapeHTML(p.id)}">Купить в 1 клик</button>
          </div>
        </div>
      </article>
    `;
  };

  const bindCardActions = (root) => {
    if (!root) return;

    $$("[data-cart]", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        addToCart(btn.dataset.cart, 1);
        openDrawer("cart");
      });
    });

    $$("[data-wish]", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        toggleWishlist(btn.dataset.wish);
      });
    });

    $$("[data-compare]", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        toggleCompare(btn.dataset.compare);
      });
    });

    $$("[data-oneclick]", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = findProduct(btn.dataset.oneclick);
        if (!p) return;
        alert(`Заявка «Купить в 1 клик» (демо)\n\nТовар: ${p.name}\nДальше подключим форму/отправку в WhatsApp/CRM.`);
      });
    });

    $$("[data-quote]", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = findProduct(btn.dataset.quote);
        if (!p) return;
        alert(`Запрос КП (демо)\n\nТовар: ${p.name}\nДальше сделаем форму КП + отправку админу.`);
      });
    });
  };

  const syncCatalogControls = (params, list) => {
    // Search input
    const qInput = $("#q");
    if (qInput && qInput.value !== params.q) qInput.value = params.q;

    // Category label (optional)
    const catLabel = $("#currentCat");
    if (catLabel) catLabel.textContent = params.cat ? (CATS[params.cat] || "Каталог") : "Каталог";

    // Sort
    const sortSel = $("#sort");
    if (sortSel && sortSel.value !== params.sort) sortSel.value = params.sort;

    // Price bounds UI (if present)
    const minEl = $("#priceMin");
    const maxEl = $("#priceMax");
    if (minEl && params.min != null) minEl.value = String(params.min);
    if (maxEl && params.max != null) maxEl.value = String(params.max);

    // Build dynamic brands list (if present)
    const brandWrap = $("#brandOptions");
    if (brandWrap && !brandWrap.dataset.built) {
      const brands = Array.from(new Set(PRODUCTS.map(p => p.brand))).sort();
      brandWrap.innerHTML = [
        `<label class="opt"><input type="radio" name="brand" value="" ${params.brand ? "" : "checked"}> <span>Все</span></label>`,
        ...brands.map(b =>
          `<label class="opt"><input type="radio" name="brand" value="${escapeHTML(b)}" ${params.brand === b ? "checked" : ""}> <span>${escapeHTML(b)}</span></label>`
        ),
      ].join("");
      brandWrap.dataset.built = "1";

      $$('input[name="brand"]', brandWrap).forEach((r) => {
        r.addEventListener("change", () => {
          setQuery({ brand: r.value || "" });
          renderCatalog();
        });
      });
    } else if (brandWrap) {
      // keep current selection
      const cur = params.brand || "";
      $$('input[name="brand"]', brandWrap).forEach((r) => {
        r.checked = (r.value === cur);
      });
    }

    // Stock filter
    const stockSel = $("#stock");
    if (stockSel) {
      stockSel.value = params.stock || "";
    }

    // Laptop filters (if present)
    const laptopBox = $("#laptopFilters");
    if (laptopBox) {
      // enable only when cat=laptops or when laptop params are used
      const active = (params.cat === "laptops") || ["cpu","gpu","ram","ssd","screen","hz"].some(k => params[k]);
      laptopBox.classList.toggle("is-disabled", !active);

      const map = [
        ["cpu", "#f_cpu"],
        ["gpu", "#f_gpu"],
        ["ram", "#f_ram"],
        ["ssd", "#f_ssd"],
        ["screen", "#f_screen"],
        ["hz", "#f_hz"],
      ];
      map.forEach(([key, sel]) => {
        const el = $(sel);
        if (!el) return;
        if (el.value !== (params[key] || "")) el.value = params[key] || "";
      });
    }

    // empty state
    const empty = $("#catalogEmpty");
    if (empty) empty.style.display = list.length ? "none" : "block";
  };

  const initCatalogControls = () => {
    // If catalog page elements exist
    const grid = $("#catalogGrid");
    if (!grid) return;

    const searchForm = $("#catalogSearch");
    const sortSel = $("#sort");
    const stockSel = $("#stock");
    const applyPrice = $("#applyPrice");
    const resetBtn = $("#resetFilters");

    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = $("#q")?.value ?? "";
        setQuery({ q });
        renderCatalog();
      });
    }

    if (sortSel) {
      sortSel.addEventListener("change", () => {
        setQuery({ sort: sortSel.value });
        renderCatalog();
      });
    }

    if (stockSel) {
      stockSel.addEventListener("change", () => {
        setQuery({ stock: stockSel.value });
        renderCatalog();
      });
    }

    if (applyPrice) {
      applyPrice.addEventListener("click", () => {
        const min = Number($("#priceMin")?.value || "");
        const max = Number($("#priceMax")?.value || "");
        setQuery({
          min: Number.isFinite(min) ? min : null,
          max: Number.isFinite(max) ? max : null,
        });
        renderCatalog();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        // keep cat
        const { cat } = parseQuery();
        const u = new URL(location.href);
        u.search = "";
        if (cat) u.searchParams.set("cat", cat);
        history.replaceState({}, "", u.toString());
        renderCatalog();
      });
    }

    // Laptop filters change
    const laptopMap = [
      ["#f_cpu", "cpu"],
      ["#f_gpu", "gpu"],
      ["#f_ram", "ram"],
      ["#f_ssd", "ssd"],
      ["#f_screen", "screen"],
      ["#f_hz", "hz"],
    ];
    laptopMap.forEach(([sel, key]) => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener("change", () => {
        setQuery({ [key]: el.value || "" });
        // If using laptop filters — force cat=laptops for consistency
        const params = parseQuery();
        const any = ["cpu","gpu","ram","ssd","screen","hz"].some(k => (k === key ? el.value : params[k]));
        if (any) setQuery({ cat: "laptops" });
        renderCatalog();
      });
    });

    // initial render
    renderCatalog();
  };

  // ----------------------------
  // Render drawers
  // ----------------------------
  const renderCartDrawer = () => {
    const body = $("#cartBody");
    const totalEl = $("#cartTotal");
    if (!body || !totalEl) return;

    const cart = getCart();
    const items = Object.entries(cart)
      .map(([id, qty]) => {
        const p = findProduct(id);
        if (!p) return null;
        return { p, qty };
      })
      .filter(Boolean);

    if (!items.length) {
      body.innerHTML = `<div class="empty">Корзина пуста.</div>`;
      totalEl.textContent = priceToCurrency(0);
      return;
    }

    let sum = 0;
    body.innerHTML = items.map(({ p, qty }) => {
      sum += p.priceKZT * qty;

      const stockLine = p.stock === "preorder"
        ? `Предзаказ: поставка до Алматы ~ ${p.preorderDaysToAlmaty ?? 8} дней`
        : `В наличии`;

      return `
        <div class="lineItem">
          <div class="lineItem__main">
            <div class="lineItem__name">${escapeHTML(p.name)}</div>
            <div class="lineItem__meta muted">${escapeHTML(stockLine)}</div>
            <div class="lineItem__meta"><b>${priceToCurrency(p.priceKZT)}</b> <span class="muted">/ шт</span></div>
          </div>

          <div class="lineItem__side">
            <div class="qty">
              <button type="button" class="qty__btn" data-qtydec="${escapeHTML(p.id)}">−</button>
              <input class="qty__input" type="number" min="1" max="99" value="${qty}" data-qty="${escapeHTML(p.id)}" />
              <button type="button" class="qty__btn" data-qtyinc="${escapeHTML(p.id)}">+</button>
            </div>
            <button type="button" class="link danger" data-remove="${escapeHTML(p.id)}">Удалить</button>
          </div>
        </div>
      `;
    }).join("");

    totalEl.textContent = priceToCurrency(sum);

    // bind qty actions
    $$("[data-qtydec]", body).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.qtydec;
        const cart = getCart();
        setCartQty(id, (cart[id] ?? 1) - 1);
      });
    });
    $$("[data-qtyinc]", body).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.qtyinc;
        const cart = getCart();
        setCartQty(id, (cart[id] ?? 1) + 1);
      });
    });
    $$("[data-qty]", body).forEach((inp) => {
      inp.addEventListener("change", () => {
        const id = inp.dataset.qty;
        const val = Number(inp.value);
        setCartQty(id, Number.isFinite(val) ? val : 1);
      });
    });
    $$("[data-remove]", body).forEach((btn) => {
      btn.addEventListener("click", () => setCartQty(btn.dataset.remove, 0));
    });
  };

  const renderWishlistDrawer = () => {
    const body = $("#wishlistBody");
    if (!body) return;

    const list = getWishlist().map(findProduct).filter(Boolean);
    if (!list.length) {
      body.innerHTML = `<div class="empty">В избранном пока пусто.</div>`;
      return;
    }

    body.innerHTML = list.map((p) => `
      <div class="lineItem">
        <div class="lineItem__main">
          <div class="lineItem__name">${escapeHTML(p.name)}</div>
          <div class="lineItem__meta muted">${escapeHTML(p.brand)} • ${p.stock === "in_stock" ? "в наличии" : "предзаказ"}</div>
          <div class="lineItem__meta"><b>${priceToCurrency(p.priceKZT)}</b></div>
        </div>
        <div class="lineItem__side">
          ${p.requiresQuote
            ? `<button class="btn btn--ghost" type="button" data-quote="${escapeHTML(p.id)}">Запрос КП</button>`
            : `<button class="btn btn--accent" type="button" data-cart="${escapeHTML(p.id)}">В корзину</button>`
          }
          <button type="button" class="link danger" data-wish="${escapeHTML(p.id)}">Убрать</button>
        </div>
      </div>
    `).join("");

    bindCardActions(body);
  };

  const renderCompareDrawer = () => {
    const body = $("#compareBody");
    if (!body) return;

    const ids = getCompare();
    const list = ids.map(findProduct).filter(Boolean);

    if (!list.length) {
      body.innerHTML = `<div class="empty">Добавьте товары для сравнения.</div>`;
      return;
    }

    // Collect keys for comparison
    const keys = new Set();
    list.forEach((p) => {
      Object.keys(p.specs || {}).forEach((k) => keys.add(k));
      // show basic keys for non-laptops
      if (!Object.keys(p.specs || {}).length) keys.add("type");
    });

    const rows = Array.from(keys).sort();

    const header = `
      <div class="cmpHeader">
        ${list.map((p) => `
          <div class="cmpCol">
            <div class="cmpName">${escapeHTML(p.name)}</div>
            <div class="cmpMeta muted">${escapeHTML(p.brand)} • ${p.stock === "in_stock" ? "в наличии" : "предзаказ"}</div>
            <div class="cmpPrice"><b>${priceToCurrency(p.priceKZT)}</b></div>
            <div class="cmpBtns">
              <button class="chipbtn" type="button" data-compare="${escapeHTML(p.id)}" title="Убрать">✕</button>
              ${p.requiresQuote
                ? `<button class="btn btn--ghost" type="button" data-quote="${escapeHTML(p.id)}">Запрос КП</button>`
                : `<button class="btn btn--accent" type="button" data-cart="${escapeHTML(p.id)}">В корзину</button>`
              }
            </div>
          </div>
        `).join("")}
      </div>
    `;

    const table = `
      <div class="cmpTable">
        ${rows.map((k) => {
          const vals = list.map((p) => String((p.specs && p.specs[k]) ?? "—"));
          const allSame = vals.every((v) => v === vals[0]);
          return `
            <div class="cmpRow ${allSame ? "" : "diff"}">
              <div class="cmpKey">${escapeHTML(k)}</div>
              ${vals.map((v) => `<div class="cmpVal">${escapeHTML(v)}</div>`).join("")}
            </div>
          `;
        }).join("")}
      </div>
    `;

    body.innerHTML = header + table;
    bindCardActions(body);
  };

  // ----------------------------
  // Rerender all prices on currency change
  // ----------------------------
  const rerenderAll = () => {
    renderHomeFeatured();
    renderCartDrawer();
    renderWishlistDrawer();
    renderCompareDrawer();
    renderCatalog();
  };

  // ----------------------------
  // Global init
  // ----------------------------
  const initYear = () => {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  };

  // Public init
  const init = () => {
    initYear();
    refreshLangUI();
    refreshCurrencyUI();
    initSelectMenus();
    initDrawers();
    updateBadges();

    // initial renders depending on page
    renderHomeFeatured();
    renderCartDrawer();
    renderWishlistDrawer();
    renderCompareDrawer();
    initCatalogControls();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 

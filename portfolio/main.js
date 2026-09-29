"use strict";

const USER = "rodoac89";
const FEATURED_TOPIC = "destacado";
const NONE = "__none__";

const LANG_COLORS = {
  Python: "#3572A5",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  "C#": "#178600",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Java: "#b07219",
  PHP: "#4F5D95",
  C: "#555555",
  "C++": "#f34b7d",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Vue: "#41b883",
  PowerShell: "#012456",
  Dockerfile: "#384d54",
  "Jupyter Notebook": "#DA5B0B",
  R: "#198CE7",
  SCSS: "#c6538c",
  Lua: "#000080",
};

const state = {
  user: null,
  repos: [],
  query: "",
  language: "all",
  sort: "updated",
  showForks: false,
};

const els = {};
let loading = false;

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bind();
  readUrlState();
  els.theme.textContent = themeLabel();
  els.year.textContent = String(new Date().getFullYear());
  load();
});

function cacheElements() {
  [
    "theme",
    "bio",
    "meta",
    "year",
    "featured-section",
    "featured",
    "list-heading",
    "status",
    "langbar",
    "legend",
    "list",
    "reload",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
  els.statOwn = document.getElementById("stat-own");
  els.statForks = document.getElementById("stat-forks");
  els.statFollowers = document.getElementById("stat-followers");
  els.linkGithub = document.getElementById("link-github");
  els.linkSite = document.getElementById("link-site");
  els.linkX = document.getElementById("link-x");
  els.q = document.getElementById("q");
  els.sort = document.getElementById("sort");
  els.forks = document.getElementById("forks");
  els.featuredSection = els["featured-section"];
  els.listHeading = els["list-heading"];
}

function bind() {
  els.q.addEventListener("input", () => {
    state.query = els.q.value;
    render();
  });
  els.sort.addEventListener("change", () => {
    state.sort = els.sort.value;
    render();
  });
  els.forks.addEventListener("change", () => {
    state.showForks = els.forks.checked;
    render();
  });
  els.reload.addEventListener("click", () => load());
  els.theme.addEventListener("click", cycleTheme);
  els.legend.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lang]");
    if (!button) return;
    state.language = state.language === button.dataset.lang ? "all" : button.dataset.lang;
    render();
  });
}

function themeLabel() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "dark") return "Tema: oscuro";
  if (explicit === "light") return "Tema: claro";
  return "Tema: auto";
}

function cycleTheme() {
  const current = document.documentElement.dataset.theme || "system";
  const next = current === "system" ? "dark" : current === "dark" ? "light" : "system";
  try {
    if (next === "system") {
      delete document.documentElement.dataset.theme;
      localStorage.removeItem("portfolio-theme");
    } else {
      document.documentElement.dataset.theme = next;
      localStorage.setItem("portfolio-theme", next);
    }
  } catch (error) {
    document.documentElement.dataset.theme = next === "system" ? "" : next;
  }
  els.theme.textContent = themeLabel();
  writeUrlState();
}

function readUrlState() {
  const params = new URLSearchParams(location.search);
  const query = params.get("q");
  if (query) {
    state.query = query;
    els.q.value = query;
  }
  const language = params.get("lang");
  if (language) state.language = language === "none" ? NONE : language;
  if (params.get("forks") === "1") {
    state.showForks = true;
    els.forks.checked = true;
  }
  const order = params.get("orden");
  if (order === "estrellas") state.sort = "stars";
  if (order === "nombre") state.sort = "name";
  if (order === "actualizados") state.sort = "updated";
  els.sort.value = state.sort;
  const theme = params.get("tema");
  if (theme === "oscuro") document.documentElement.dataset.theme = "dark";
  if (theme === "claro") document.documentElement.dataset.theme = "light";
}

function writeUrlState() {
  const params = new URLSearchParams();
  const query = state.query.trim();
  if (query) params.set("q", query);
  if (state.language === NONE) params.set("lang", "none");
  else if (state.language !== "all") params.set("lang", state.language);
  if (state.showForks) params.set("forks", "1");
  if (state.sort === "stars") params.set("orden", "estrellas");
  if (state.sort === "name") params.set("orden", "nombre");
  if (document.documentElement.dataset.theme === "dark") params.set("tema", "oscuro");
  if (document.documentElement.dataset.theme === "light") params.set("tema", "claro");
  const search = params.toString();
  const next = search ? "?" + search : location.pathname;
  try {
    history.replaceState(null, "", next);
  } catch (error) {
    /* file:// y algunos entornos bloquean el historial */
  }
}

async function load() {
  if (loading) return;
  loading = true;
  const hadData = state.repos.length > 0;
  els.status.textContent = hadData ? "Actualizando…" : "Cargando repositorios…";
  els.list.setAttribute("aria-busy", "true");
  setControls();
  try {
    const data = await fetchAll();
    state.user = data.user;
    state.repos = data.repos;
    renderProfile();
    renderLanguages();
    render();
  } catch (error) {
    if (!hadData) showError(error);
    else els.status.textContent = "No se pudo actualizar. Se mantiene la lista anterior.";
  } finally {
    loading = false;
    els.list.setAttribute("aria-busy", "false");
    setControls();
  }
}

function setControls() {
  const ready = state.repos.length > 0;
  els.q.disabled = !ready;
  els.sort.disabled = !ready;
  els.forks.disabled = !ready;
  els.reload.disabled = loading;
}

async function fetchAll() {
  const [userResult, reposResult] = await Promise.allSettled([
    fetchJson("https://api.github.com/users/" + encodeURIComponent(USER)).then(slimUser),
    fetchRepos(),
  ]);
  if (reposResult.status === "rejected") throw reposResult.reason;
  return {
    at: Date.now(),
    user: userResult.status === "fulfilled" ? userResult.value : null,
    repos: reposResult.value,
  };
}

async function fetchRepos() {
  const repos = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await fetchJson(
      "https://api.github.com/users/" +
        encodeURIComponent(USER) +
        "/repos?per_page=100&page=" +
        page +
        "&sort=updated"
    );
    if (!Array.isArray(batch)) {
      const error = new Error("http");
      error.code = "http";
      throw error;
    }
    repos.push(...batch.map(slimRepo));
    if (batch.length < 100) break;
  }
  return repos;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (response.status === 403 || response.status === 429) {
    const error = new Error("rate");
    error.code = "rate";
    throw error;
  }
  if (!response.ok) {
    const error = new Error("http");
    error.code = "http";
    throw error;
  }
  return response.json();
}

function slimUser(user) {
  return {
    bio: user.bio,
    location: user.location,
    blog: user.blog,
    twitter_username: user.twitter_username,
    html_url: user.html_url,
    followers: user.followers,
    created_at: user.created_at,
  };
}

function slimRepo(repo) {
  return {
    name: repo.name,
    html_url: repo.html_url,
    description: repo.description,
    fork: Boolean(repo.fork),
    archived: Boolean(repo.archived),
    language: repo.language,
    stargazers_count: repo.stargazers_count || 0,
    pushed_at: repo.pushed_at,
    homepage: repo.homepage,
    topics: Array.isArray(repo.topics) ? repo.topics : [],
  };
}

function renderProfile() {
  const own = state.repos.filter((repo) => !repo.fork).length;
  els.statOwn.textContent = String(own);
  els.statForks.textContent = String(state.repos.length - own);
  const user = state.user;
  if (!user) return;
  if ((user.bio || "").trim()) els.bio.textContent = user.bio.trim();
  const year = user.created_at ? new Date(user.created_at).getUTCFullYear() : "";
  const place = (user.location || "Chile").trim();
  els.meta.textContent = year ? place + " · En GitHub desde " + year : place;
  if (typeof user.followers === "number") els.statFollowers.textContent = String(user.followers);
  setLink(els.linkGithub, user.html_url);
  const blog = safeUrl(user.blog);
  if (blog) setLink(els.linkSite, blog);
  else els.linkSite.hidden = true;
  if (user.twitter_username) {
    setLink(els.linkX, "https://x.com/" + encodeURIComponent(user.twitter_username));
  } else {
    els.linkX.hidden = true;
  }
}

function setLink(anchor, href) {
  const safe = safeUrl(href);
  if (safe) anchor.href = safe;
}

function renderLanguages() {
  const items = languageBreakdown();
  if (state.language !== "all" && !items.some((item) => item.name === state.language)) {
    state.language = "all";
  }
  const signature = items.map((item) => item.name + ":" + item.count).join("|");
  if (signature !== els.legend.dataset.signature) {
    els.legend.dataset.signature = signature;
    const segments = [];
    const buttons = [];
    items.forEach((item) => {
      const segment = document.createElement("span");
      segment.style.flexGrow = String(item.count);
      segment.style.background = langColor(item.name);
      segment.title = langName(item.name) + ": " + item.count;
      segments.push(segment);

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.lang = item.name;
      const countLabel = item.count === 1 ? "1 repositorio" : item.count + " repositorios";
      button.setAttribute("aria-label", "Filtrar por " + langName(item.name) + ", " + countLabel);
      const count = document.createElement("b");
      count.textContent = String(item.count);
      button.append(dot(langColor(item.name)), document.createTextNode(langName(item.name) + " "), count);
      buttons.push(button);
    });
    els.langbar.replaceChildren(...segments);
    els.legend.replaceChildren(...buttons);
  }
  updateLegendPressed();
}

function updateLegendPressed() {
  els.legend.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.lang === state.language ? "true" : "false");
  });
}

function languageBreakdown() {
  const counts = new Map();
  state.repos.forEach((repo) => {
    if (repo.fork) return;
    const key = repo.language || NONE;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || langName(a.name).localeCompare(langName(b.name), "es"));
}

function render() {
  const filtering = Boolean(state.query.trim()) || state.language !== "all";
  const featured = sortRepos(state.repos.filter(isFeatured));
  els.featuredSection.hidden = filtering;
  if (!filtering) {
    els.featured.className = featured.length ? "repo-list" : "";
    els.featured.replaceChildren(
      ...(featured.length ? featured.map(renderRepo) : [renderFeaturedEmpty()])
    );
  }
  const list = sortRepos(
    state.repos.filter((repo) => matches(repo) && (filtering || !isFeatured(repo)))
  );
  els.listHeading.textContent = filtering ? "Resultados" : "Repositorios";
  els.status.textContent = statusText(list);
  updateLegendPressed();
  if (!list.length) {
    els.list.className = "";
    els.list.replaceChildren(renderEmpty());
  } else {
    els.list.className = "repo-list";
    els.list.replaceChildren(...list.map(renderRepo));
  }
  writeUrlState();
}

function statusText(list) {
  const count = list.length;
  if (state.query.trim() || state.language !== "all") {
    return count === 1 ? "1 resultado" : count + " resultados";
  }
  if (state.showForks) return count + " repositorios públicos";
  return count === 1 ? "1 repositorio propio" : count + " repositorios propios";
}

function isFeatured(repo) {
  return repo.topics.some((topic) => topic.toLowerCase() === FEATURED_TOPIC);
}

function matches(repo) {
  if (!state.showForks && repo.fork) return false;
  return matchesQueryAndLang(repo);
}

function matchesQueryAndLang(repo) {
  if (state.language === NONE) {
    if (repo.language) return false;
  } else if (state.language !== "all" && repo.language !== state.language) {
    return false;
  }
  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  const blob = [repo.name, repo.description || "", repo.language || "", ...repo.topics].join("\n").toLowerCase();
  return blob.includes(query);
}

function sortRepos(list) {
  const sorted = list.slice();
  if (state.sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
  } else if (state.sort === "stars") {
    sorted.sort((a, b) => b.stargazers_count - a.stargazers_count || timeOf(b) - timeOf(a));
  } else {
    sorted.sort((a, b) => timeOf(b) - timeOf(a) || a.name.localeCompare(b.name, "es"));
  }
  return sorted;
}

function renderRepo(repo) {
  const article = document.createElement("article");
  article.className = "repo";

  const head = document.createElement("div");
  head.className = "repo-head";
  const heading = document.createElement("h3");
  const ownerHref = state.user && safeUrl(state.user.html_url);
  const slash = document.createElement("span");
  slash.className = "repo-slash";
  slash.textContent = "/";
  const owner = externalLink(ownerHref || "https://github.com/" + USER, USER);
  const name = externalLink(repo.html_url, repo.name);
  owner.classList.add("repo-owner");
  name.classList.add("repo-name");
  heading.append(owner, slash, name);
  if (repo.fork) heading.append(badge("Fork", false));
  if (repo.archived) heading.append(badge("Archivado", true));
  head.append(heading, starButton(repo));
  article.append(head);

  const description = (repo.description || "").trim();
  if (description) {
    const paragraph = document.createElement("p");
    paragraph.className = "repo-desc";
    paragraph.textContent = description;
    article.append(paragraph);
  }

  if (repo.topics.length) {
    const topics = document.createElement("ul");
    topics.className = "topics";
    orderedTopics(repo.topics).forEach((topic) => {
      const item = document.createElement("li");
      const link = externalLink("https://github.com/topics/" + encodeURIComponent(topic), topic);
      link.title = "Tema: " + topic;
      if (topic.toLowerCase() === FEATURED_TOPIC) link.classList.add("is-mark");
      item.append(link);
      topics.append(item);
    });
    article.append(topics);
  }

  article.append(renderRepoMeta(repo));
  return article;
}

function orderedTopics(topics) {
  return topics.slice().sort((a, b) => {
    const rank = (topic) => (topic.toLowerCase() === FEATURED_TOPIC ? 0 : 1);
    return rank(a) - rank(b) || a.localeCompare(b, "es");
  });
}

function starButton(repo) {
  const stars = externalLink(repo.html_url, "★ " + repo.stargazers_count);
  stars.className = "star-btn";
  stars.setAttribute(
    "aria-label",
    repo.stargazers_count === 1 ? "1 estrella" : repo.stargazers_count + " estrellas"
  );
  return stars;
}

function renderRepoMeta(repo) {
  const meta = document.createElement("p");
  meta.className = "repo-meta";

  const updated = document.createElement("span");
  updated.append(document.createTextNode("Actualizado "));
  const when = document.createElement("time");
  if (repo.pushed_at) when.dateTime = repo.pushed_at;
  const full = formatFull(repo.pushed_at);
  when.textContent = full || "sin fecha";
  const relative = formatUpdated(repo.pushed_at);
  if (relative) when.title = relative;
  updated.append(when);
  meta.append(updated);

  const language = document.createElement("span");
  language.className = "lang";
  language.append(dot(langColor(repo.language)), document.createTextNode(repo.language || "Sin lenguaje"));
  meta.append(language);

  const homepage = safeUrl(repo.homepage);
  if (homepage) meta.append(externalLink(homepage, "Demo"));
  return meta;
}

function renderFeaturedEmpty() {
  const wrap = document.createElement("div");
  wrap.className = "empty";
  const message = document.createElement("p");
  message.append(
    document.createTextNode("Ninguno todavía. En GitHub abre el repositorio, pulsa el engranaje de About y agrega el tema "),
    codeLabel(FEATURED_TOPIC),
    document.createTextNode(". Luego pulsa Actualizar y el repo entra solo en esta lista.")
  );
  const help = document.createElement("p");
  help.append(
    externalLink(
      "https://docs.github.com/es/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics",
      "Cómo clasificar un repositorio con temas"
    )
  );
  wrap.append(message, help);
  return wrap;
}

function codeLabel(text) {
  const code = document.createElement("code");
  code.textContent = text;
  return code;
}

function renderEmpty() {
  const wrap = document.createElement("div");
  wrap.className = "empty";
  const message = document.createElement("p");
  message.textContent = "Ningún repositorio coincide con ese filtro.";
  wrap.append(message);
  if (!state.showForks) {
    const hidden = state.repos.filter((repo) => repo.fork && matchesQueryAndLang(repo)).length;
    if (hidden > 0) {
      const hint = document.createElement("p");
      hint.textContent =
        hidden === 1
          ? "Hay 1 fork que coincide. Activa «Mostrar forks»."
          : "Hay " + hidden + " forks que coinciden. Activa «Mostrar forks».";
      wrap.append(hint);
    }
  }
  return wrap;
}

function showError(error) {
  els.featuredSection.hidden = true;
  els.list.className = "";
  els.list.replaceChildren();
  const message = document.createElement("p");
  message.className = "empty";
  message.textContent =
    error && error.code === "rate"
      ? "GitHub limitó las consultas anónimas desde esta red. Espera un momento y pulsa Actualizar."
      : "No se pudieron cargar los repositorios. Revisa tu conexión y pulsa Actualizar.";
  els.list.append(message);
  els.status.textContent = "Sin datos";
}

function badge(text, warn) {
  const span = document.createElement("span");
  span.className = warn ? "badge is-warn" : "badge";
  span.textContent = text;
  return span;
}

function dot(color) {
  const mark = document.createElement("i");
  mark.className = "dot";
  mark.style.background = color;
  mark.setAttribute("aria-hidden", "true");
  return mark;
}

function externalLink(href, text) {
  const safe = safeUrl(href);
  if (!safe) {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
  }
  const anchor = document.createElement("a");
  anchor.href = safe;
  anchor.textContent = text;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  return anchor;
}

function safeUrl(value) {
  if (!value || typeof value !== "string") return "";
  let raw = value.trim();
  if (!raw) return "";
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = "https://" + raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch (error) {
    return "";
  }
  return "";
}

function langColor(language) {
  if (!language || language === NONE) return "#b7ad9e";
  return LANG_COLORS[language] || "#b7ad9e";
}

function langName(language) {
  return !language || language === NONE ? "Sin lenguaje" : language;
}

function timeOf(repo) {
  const time = Date.parse(repo.pushed_at || "");
  return Number.isNaN(time) ? 0 : time;
}

function formatUpdated(iso) {
  const then = new Date(iso || "");
  if (Number.isNaN(then.getTime())) return "sin fecha";
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return "hace " + days + " días";
  if (days < 365) {
    const months = Math.max(1, Math.floor(days / 30));
    return months === 1 ? "hace 1 mes" : "hace " + months + " meses";
  }
  const years = Math.floor(days / 365);
  return years === 1 ? "hace 1 año" : "hace " + years + " años";
}

function formatFull(iso) {
  const then = new Date(iso || "");
  if (Number.isNaN(then.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(then);
}

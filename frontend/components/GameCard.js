// frontend/components/GameCard.js
// Renders a single game card for grids (guest/user/admin).

const FALLBACK_IMG = "../../assets/images/VGB_Logo.png";
const PLATFORM_ALIASES = [
  [/^PC\b/i, "PC"],
  [/Microsoft Windows/i, "PC"],
  [/PlayStation\s*5/i, "PS5"],
  [/PlayStation\s*4/i, "PS4"],
  [/PlayStation\s*3/i, "PS3"],
  [/PlayStation\s*2/i, "PS2"],
  [/Xbox Series X\|S/i, "Xbox X|S"],
  [/Xbox One/i, "Xbox One"],
  [/Xbox 360/i, "Xbox 360"],
  [/Nintendo Switch\s*2/i, "Switch 2"],
  [/Nintendo Switch/i, "Switch"],
  [/mac\s*OS|macOS|OS X/i, "macOS"],
  [/Linux/i, "Linux"],
  [/Android/i, "Android"],
  [/iOS/i, "iOS"],
];

function compactLabel(raw, kind = "platform") {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  // e.g., "PC (Microsoft Windows)" -> "PC"
  const beforeParen = s.includes("(") ? s.split("(")[0].trim() : s;
  if (kind === "platform") {
    for (const [rx, out] of PLATFORM_ALIASES) {
      if (rx.test(s)) return out;
      if (rx.test(beforeParen)) return out;
    }
    return beforeParen;
  }
  // genre: just trim and remove trailing parenthetical noise
  return beforeParen;
}


function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v === null || v === undefined) return [];
  // tolerate comma-separated strings from some seeds
  if (typeof v === "string" && v.includes(",")) {
    return v.split(",").map(s => s.trim()).filter(Boolean);
  }
  return v ? [v] : [];
}

function renderTagRow(items, max = 3, kind = "platform") {
  const listRaw = (items || []).filter(Boolean);
  if (!listRaw.length) {
    return `
      <div class="tag-row">
        <span class="tag tag-empty" title="None">—</span>
      </div>
    `;
  }

  // compact labels to avoid wrapping (keeps full label in title)
  const list = listRaw.map(x => ({
    raw: String(x),
    short: compactLabel(x, kind),
  })).filter(x => x.short);

  const shown = list.slice(0, max);
  const extra = Math.max(0, list.length - shown.length);

  return `
    <div class="tag-row">
      ${shown.map((x) => `<span class="tag" title="${esc(x.raw)}">${esc(x.short)}</span>`).join("")}
      ${extra ? `<span class="tag tag-more" title="${extra} more">+${extra}</span>` : ""}
    </div>
  `;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function imgUrl(u) {
  if (!u) return "";
  // allow absolute URLs or local paths
  return String(u);
}

/**
 * @param {object} game
 * @param {{
 *   mode?: "guest"|"user"|"admin",
 *   isFavorited?: boolean,
 *   canFavorite?: boolean,
 *   onToggleFavorite?: (game)=>void,
 *   onOpenDetails?: (game)=>void,
 *   onEdit?: (game)=>void,
 *   onDelete?: (game)=>void,
 * }} opts
 */
export function renderGameCard(game, opts = {}) {
  const {
    mode = "guest",
    isFavorited = false,
    canFavorite = false,
    onToggleFavorite,
    onOpenDetails,
    onEdit,
    onDelete
  } = opts;

  const g = game || {};
  const u = imgUrl(g.imageURL) || FALLBACK_IMG;
  const rating = (g.averageRating || 0).toFixed(1);
  const total = g.totalRatings || 0;

  const platformArr = asArray(g.platform);
  const genreArr = asArray(g.genre);
  const platformHtml = renderTagRow(platformArr, 3, "platform");
  const genreHtml = renderTagRow(genreArr, 3, "genre");

  const card = document.createElement("article");
  card.className = `card card-${mode}`;

  card.innerHTML = `
    <div class="thumb">
      <span class="badge">${esc(g.status || "—")}</span>
      <img src="${esc(u)}" alt="${esc(g.title || "Game")}">
    </div>
    <div class="card-body">
      <div class="card-title">${esc(g.title || "Untitled")}</div>
      <div class="info">
        <div class="info-row">
          <div class="info-label">Platform</div>
          <div class="info-value">${platformHtml}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Genre</div>
          <div class="info-value">${genreHtml}</div>
        </div>
      </div>
      <div class="meta">
        <span class="meta-left">Release: ${fmtDate(g.releaseDate)}</span>
        <span class="meta-right">${rating}★ (${total})</span>
      </div>
    </div>
    <div class="card-foot"></div>
  `;

  const foot = card.querySelector(".card-foot");

  // Details
  const detailsBtn = document.createElement("button");
  detailsBtn.type = "button";
  detailsBtn.className = "btn ghost";
  detailsBtn.textContent = "Details";
  detailsBtn.addEventListener("click", () => onOpenDetails?.(g));
  foot.appendChild(detailsBtn);

  // Favorite (users only)
  if (mode !== "admin") {
    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "btn ghost";
    favBtn.disabled = !canFavorite;
    favBtn.textContent = isFavorited ? "★ Favorited" : "☆ Favorite";
    favBtn.title = canFavorite ? "Toggle favorite" : "Login to favorite";
    favBtn.addEventListener("click", () => onToggleFavorite?.(g));
    foot.appendChild(favBtn);
  }

  // Admin actions
  if (mode === "admin") {
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn ghost";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => onEdit?.(g));
    foot.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn ghost";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => onDelete?.(g));
    foot.appendChild(delBtn);
  }

  return card;
}

function normalizeGameId(g) {
  return g?._id || g?.id || g?.gameId || (g?.game && (g.game._id || g.game.id)) || null;
}

/**
 * Convenience helper used by main.js: renders a whole grid and wires all actions.
 *
 * @param {{
 *   container: HTMLElement,
 *   games: any[],
 *   favoriteSet?: Set<string>,
 *   mode?: "guest"|"user"|"admin",
 *   onDetails?: (g:any)=>void,
 *   onFavoriteToggle?: (g:any)=>void,
 *   onEdit?: (g:any)=>void,
 *   onDelete?: (g:any)=>void,
 * }} args
 */
export function renderGameGrid({
  container,
  games = [],
  favoriteSet = new Set(),
  mode = "guest",
  onDetails,
  onFavoriteToggle,
  onEdit,
  onDelete,
} = {}) {
  if (!container) return;
  container.innerHTML = "";

  const canFavorite = mode === "user" && typeof onFavoriteToggle === "function";

  for (const g of games || []) {
    const id = String(normalizeGameId(g) ?? "");
    const isFavorited = !!(id && favoriteSet && favoriteSet.has(id));

    const card = renderGameCard(g, {
      mode,
      isFavorited,
      canFavorite,
      onOpenDetails: onDetails,
      onToggleFavorite: onFavoriteToggle,
      onEdit,
      onDelete,
    });

    container.appendChild(card);
  }
}

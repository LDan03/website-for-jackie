import { useState, useMemo, useRef, useEffect } from "react";

/* ---------- date helpers ---------- */
const DAY = 86400000;
const today = new Date(new Date().setHours(0, 0, 0, 0));
const off = (n) => new Date(today.getTime() + n * DAY);
const iso = (d) => d.toISOString().slice(0, 10);
const fmtLong = (s) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
const nightsBetween = (a, b) =>
  Math.round((new Date(b) - new Date(a)) / DAY);
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

/* ---------- test data : three Orkney buildings ---------- */
const BUILDINGS = {
  "kirkwall-bay-house": {
    id: "kirkwall-bay-house",
    name: "Kirkwall Bay House",
    town: "Kirkwall",
    region: "Orkney",
    tagline: "A sandstone townhouse two streets up from the harbour",
    coords: { lat: 58.984, lng: -2.96 },
    description: [
      "Kirkwall Bay House is a converted 1890s merchant's townhouse on the rise above the harbour, a five minute walk from St Magnus Cathedral and the ferry terminal. The building keeps its original flagstone hall and thick stone walls, so it stays quiet even in a gale.",
      "Guests share a large ground-floor kitchen and a lounge with a view over the bay. Rooms are let individually, which makes the house a good fit for solo travellers, contractors on longer stays, and small groups who want their own doors but a shared table.",
      "Check-in is self-service with a keypad code sent on the morning of arrival. The owner lives locally and can usually be on site within twenty minutes if anything needs sorting.",
    ],
    traits: [
      ["ti-door", "7 rooms let individually"],
      ["ti-tools-kitchen-2", "Shared kitchen and dining room"],
      ["ti-wash-machine", "On-site laundry, free to use"],
      ["ti-wifi", "Fibre wifi throughout"],
      ["ti-flame", "Central heating in every room"],
      ["ti-anchor", "5 min walk to ferry terminal"],
      ["ti-parking", "Free on-street parking"],
      ["ti-paw", "Ground-floor rooms are pet friendly"],
    ],
    photos: [
      { scene: "exterior", room: "The building", caption: "Street front on Bay Lane, main entrance under the gable" },
      { scene: "bedroom", room: "Room 3 · Double", caption: "First-floor double with harbour-facing sash window" },
      { scene: "kitchen", room: "Shared kitchen", caption: "Ground-floor kitchen, two ovens, seats ten" },
      { scene: "lounge", room: "Guest lounge", caption: "Bay-window lounge, wood burner lit October to April" },
      { scene: "laundry", room: "Laundry room", caption: "Washer, dryer and drying rails, free for guests" },
      { scene: "view", room: "The view", caption: "Kirkwall Bay from the second-floor landing" },
    ],
    rooms: [
      { id: "r1", name: "Room 1 · Single", sleeps: 1, rate: 52, booked: [[2, 6], [14, 18]] },
      { id: "r2", name: "Room 2 · Double", sleeps: 2, rate: 78, booked: [[0, 4]] },
      { id: "r3", name: "Room 3 · Double, harbour view", sleeps: 2, rate: 92, booked: [[5, 9], [20, 27]] },
      { id: "r4", name: "Room 4 · Twin", sleeps: 2, rate: 74, booked: [] },
      { id: "r5", name: "Room 5 · Single", sleeps: 1, rate: 52, booked: [[1, 12]] },
      { id: "r6", name: "Room 6 · Family", sleeps: 4, rate: 118, booked: [[8, 11]] },
      { id: "r7", name: "Room 7 · Double, en suite", sleeps: 2, rate: 105, booked: [[3, 5]] },
    ],
  },
  "stromness-harbour-lodge": {
    id: "stromness-harbour-lodge",
    name: "Stromness Harbour Lodge",
    town: "Stromness",
    region: "Orkney",
    tagline: "Pier-side lodge on the flagstone main street",
    coords: { lat: 58.965, lng: -3.296 },
    description: [
      "Stromness Harbour Lodge sits directly on the winding flagstone street that runs the length of the old town, with its own slip down to the water. The Hamnavoe ferry from Scrabster docks three hundred metres away.",
      "The lodge has five rooms over two floors, a shared kitchen looking onto the pier, and a small book-lined snug. It suits walkers heading for Hoy, divers working Scapa Flow, and anyone who wants to fall asleep to harbour sounds.",
      "Bikes and drysuits can be stored in the locked ground-floor store. The Pier Arts Centre and the town's pubs are all within two minutes on foot.",
    ],
    traits: [
      ["ti-door", "5 rooms let individually"],
      ["ti-tools-kitchen-2", "Shared kitchen with pier view"],
      ["ti-scuba-mask", "Drysuit and kit store"],
      ["ti-bike", "Secure bike storage"],
      ["ti-wifi", "Fibre wifi throughout"],
      ["ti-ship", "300 m from Hamnavoe ferry"],
      ["ti-books", "Book-lined guest snug"],
    ],
    photos: [
      { scene: "exterior", room: "The building", caption: "Lodge frontage on the flagstone main street" },
      { scene: "bedroom", room: "Room 2 · Double", caption: "Pier-side double, blackout blinds for summer nights" },
      { scene: "kitchen", room: "Shared kitchen", caption: "Kitchen window looks straight down the pier" },
      { scene: "lounge", room: "The snug", caption: "Book-lined snug with two armchairs and a stove" },
      { scene: "view", room: "The view", caption: "Hamnavoe and the Hoy hills from the slip" },
    ],
    rooms: [
      { id: "r1", name: "Room 1 · Single", sleeps: 1, rate: 48, booked: [[0, 3]] },
      { id: "r2", name: "Room 2 · Double, pier side", sleeps: 2, rate: 88, booked: [[4, 8]] },
      { id: "r3", name: "Room 3 · Twin", sleeps: 2, rate: 70, booked: [] },
      { id: "r4", name: "Room 4 · Double", sleeps: 2, rate: 76, booked: [[10, 17]] },
      { id: "r5", name: "Room 5 · Bunk room", sleeps: 4, rate: 96, booked: [[2, 5]] },
    ],
  },
  "scapa-view-guesthouse": {
    id: "scapa-view-guesthouse",
    name: "Scapa View Guesthouse",
    town: "St Margaret's Hope",
    region: "Orkney",
    tagline: "Quiet guesthouse above the bay in the Hope",
    coords: { lat: 58.831, lng: -2.955 },
    description: [
      "Scapa View sits on the hill above St Margaret's Hope on South Ronaldsay, looking north over Scapa Flow. It is the quietest of the three houses: six rooms, a big garden, and very little passing traffic.",
      "The village below has a shop, a smokehouse and two places to eat. The Pentland Ferries catamaran from Gills Bay lands at the pier, which makes this the easiest of the houses to reach by car from the Scottish mainland.",
      "The garden room at the back works well as a workspace for longer stays, and the whole house can be taken as a single booking for groups.",
    ],
    traits: [
      ["ti-door", "6 rooms, or book the whole house"],
      ["ti-tools-kitchen-2", "Shared kitchen and pantry"],
      ["ti-plant-2", "Large enclosed garden"],
      ["ti-device-laptop", "Garden room workspace"],
      ["ti-wash-machine", "On-site laundry"],
      ["ti-car", "Private parking for six cars"],
      ["ti-ship", "5 min from Pentland Ferries pier"],
    ],
    photos: [
      { scene: "exterior", room: "The building", caption: "South face and garden, looking up from the village road" },
      { scene: "bedroom", room: "Room 1 · Double", caption: "North-facing double with a view over Scapa Flow" },
      { scene: "lounge", room: "Garden room", caption: "Garden room, used as lounge and quiet workspace" },
      { scene: "kitchen", room: "Shared kitchen", caption: "Kitchen and pantry, breakfast supplies included" },
      { scene: "view", room: "The view", caption: "Scapa Flow at dusk from the front garden" },
    ],
    rooms: [
      { id: "r1", name: "Room 1 · Double, sea view", sleeps: 2, rate: 84, booked: [[6, 13]] },
      { id: "r2", name: "Room 2 · Double", sleeps: 2, rate: 72, booked: [] },
      { id: "r3", name: "Room 3 · Twin", sleeps: 2, rate: 68, booked: [[0, 2]] },
      { id: "r4", name: "Room 4 · Single", sleeps: 1, rate: 46, booked: [[3, 10]] },
      { id: "r5", name: "Room 5 · Single", sleeps: 1, rate: 46, booked: [] },
      { id: "r6", name: "Room 6 · Family", sleeps: 4, rate: 110, booked: [[15, 22]] },
    ],
  },
};

/* ---------- illustrated photo placeholders ---------- */
const SCENE_TINTS = {
  exterior: "#DCE7E3", bedroom: "#E4E1D6", kitchen: "#DFE5EA",
  lounge: "#E6DFD3", laundry: "#DDE6E6", view: "#D6E2E6",
};

function Scene({ type }) {
  const s = { fill: "none", stroke: "#22333E", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" };
  const art = {
    exterior: (
      <g {...s}>
        <path d="M60 150 L60 90 L110 55 L160 90 L160 150 Z" />
        <path d="M130 68 L130 50 L142 50 L142 77" />
        <rect x="95" y="115" width="30" height="35" />
        <rect x="72" y="98" width="18" height="18" />
        <rect x="130" y="98" width="18" height="18" />
        <path d="M20 150 L200 150" />
        <path d="M175 140 q8 -6 16 0 q8 6 16 0" />
        <circle cx="185" cy="45" r="12" />
      </g>
    ),
    bedroom: (
      <g {...s}>
        <path d="M45 150 L45 95 Q45 85 55 85 L75 85 Q85 85 85 95 L85 118" />
        <path d="M45 118 L185 118 L185 150" />
        <path d="M45 132 L185 132" />
        <rect x="55" y="100" width="26" height="12" rx="6" />
        <rect x="130" y="55" width="42" height="42" />
        <path d="M151 55 L151 97 M130 76 L172 76" />
      </g>
    ),
    kitchen: (
      <g {...s}>
        <path d="M40 150 L40 105 L180 105 L180 150" />
        <circle cx="75" cy="105" r="0.5" />
        <path d="M60 105 L60 92 L100 92 L100 105" />
        <path d="M68 92 L68 80 M92 92 L92 80" />
        <circle cx="140" cy="118" r="9" />
        <circle cx="162" cy="118" r="9" />
        <path d="M45 60 L120 60 M52 60 L52 48 M75 60 L75 45 M98 60 L98 50" />
      </g>
    ),
    lounge: (
      <g {...s}>
        <path d="M50 150 L50 112 Q50 102 60 102 L140 102 Q150 102 150 112 L150 150" />
        <path d="M50 128 L150 128" />
        <path d="M62 102 L62 90 Q62 84 68 84 L132 84 Q138 84 138 90 L138 102" />
        <path d="M172 150 L172 92 M160 92 L184 92 L172 70 Z" fill="#22333E" fillOpacity="0.08" />
        <path d="M158 70 L186 70 L179 92 L165 92 Z" />
      </g>
    ),
    laundry: (
      <g {...s}>
        <rect x="70" y="60" width="80" height="90" rx="8" />
        <circle cx="110" cy="112" r="24" />
        <circle cx="110" cy="112" r="15" strokeDasharray="4 6" />
        <circle cx="84" cy="72" r="3.5" />
        <circle cx="98" cy="72" r="3.5" />
        <path d="M126 72 L140 72" />
      </g>
    ),
    view: (
      <g {...s}>
        <path d="M20 118 L200 118" />
        <path d="M30 132 q10 -7 20 0 q10 7 20 0 q10 -7 20 0 q10 7 20 0 q10 -7 20 0 q10 7 20 0 q10 -7 20 0" />
        <circle cx="160" cy="72" r="16" />
        <path d="M55 82 q7 -8 14 0 M78 74 q7 -8 14 0" />
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 220 170" style={{ width: "min(46vw, 260px)", height: "auto" }} aria-hidden="true">
      {art[type] || art.exterior}
    </svg>
  );
}

/* ---------- carousel ---------- */
function Carousel({ photos }) {
  const [i, setI] = useState(0);
  const go = (n) => setI((i + n + photos.length) % photos.length);
  const p = photos[i];
  return (
    <div>
      <div className="slide" style={{ background: SCENE_TINTS[p.scene] || "#E2E2DC" }}>
        <Scene type={p.scene} />
        <div className="slide-tag">{p.room}</div>
        <button className="slide-btn prev" onClick={() => go(-1)} aria-label="Previous photo">‹</button>
        <button className="slide-btn next" onClick={() => go(1)} aria-label="Next photo">›</button>
      </div>
      <div className="caption-bar">
        <div>
          <div className="caption-room">{p.room}</div>
          <div className="caption-text">{p.caption}</div>
        </div>
        <div className="dots">
          {photos.map((_, n) => (
            <button key={n} className={"dot" + (n === i ? " on" : "")} onClick={() => setI(n)} aria-label={"Photo " + (n + 1)} />
          ))}
          <span className="dot-count">{i + 1} / {photos.length}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- booking ---------- */
function Booking({ building, onRedirect }) {
  const [checkIn, setCheckIn] = useState(iso(off(1)));
  const [checkOut, setCheckOut] = useState(iso(off(4)));
  const [selected, setSelected] = useState([]);

  const nights = nightsBetween(checkIn, checkOut);
  const valid = checkIn && checkOut && nights > 0;

  const availability = useMemo(() => {
    const map = {};
    building.rooms.forEach((r) => {
      map[r.id] = valid
        ? !r.booked.some(([a, b]) => overlaps(checkIn, checkOut, iso(off(a)), iso(off(b))))
        : null;
    });
    return map;
  }, [building, checkIn, checkOut, valid]);

  useEffect(() => { setSelected([]); }, [checkIn, checkOut, building.id]);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const total = selected.reduce((sum, id) => {
    const r = building.rooms.find((x) => x.id === id);
    return sum + (r ? r.rate * nights : 0);
  }, 0);

  const freeCount = Object.values(availability).filter((v) => v === true).length;

  return (
    <div className="book-card">
      <div className="book-dates">
        <label>
          <span className="field-label">Check-in</span>
          <input type="date" value={checkIn} min={iso(today)} onChange={(e) => setCheckIn(e.target.value)} />
        </label>
        <label>
          <span className="field-label">Check-out</span>
          <input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
        </label>
        <div className="nights-pill">
          {valid ? `${nights} night${nights > 1 ? "s" : ""} · ${freeCount} of ${building.rooms.length} rooms free` : "Pick valid dates"}
        </div>
      </div>

      <div className="room-list" role="list">
        {building.rooms.map((r) => {
          const free = availability[r.id];
          const on = selected.includes(r.id);
          return (
            <button
              key={r.id}
              role="listitem"
              className={"room-row" + (on ? " picked" : "") + (free === false ? " gone" : "")}
              disabled={free !== true}
              onClick={() => toggle(r.id)}
            >
              <span className="room-check" aria-hidden="true">{on ? "✓" : ""}</span>
              <span className="room-name">
                {r.name}
                <span className="room-sleeps">sleeps {r.sleeps}</span>
              </span>
              <span className="room-rate">£{r.rate}<em>/night</em></span>
              <span className={"room-status " + (free === true ? "ok" : free === false ? "no" : "")}>
                {free === true ? "Available" : free === false ? "Booked" : "—"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="book-footer">
        <div className="book-total">
          {selected.length > 0
            ? <>Total for {selected.length} room{selected.length > 1 ? "s" : ""}, {nights} nights: <strong>£{total}</strong></>
            : "Select available rooms to see a total"}
        </div>
        <button
          className="cta"
          disabled={selected.length === 0}
          onClick={() => onRedirect({ checkIn, checkOut, rooms: selected, total, nights })}
        >
          Continue to booking
        </button>
      </div>
    </div>
  );
}

/* ---------- main page ---------- */
export default function RentalTemplate() {
  const [activeId, setActiveId] = useState("kirkwall-bay-house");
  const [redirect, setRedirect] = useState(null);
  const b = BUILDINGS[activeId];
  const others = Object.values(BUILDINGS).filter((x) => x.id !== activeId);

  const refs = { photos: useRef(), about: useRef(), traits: useRef(), map: useRef(), book: useRef() };
  const jump = (k) => refs[k].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const switchBuilding = (id) => { setActiveId(id); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const gmaps = `https://www.google.com/maps?q=${b.coords.lat},${b.coords.lng}`;

  return (
    <div className="page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Public+Sans:wght@400;500;600&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/2.44.0/tabler-icons.min.css');
        * { box-sizing: border-box; margin: 0; }
        .page {
          --ink: #1B2B36; --sub: #56646D; --haar: #EFF2F1; --card: #FFFFFF;
          --line: #D8DDDB; --teal: #1F6E5E; --teal-soft: #E3EEEB; --rust: #A3492F;
          font-family: 'Public Sans', system-ui, sans-serif; color: var(--ink);
          background: var(--haar); min-height: 100vh; font-size: 15px; line-height: 1.65;
        }
        h1,h2 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; line-height: 1.15; }
        .wrap { max-width: 960px; margin: 0 auto; padding: 0 20px; }

        .nav { position: sticky; top: 0; z-index: 20; background: rgba(239,242,241,0.92);
          backdrop-filter: blur(6px); border-bottom: 1px solid var(--line); }
        .nav-in { display: flex; align-items: center; gap: 14px; padding: 12px 0; flex-wrap: wrap; }
        .back { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line);
          background: var(--card); border-radius: 999px; padding: 7px 14px; font: inherit;
          font-weight: 500; cursor: pointer; color: var(--ink); }
        .back:hover { border-color: var(--teal); color: var(--teal); }
        .nav-title { font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-weight: 600; }
        .nav-place { color: var(--sub); font-weight: 400; font-size: 14px; margin-left: 8px; }
        .nav-links { margin-left: auto; display: flex; gap: 6px; flex-wrap: wrap; }
        .nav-links button { border: none; background: none; font: inherit; font-size: 13.5px;
          color: var(--sub); padding: 6px 10px; border-radius: 8px; cursor: pointer; }
        .nav-links button:hover { background: var(--teal-soft); color: var(--teal); }

        .hero { padding: 34px 0 10px; }
        .hero h1 { font-size: clamp(28px, 5vw, 40px); }
        .hero p { color: var(--sub); margin-top: 6px; }

        .slide { position: relative; border-radius: 14px; overflow: hidden; margin-top: 22px;
          aspect-ratio: 16 / 8; display: flex; align-items: center; justify-content: center; }
        .slide-tag { position: absolute; left: 14px; top: 12px; background: rgba(27,43,54,0.85);
          color: #fff; font-size: 12.5px; padding: 5px 11px; border-radius: 999px; letter-spacing: 0.02em; }
        .slide-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px;
          border-radius: 50%; border: 1px solid var(--line); background: var(--card); font-size: 22px;
          line-height: 1; cursor: pointer; color: var(--ink); }
        .slide-btn:hover { border-color: var(--teal); color: var(--teal); }
        .prev { left: 12px; } .next { right: 12px; }
        .caption-bar { display: flex; gap: 16px; align-items: flex-start; justify-content: space-between;
          padding: 12px 4px 0; flex-wrap: wrap; }
        .caption-room { font-weight: 600; font-size: 14px; }
        .caption-text { color: var(--sub); font-size: 14px; }
        .dots { display: flex; align-items: center; gap: 7px; padding-top: 4px; }
        .dot { width: 9px; height: 9px; border-radius: 50%; border: 1px solid var(--sub);
          background: none; cursor: pointer; padding: 0; }
        .dot.on { background: var(--teal); border-color: var(--teal); }
        .dot-count { font-size: 12px; color: var(--sub); margin-left: 4px; font-variant-numeric: tabular-nums; }

        section { scroll-margin-top: 84px; }
        .section-head { display: flex; align-items: baseline; gap: 12px; margin: 44px 0 14px; }
        .section-head h2 { font-size: 24px; }
        .section-head .rule { flex: 1; height: 1px; background: var(--line); }

        .about-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 22px; align-items: start; }
        @media (max-width: 720px) { .about-grid { grid-template-columns: 1fr; } }
        .prose p + p { margin-top: 12px; }

        .traits-card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 20px; }
        .traits-card h3 { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
        .traits-card ul { list-style: none; padding: 0; display: grid; gap: 10px; }
        .traits-card li { display: flex; gap: 10px; align-items: center; font-size: 14px; }
        .traits-card i { color: var(--teal); font-size: 18px; }

        .map-card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
        .map-canvas { position: relative; aspect-ratio: 16 / 6; background:
          linear-gradient(180deg, #DCE8E6 0%, #CFE0DE 100%); }
        .map-pin { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -100%);
          text-align: center; }
        .map-pin i { font-size: 34px; color: var(--rust); }
        .map-pin span { display: block; background: var(--card); border: 1px solid var(--line);
          border-radius: 8px; padding: 3px 10px; font-size: 12.5px; margin-top: 2px; }
        .map-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px;
          padding: 14px 18px; flex-wrap: wrap; }
        .coords { font-family: ui-monospace, monospace; font-size: 13px; color: var(--sub); }
        .map-link { display: inline-flex; gap: 7px; align-items: center; text-decoration: none;
          color: var(--teal); font-weight: 600; font-size: 14px; }

        .book-card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 20px; }
        .book-dates { display: flex; gap: 14px; align-items: end; flex-wrap: wrap; }
        .field-label { display: block; font-size: 12.5px; font-weight: 600; color: var(--sub);
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
        .book-dates input { font: inherit; padding: 9px 12px; border: 1px solid var(--line);
          border-radius: 10px; background: var(--haar); color: var(--ink); }
        .nights-pill { margin-left: auto; background: var(--teal-soft); color: var(--teal);
          font-weight: 600; font-size: 13.5px; padding: 9px 14px; border-radius: 999px; }
        .room-list { margin-top: 18px; border-top: 1px solid var(--line); }
        .room-row { display: grid; grid-template-columns: 30px 1fr auto 92px; gap: 12px; align-items: center;
          width: 100%; text-align: left; background: none; border: none; border-bottom: 1px solid var(--line);
          padding: 13px 6px; font: inherit; cursor: pointer; color: var(--ink); }
        .room-row:hover:not(:disabled) { background: var(--teal-soft); }
        .room-row.picked { background: var(--teal-soft); }
        .room-row.gone { color: var(--sub); cursor: not-allowed; }
        .room-check { width: 22px; height: 22px; border: 1.5px solid var(--line); border-radius: 6px;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
          color: #fff; background: var(--card); }
        .picked .room-check { background: var(--teal); border-color: var(--teal); }
        .gone .room-check { visibility: hidden; }
        .room-name { font-weight: 500; }
        .room-sleeps { display: block; font-size: 12.5px; color: var(--sub); font-weight: 400; }
        .room-rate { font-family: ui-monospace, monospace; font-size: 14.5px; }
        .room-rate em { font-style: normal; color: var(--sub); font-size: 12px; }
        .room-status { font-size: 12.5px; font-weight: 600; text-align: right; }
        .room-status.ok { color: var(--teal); } .room-status.no { color: var(--rust); }
        .book-footer { display: flex; gap: 14px; align-items: center; justify-content: space-between;
          margin-top: 16px; flex-wrap: wrap; }
        .book-total { color: var(--sub); font-size: 14.5px; }
        .book-total strong { color: var(--ink); font-size: 17px; }
        .cta { font: inherit; font-weight: 600; background: var(--teal); color: #fff; border: none;
          border-radius: 999px; padding: 12px 26px; cursor: pointer; }
        .cta:hover:not(:disabled) { background: #185A4D; }
        .cta:disabled { background: var(--line); color: var(--sub); cursor: not-allowed; }

        .others-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px; margin-bottom: 56px; }
        .other-card { background: var(--card); border: 1px solid var(--line); border-radius: 14px;
          overflow: hidden; text-align: left; padding: 0; font: inherit; cursor: pointer; color: var(--ink); }
        .other-card:hover { border-color: var(--teal); }
        .other-thumb { aspect-ratio: 16 / 7; display: flex; align-items: center; justify-content: center; }
        .other-body { padding: 14px 16px 16px; }
        .other-body h3 { font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-weight: 600; }
        .other-body p { color: var(--sub); font-size: 13.5px; margin-top: 3px; }
        .other-meta { margin-top: 10px; font-size: 12.5px; color: var(--teal); font-weight: 600; }

        .modal-veil { position: fixed; inset: 0; background: rgba(27,43,54,0.45); z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: var(--card); border-radius: 16px; max-width: 460px; width: 100%; padding: 26px; }
        .modal h3 { font-family: 'Fraunces', Georgia, serif; font-size: 20px; }
        .modal p { color: var(--sub); font-size: 14px; margin-top: 8px; }
        .modal dl { margin: 16px 0; border-top: 1px solid var(--line); }
        .modal dl div { display: flex; justify-content: space-between; padding: 9px 0;
          border-bottom: 1px solid var(--line); font-size: 14px; }
        .modal dt { color: var(--sub); } .modal dd { font-weight: 600; }
        .redirect-url { font-family: ui-monospace, monospace; font-size: 12px; background: var(--haar);
          border-radius: 8px; padding: 10px 12px; word-break: break-all; color: var(--sub); }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; }
        .ghost { font: inherit; font-weight: 500; background: none; border: 1px solid var(--line);
          border-radius: 999px; padding: 10px 20px; cursor: pointer; color: var(--ink); }
      `}</style>

      {/* NAVBAR */}
      <nav className="nav">
        <div className="wrap nav-in">
          <button className="back" onClick={() => alert("Test build — this will link to the landing page.")}>
            <i className="ti ti-arrow-left" /> All rentals
          </button>
          <div className="nav-title">
            {b.name}
            <span className="nav-place">{b.town}, {b.region}</span>
          </div>
          <div className="nav-links">
            <button onClick={() => jump("photos")}>Photos</button>
            <button onClick={() => jump("about")}>About</button>
            <button onClick={() => jump("traits")}>Amenities</button>
            <button onClick={() => jump("map")}>Location</button>
            <button onClick={() => jump("book")}>Book</button>
          </div>
        </div>
      </nav>

      <main className="wrap">
        <header className="hero">
          <h1>{b.name}</h1>
          <p>{b.tagline} · {b.town}, {b.region}</p>
        </header>

        {/* CAROUSEL */}
        <section ref={refs.photos}>
          <Carousel key={b.id} photos={b.photos} />
        </section>

        {/* DESCRIPTION + TRAITS */}
        <section ref={refs.about}>
          <div className="section-head"><h2>About this building</h2><div className="rule" /></div>
          <div className="about-grid">
            <div className="prose">
              {b.description.map((p, n) => <p key={n}>{p}</p>)}
            </div>
            <div className="traits-card" ref={refs.traits}>
              <h3>What this rental has</h3>
              <ul>
                {b.traits.map(([icon, label]) => (
                  <li key={label}><i className={"ti " + icon} aria-hidden="true" />{label}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* MAP */}
        <section ref={refs.map}>
          <div className="section-head"><h2>Where you'll be</h2><div className="rule" /></div>
          <div className="map-card">
            <div className="map-canvas" role="img" aria-label={"Map showing " + b.name + " in " + b.town}>
              <div className="map-pin">
                <i className="ti ti-map-pin-filled" style={{ fontFamily: "tabler-icons" }} aria-hidden="true">📍</i>
                <span>{b.name}</span>
              </div>
            </div>
            <div className="map-foot">
              <span className="coords">{b.coords.lat.toFixed(3)}°N, {Math.abs(b.coords.lng).toFixed(3)}°W · {b.town}, {b.region}</span>
              <a className="map-link" href={gmaps} target="_blank" rel="noreferrer">
                Open in Google Maps <i className="ti ti-external-link" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* BOOKING */}
        <section ref={refs.book}>
          <div className="section-head"><h2>Check availability and book</h2><div className="rule" /></div>
          <Booking key={b.id} building={b} onRedirect={setRedirect} />
        </section>

        {/* OTHER RENTALS */}
        <section>
          <div className="section-head"><h2>Other rentals on this site</h2><div className="rule" /></div>
          <div className="others-grid">
            {others.map((o) => (
              <button key={o.id} className="other-card" onClick={() => switchBuilding(o.id)}>
                <div className="other-thumb" style={{ background: SCENE_TINTS.exterior }}>
                  <Scene type="exterior" />
                </div>
                <div className="other-body">
                  <h3>{o.name}</h3>
                  <p>{o.town}, {o.region} · {o.rooms.length} rooms</p>
                  <div className="other-meta">From £{Math.min(...o.rooms.map((r) => r.rate))}/night → View rental</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* REDIRECT MODAL (simulates handoff to the booking/confirmation page) */}
      {redirect && (
        <div className="modal-veil" onClick={() => setRedirect(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Redirecting to confirmation</h3>
            <p>On the live site this continues to your booking confirmation page, carrying this data — then on to Stripe Checkout.</p>
            <dl>
              <div><dt>Building</dt><dd>{b.name}</dd></div>
              <div><dt>Check-in</dt><dd>{fmtLong(redirect.checkIn)}</dd></div>
              <div><dt>Check-out</dt><dd>{fmtLong(redirect.checkOut)}</dd></div>
              <div><dt>Rooms</dt><dd>{redirect.rooms.map((id) => b.rooms.find((r) => r.id === id)?.name.split("·")[0].trim()).join(", ")}</dd></div>
              <div><dt>Total ({redirect.nights} nights)</dt><dd>£{redirect.total}</dd></div>
            </dl>
            <div className="redirect-url">
              /book?building={b.id}&rooms={redirect.rooms.join(",")}&checkin={redirect.checkIn}&checkout={redirect.checkOut}
            </div>
            <div className="modal-actions">
              <button className="ghost" onClick={() => setRedirect(null)}>Back</button>
              <button className="cta" onClick={() => setRedirect(null)}>Looks right</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @fileoverview Generates the Thoth correspondence-deck ground-truth fixture.
 *
 * Transcribed by hand from test/fixtures/thoth/raw-extracted-text.json (the
 * PDF's own embedded text layer, extracted via pdfjs-dist) and cross-checked
 * against test/mocks/Thoth-Correspondence-Deck.pdf page by page. Boilerplate
 * glosses (planet/sign/element/Sephira/World descriptions) are deduped into
 * the `vocabulary` array per docs/THOTH_CALL_AND_RESPONSE_PLAN.md §3; each
 * card's `facts` only carries the atomic, per-card-unique values.
 *
 * Run: npx tsx scripts/thoth/generateGroundTruth.ts
 * Output: test/fixtures/thoth/thoth-ground-truth.json
 */

import { writeFileSync, readFileSync } from "fs";
import path from "path";

type CardGroup = "trump" | "ace" | "small" | "court" | "reference";

interface GTFact {
  field: string;
  value: string;
  accept?: string[];
  required: boolean;
  sourceDefect?: boolean;
}

interface ThothCard {
  key: string;
  group: CardGroup;
  frontPage: number;
  backPage: number;
  title: string;
  subtitle: string;
  facts: GTFact[];
}

interface GTVocab {
  term: string;
  set:
    | "glossary"
    | "sephiroth"
    | "worlds"
    | "planets"
    | "signs"
    | "elements"
    | "hebrewLetters"
    | "courtRanks"
    | "cardTitles"
    | "other";
  definition: string;
  aliases?: string[];
}

interface ThothGroundTruth {
  source: { filename: string; pages: 52; sha256: string };
  cards: ThothCard[];
  vocabulary: GTVocab[];
  pageIndex: Record<number, string[]>;
}

const f = (
  field: string,
  value: string,
  opts: Partial<Pick<GTFact, "accept" | "required" | "sourceDefect">> = {},
): GTFact => ({ field, value, required: true, ...opts });

// ---------------------------------------------------------------------------
// Shared vocabulary (dedupe boilerplate repeated across many card backs)
// ---------------------------------------------------------------------------

const PLANETS: Record<string, string> = {
  Sun: "the radiant Self; vitality, integration, the centre.",
  Moon: "the reflective psyche; instinct, tides of feeling, the subconscious.",
  Mercury: "mind and message; intellect, speech, cunning.",
  Venus: "love and attraction; desire, beauty, harmony.",
  Mars: "force and drive; energy, aggression, courage.",
  Jupiter: "expansion and grace; growth, fortune, mercy.",
  Saturn: "limit and time; structure, discipline, endings.",
};

const SIGNS: Record<string, string> = {
  Aries: "cardinal Fire; the initiating spark, a headlong start.",
  Taurus: "fixed Earth; steady sensual persistence, fertile ground.",
  Gemini: "mutable Air; quick duality, curiosity, exchange.",
  Cancer: "cardinal Water; protective feeling, the nurturing vessel.",
  Leo: "fixed Fire; radiant will, pride, the creative heart.",
  Virgo: "mutable Earth; discerning craft, analysis, service.",
  Libra: "cardinal Air; balance, justice, the weighing of opposites.",
  Scorpio: "fixed Water; intense depth, desire, regeneration.",
  Sagittarius: "mutable Fire; the aimed arrow, vision, the quest.",
  Capricorn: "cardinal Earth; ambition, discipline, mastery through limit.",
  Aquarius: "fixed Air; the fixed idea, the individual, the new current.",
  Pisces: "mutable Water; empathy, dream, dissolution.",
};

const ELEMENTS: Record<string, string> = {
  Fire: "energy and will; the outgoing active force.",
  Water: "feeling and reception; emotion, intuition, the dissolving.",
  Air: "mind and motion; thought, communication, mediation.",
  Earth: "body and substance; the stable, manifesting ground.",
  Spirit: "the fifth, all-pervading essence; quintessence behind the four.",
};

const SEPHIROTH: Record<string, string> = {
  Kether: "Crown — the root, pure being, unity",
  Chokmah: "Wisdom — dynamic outflowing Force, the Father",
  Binah: "Understanding — Form and limitation, the Mother",
  Chesed: "Mercy — stability, authority, benevolence",
  Geburah: "Severity — power, will, necessary destruction",
  Tiphareth: "Beauty — harmony, the centred Self, the Son",
  Netzach: "Victory — desire, emotion, nature's drive",
  Hod: "Splendour — intellect, language, analysis",
  Yesod: "Foundation — the astral, imagination, vital substrate",
  Malkuth: "Kingdom — the material world, body, manifestation",
};

const WORLDS: Record<string, string> = {
  Atziluth:
    "Archetypal World — pure Will and Spirit; the root idea (Fire / Yod).",
  Briah: "Creative World — the heart-mind; formative feeling (Water / Heh).",
  Yetzirah: "Formative World — the astral; thought and image (Air / Vau).",
  Assiah: "Material World — the manifest, physical plane (Earth / final Heh).",
};

const COURT_RANKS: Record<string, string> = {
  Knight:
    "Fire / Yod: swift, initiating force; violent and transient (the spark).",
  Queen:
    "Water / Heh: receptive, stabilising force; she holds and transmits (the vessel).",
  Prince:
    "Air / Vau: intellectual, active force that realises and applies (the actor).",
  Princess:
    "Earth / final Heh: the throne of the Ace; brings the force to manifestation.",
};

const HEBREW_LETTERS: [name: string, value: string][] = [
  ["Aleph", "A"],
  ["Beth", "B"],
  ["Gimel", "G"],
  ["Daleth", "D"],
  ["Heh", "H"],
  ["Vau", "V"],
  ["Zain", "Z"],
  ["Cheth", "Ch"],
  ["Teth", "T"],
  ["Yod", "Y"],
  ["Kaph", "K"],
  ["Lamed", "L"],
  ["Mem", "M"],
  ["Nun", "N"],
  ["Samekh", "S"],
  ["Ayin", "O"],
  ["Peh", "P"],
  ["Tzaddi", "Tz"],
  ["Qoph", "Q"],
  ["Resh", "R"],
  ["Shin", "Sh"],
  ["Tau", "Th"],
];

// 40-term glossary (verbatim from the 4 glossary reference cards, page 52)
const GLOSSARY: [term: string, definition: string][] = [
  // Qabalah & the Tree
  [
    "Qabalah",
    "The Jewish mystical tradition Crowley adapts; its Tree of Life underlies every correspondence.",
  ],
  [
    "Tree of Life",
    "The core diagram: 10 Sephiroth joined by 22 paths; minors climb it, Trumps are its paths.",
  ],
  [
    "Sephira",
    "One of the 10 emanations/stations on the Tree; the numbers 1–10 each are a Sephira.",
  ],
  [
    "Emanation",
    "The outflowing by which each Sephira proceeds from the one before it.",
  ],
  [
    "Path",
    "One of the 22 lines joining two Sephiroth; each bears one Trump and one Hebrew letter.",
  ],
  [
    "Pillars",
    "The Tree's three columns: Mercy (right), Severity (left), and the balancing Middle Pillar.",
  ],
  [
    "Tetragrammaton",
    "The four-letter Name Yod-Heh-Vau-Heh; maps to Fire-Water-Air-Earth and Knight-Queen-Prince-Princess.",
  ],
  [
    "World / plane",
    'One of four planes the whole Tree repeats in; Crowley calls them the "four planes" (see The Four Worlds).',
  ],
  [
    "Minutum Mundum",
    'The "Lesser World" — the Golden Dawn colouring of the Tree; the Queen-scale colours the pips take.',
  ],
  // Astrology & time
  [
    "Zodiac",
    "The 360° ring of twelve signs the Sun appears to travel in a year.",
  ],
  [
    "Sign",
    "A 30° twelfth of the zodiac (Aries…Pisces), each with an element and a mode.",
  ],
  [
    "Element",
    "Fire, Water, Air, or Earth (plus Spirit) — the qualities everything is classed under.",
  ],
  [
    "Triplicity",
    "The three signs sharing an element (e.g. Fire = Aries, Leo, Sagittarius) → one suit.",
  ],
  [
    "Mode",
    "A sign's manner: cardinal = initiating, fixed = stabilising, mutable = adapting.",
  ],
  [
    "Decan",
    "A 10° third of a sign; the 36 decans each carry one small card, ruled by a planet.",
  ],
  [
    "Chaldean order",
    "Saturn-Jupiter-Mars-Sun-Venus-Mercury-Moon — the sequence that assigns the decans.",
  ],
  [
    "Cusp",
    "The boundary where one sign becomes the next (≈ the transition dates shown).",
  ],
  [
    "Ascendant / rising sign",
    "The sign rising at birth; with the Sun-sign it fixes a court card for a person.",
  ],
  [
    "Nativity",
    "A birth chart; Crowley reads a court as a person by Sun or rising sign at nativity.",
  ],
  [
    "Planet",
    "One of the seven classical planets, Sun through Saturn, used as rulers.",
  ],
  [
    "Ecliptic longitude",
    "Position round the zodiac in degrees; 0° = start of Aries (top of the ring).",
  ],
  // Tarot & reading
  [
    "Trump / Major Arcana",
    "The 22 titled cards, Fool–Universe; each is a path and a Hebrew letter.",
  ],
  ["Minor Arcana", "The 56 suit cards: 40 pips + 16 courts."],
  [
    "Pip / small card",
    "A numbered suit card, Ace–10; each is a Sephira expressed in a suit.",
  ],
  [
    "Court card",
    "The sixteen \u201cpeople\u201d cards: Knight, Queen, Prince, Princess in each suit.",
  ],
  [
    "Ace",
    "The Root of its element — the seed of the suit, set above the numbered cards.",
  ],
  [
    "Root",
    'Crowley\u2019s name for the Aces: "the roots of the four elements," pertaining to Kether.',
  ],
  [
    "Significator",
    "The court card chosen to stand for the querent in a reading.",
  ],
  ["Querent", "The person the reading is for — who asks the question."],
  [
    "Elemental dignity",
    "Judging a card by its neighbours: friendly elements strengthen it, contrary ones weaken it.",
  ],
  [
    "Well-/ill-dignified",
    "Strengthened (well-) or afflicted (ill-) by neighbours; Thoth uses this, not reversal.",
  ],
  [
    "Reversal",
    "Not used in Thoth — where other decks read a reversed card, Crowley reads elemental dignity.",
  ],
  [
    "Counterchange",
    "Crowley's swap of the Emperor's and Star's letters/paths (Tzaddi\u2194Heh); their signs stay.",
  ],
  [
    "Quadrant",
    "A quarter of the heavens; Princesses rule quadrants round the N. Pole, with no zodiac span.",
  ],
  // Colour, chakra & symbols
  [
    "Colour scales",
    "The four Golden Dawn colour scales, one per World; each card shows all four.",
  ],
  [
    "Flecked / rayed",
    "A base colour speckled (flecked) or streaked (rayed) with a second, in the Prince/Princess scales.",
  ],
  [
    "Glyph",
    "The shorthand symbol for a sign, planet, or element (e.g. \u2648, \u263F, \u25B3).",
  ],
  [
    "Chakra",
    "A body energy-centre from yoga; here a modern overlay on the Tree — not part of Crowley's system.",
  ],
  [
    "Quintessence / Spirit",
    "The fifth element: the all-pervading essence behind Fire, Water, Air, Earth.",
  ],
  [
    "Lotus",
    "The flower Crowley uses throughout for the life-force and the chakras.",
  ],
];

const OTHER_TERMS: [term: string, definition: string][] = [
  [
    "Overlay",
    "A modern add-on — not in Crowley (marks the chakra correspondences).",
  ],
  [
    "Zodiac ring",
    "Where a card sits on a wheel with 0° Aries at the top, going clockwise.",
  ],
];

// ---------------------------------------------------------------------------
// Trumps (22) — pages 3/4, 5/6, 7/8, 9/10, 11/12, 13/14
// ---------------------------------------------------------------------------

interface TrumpRow {
  num: string;
  title: string;
  hebrew: [string, string];
  attribution: { type: "planet" | "sign" | "element"; names: string[] };
  path: string;
  sephA: string;
  sephB: string;
  zodiacRing?: string;
  sunDates?: string;
  counterchange?: string;
  chakra: string;
  meaning: string;
  colours: [string, string, string, string];
  frontPage: number;
  backPage: number;
}

const TRUMPS: TrumpRow[] = [
  {
    num: "0",
    title: "The Fool",
    hebrew: ["Aleph", "A"],
    attribution: { type: "element", names: ["Air"] },
    path: "11",
    sephA: "Kether",
    sephB: "Chokmah",
    chakra: "Ajna (brow) \u2192 Sahasrara (crown) [overlay]",
    meaning:
      "Pure potential; the leap into being before form. Spontaneity, fresh start, folly that is wisdom.",
    colours: [
      "Bright pale yellow",
      "Sky blue",
      "Blue emerald green",
      "Emerald flecked gold",
    ],
    frontPage: 3,
    backPage: 4,
  },
  {
    num: "I",
    title: "The Magus",
    hebrew: ["Beth", "B"],
    attribution: { type: "planet", names: ["Mercury"] },
    path: "12",
    sephA: "Kether",
    sephB: "Binah",
    chakra: "Ajna (brow) \u2192 Sahasrara (crown) [overlay]",
    meaning:
      "Will directing energy — the word that makes worlds. Skill, communication, creative power (and trickery).",
    colours: ["Yellow", "Purple", "Grey", "Indigo rayed violet"],
    frontPage: 3,
    backPage: 4,
  },
  {
    num: "II",
    title: "The Priestess",
    hebrew: ["Gimel", "G"],
    attribution: { type: "planet", names: ["Moon"] },
    path: "13",
    sephA: "Kether",
    sephB: "Tiphareth",
    chakra: "Anahata (heart) \u2192 Sahasrara (crown) [overlay]",
    meaning:
      "Pure intuition behind the veil; the subconscious current. Hidden knowledge, receptivity, mystery.",
    colours: ["Blue", "Silver", "Cold pale blue", "Silver rayed sky-blue"],
    frontPage: 3,
    backPage: 4,
  },
  {
    num: "III",
    title: "The Empress",
    hebrew: ["Daleth", "D"],
    attribution: { type: "planet", names: ["Venus"] },
    path: "14",
    sephA: "Chokmah",
    sephB: "Binah",
    chakra: "Ajna (brow) [overlay]",
    meaning:
      "Fertile love and beauty; the mothering of forms. Abundance, harmony, nurture.",
    colours: ["Emerald green", "Sky blue", "Early spring green", "Bright rose"],
    frontPage: 3,
    backPage: 4,
  },
  {
    num: "IV",
    title: "The Emperor",
    hebrew: ["Tzaddi", "Tz"],
    attribution: { type: "sign", names: ["Aries"] },
    zodiacRing: "12:30 o'clock \u00b7 15\u00b0 CW from top",
    sunDates: "~Mar 21 \u2013 Apr 20",
    path: "28",
    sephA: "Netzach",
    sephB: "Yesod",
    counterchange:
      "Emperor takes Tzaddi (was Heh), path 28. Sign Aries stays, and its colours stay.",
    chakra: "Svadhisthana (sacral) \u2192 Manipura (solar plexus) [overlay]",
    meaning:
      "Authority and structure; paternal power defining law. Leadership, order, energy channelled.",
    colours: ["Scarlet", "Red", "Brilliant flame", "Glowing red"],
    frontPage: 5,
    backPage: 6,
  },
  {
    num: "V",
    title: "The Hierophant",
    hebrew: ["Vau", "V"],
    attribution: { type: "sign", names: ["Taurus"] },
    zodiacRing: "1:30 o'clock \u00b7 45\u00b0 CW from top",
    sunDates: "~Apr 20 \u2013 May 21",
    path: "16",
    sephA: "Chokmah",
    sephB: "Chesed",
    chakra: "Vishuddha (throat) \u2192 Ajna (brow) [overlay]",
    meaning:
      "The inner teacher; tradition as bridge to the divine. Instruction, ritual, established wisdom.",
    colours: ["Red-orange", "Deep indigo", "Deep warm olive", "Rich brown"],
    frontPage: 5,
    backPage: 6,
  },
  {
    num: "VI",
    title: "The Lovers",
    hebrew: ["Zain", "Z"],
    attribution: { type: "sign", names: ["Gemini"] },
    zodiacRing: "2:30 o'clock \u00b7 75\u00b0 CW from top",
    sunDates: "~May 21 \u2013 Jun 21",
    path: "17",
    sephA: "Binah",
    sephB: "Tiphareth",
    chakra: "Anahata (heart) \u2192 Ajna (brow) [overlay]",
    meaning:
      "Union through discrimination; the marriage of opposites. Choice, relationship, alchemical joining.",
    colours: [
      "Orange",
      "Pale mauve",
      "New yellow leather",
      "Reddish grey-mauve",
    ],
    frontPage: 5,
    backPage: 6,
  },
  {
    num: "VII",
    title: "The Chariot",
    hebrew: ["Cheth", "Ch"],
    attribution: { type: "sign", names: ["Cancer"] },
    zodiacRing: "3:30 o'clock \u00b7 105\u00b0 CW from top",
    sunDates: "~Jun 21 \u2013 Jul 23",
    path: "18",
    sephA: "Binah",
    sephB: "Geburah",
    chakra: "Vishuddha (throat) \u2192 Ajna (brow) [overlay]",
    meaning:
      "The vehicle bearing the Grail; triumph through containment. Willed motion, victory, self-mastery.",
    colours: ["Amber", "Maroon", "Rich bright russet", "Dark greenish brown"],
    frontPage: 5,
    backPage: 6,
  },
  {
    num: "VIII",
    title: "Adjustment",
    hebrew: ["Lamed", "L"],
    attribution: { type: "sign", names: ["Libra"] },
    zodiacRing: "6:30 o'clock \u00b7 195\u00b0 CW from top",
    sunDates: "~Sep 23 \u2013 Oct 23",
    path: "22",
    sephA: "Geburah",
    sephB: "Tiphareth",
    chakra: "Anahata (heart) \u2192 Vishuddha (throat) [overlay]",
    meaning:
      "Truth and exact equilibrium; the act balanced by its result. Justice, weighing, karmic poise.",
    colours: ["Emerald green", "Blue", "Deep blue-green", "Pale green"],
    frontPage: 7,
    backPage: 8,
  },
  {
    num: "IX",
    title: "The Hermit",
    hebrew: ["Yod", "Y"],
    attribution: { type: "sign", names: ["Virgo"] },
    zodiacRing: "5:30 o'clock \u00b7 165\u00b0 CW from top",
    sunDates: "~Aug 23 \u2013 Sep 23",
    path: "20",
    sephA: "Chesed",
    sephB: "Tiphareth",
    chakra: "Anahata (heart) \u2192 Vishuddha (throat) [overlay]",
    meaning:
      "The inward light; solitary illumination, the hidden fertile seed. Guidance, withdrawal, wisdom sought alone.",
    colours: ["Yellowish green", "Slate grey", "Green-grey", "Plum"],
    frontPage: 7,
    backPage: 8,
  },
  {
    num: "X",
    title: "Fortune",
    hebrew: ["Kaph", "K"],
    attribution: { type: "planet", names: ["Jupiter"] },
    path: "21",
    sephA: "Chesed",
    sephB: "Netzach",
    chakra: "Manipura (solar plexus) \u2192 Vishuddha (throat) [overlay]",
    meaning:
      "The turning wheel; flux of luck and change. Cycles, fate in motion — seize the rising point.",
    colours: ["Violet", "Blue", "Rich purple", "Bright blue rayed yellow"],
    frontPage: 7,
    backPage: 8,
  },
  {
    num: "XI",
    title: "Lust",
    hebrew: ["Teth", "T"],
    attribution: { type: "sign", names: ["Leo"] },
    zodiacRing: "4:30 o'clock \u00b7 135\u00b0 CW from top",
    sunDates: "~Jul 23 \u2013 Aug 23",
    path: "19",
    sephA: "Chesed",
    sephB: "Geburah",
    chakra: "Vishuddha (throat) [overlay]",
    meaning:
      "Ecstatic vital force; courage riding the beast. Passion, creative energy, joy of strength without shame.",
    colours: ["Greenish yellow", "Deep purple", "Grey", "Reddish amber"],
    frontPage: 7,
    backPage: 8,
  },
  {
    num: "XII",
    title: "The Hanged Man",
    hebrew: ["Mem", "M"],
    attribution: { type: "element", names: ["Water"] },
    path: "23",
    sephA: "Geburah",
    sephB: "Hod",
    chakra: "Manipura (solar plexus) \u2192 Vishuddha (throat) [overlay]",
    meaning:
      "Surrender and reversal; the old self sacrificed into a new element. Letting go, redemptive stasis.",
    colours: [
      "Deep blue",
      "Sea green",
      "Deep olive green",
      "White flecked purple",
    ],
    frontPage: 9,
    backPage: 10,
  },
  {
    num: "XIII",
    title: "Death",
    hebrew: ["Nun", "N"],
    attribution: { type: "sign", names: ["Scorpio"] },
    zodiacRing: "7:30 o'clock \u00b7 225\u00b0 CW from top",
    sunDates: "~Oct 23 \u2013 Nov 22",
    path: "24",
    sephA: "Tiphareth",
    sephB: "Netzach",
    chakra: "Manipura (solar plexus) \u2192 Anahata (heart) [overlay]",
    meaning:
      "Transformation; putrefaction feeding rebirth. Necessary endings, transition, metamorphosis.",
    colours: [
      "Green-blue",
      "Dull brown",
      "Very dark brown",
      "Livid indigo-brown",
    ],
    frontPage: 9,
    backPage: 10,
  },
  {
    num: "XIV",
    title: "Art",
    hebrew: ["Samekh", "S"],
    attribution: { type: "sign", names: ["Sagittarius"] },
    zodiacRing: "8:30 o'clock \u00b7 255\u00b0 CW from top",
    sunDates: "~Nov 22 \u2013 Dec 22",
    path: "25",
    sephA: "Tiphareth",
    sephB: "Yesod",
    chakra: "Svadhisthana (sacral) \u2192 Anahata (heart) [overlay]",
    meaning:
      "Alchemical fusion; tempering opposites toward gold. Synthesis, combination, refined balance in action.",
    colours: ["Blue", "Yellow", "Green", "Dark vivid blue"],
    frontPage: 9,
    backPage: 10,
  },
  {
    num: "XV",
    title: "The Devil",
    hebrew: ["Ayin", "O"],
    attribution: { type: "sign", names: ["Capricorn"] },
    zodiacRing: "9:30 o'clock \u00b7 285\u00b0 CW from top",
    sunDates: "~Dec 22 \u2013 Jan 20",
    path: "26",
    sephA: "Tiphareth",
    sephB: "Hod",
    chakra: "Manipura (solar plexus) \u2192 Anahata (heart) [overlay]",
    meaning:
      "Creative material force and mirth; matter and instinct scaling heights. Ambition, appetite, earthy generation.",
    colours: ["Indigo", "Black", "Blue-black", "Cold dark grey"],
    frontPage: 9,
    backPage: 10,
  },
  {
    num: "XVI",
    title: "The Tower",
    hebrew: ["Peh", "P"],
    attribution: { type: "planet", names: ["Mars"] },
    path: "27",
    sephA: "Netzach",
    sephB: "Hod",
    chakra: "Manipura (solar plexus) [overlay]",
    meaning:
      "Sudden liberating destruction; the false structure blasted open. Upheaval, breakthrough, freeing catastrophe.",
    colours: ["Scarlet", "Red", "Venetian red", "Bright red rayed azure"],
    frontPage: 11,
    backPage: 12,
  },
  {
    num: "XVII",
    title: "The Star",
    hebrew: ["Heh", "H"],
    attribution: { type: "sign", names: ["Aquarius"] },
    zodiacRing: "10:30 o'clock \u00b7 315\u00b0 CW from top",
    sunDates: "~Jan 20 \u2013 Feb 19",
    path: "15",
    sephA: "Chokmah",
    sephB: "Tiphareth",
    counterchange:
      "Star takes Heh (was Tzaddi), path 15. Sign Aquarius stays, and its colours stay.",
    chakra: "Anahata (heart) \u2192 Ajna (brow) [overlay]",
    meaning:
      "Hope and cosmic grace poured out after the Tower. Renewal, inspiration, clarity from above.",
    colours: ["Violet", "Sky blue", "Bluish mauve", "White tinged purple"],
    frontPage: 11,
    backPage: 12,
  },
  {
    num: "XVIII",
    title: "The Moon",
    hebrew: ["Qoph", "Q"],
    attribution: { type: "sign", names: ["Pisces"] },
    zodiacRing: "11:30 o'clock \u00b7 345\u00b0 CW from top",
    sunDates: "~Feb 19 \u2013 Mar 21",
    path: "29",
    sephA: "Netzach",
    sephB: "Malkuth",
    chakra: "Muladhara (root) \u2192 Manipura (solar plexus) [overlay]",
    meaning:
      "The dark path; illusion, glamour, the tested threshold. Fear, dreams, the ordeal before dawn.",
    colours: [
      "Crimson (ultraviolet)",
      "Buff flecked silver-white",
      "Light pinkish brown",
      "Stone",
    ],
    frontPage: 11,
    backPage: 12,
  },
  {
    num: "XIX",
    title: "The Sun",
    hebrew: ["Resh", "R"],
    attribution: { type: "planet", names: ["Sun"] },
    path: "30",
    sephA: "Hod",
    sephB: "Yesod",
    chakra: "Svadhisthana (sacral) \u2192 Manipura (solar plexus) [overlay]",
    meaning:
      "Radiant clarity and joy; the liberated child, life fully lit. Success, vitality, glad wholeness.",
    colours: ["Orange", "Gold yellow", "Rich amber", "Amber rayed red"],
    frontPage: 11,
    backPage: 12,
  },
  {
    num: "XX",
    title: "The Aeon",
    hebrew: ["Shin", "Sh"],
    attribution: { type: "element", names: ["Fire", "Spirit"] },
    path: "31",
    sephA: "Hod",
    sephB: "Malkuth",
    chakra: "Muladhara (root) \u2192 Manipura (solar plexus) [overlay]",
    meaning:
      "Judgement and new dawn; the call into a new order. Awakening, reckoning, decisive turning.",
    colours: [
      "Glowing orange-scarlet",
      "Vermilion",
      "Scarlet flecked gold",
      "Vermilion flecked emerald",
    ],
    frontPage: 13,
    backPage: 14,
  },
  {
    num: "XXI",
    title: "The Universe",
    hebrew: ["Tau", "Th"],
    attribution: { type: "planet", names: ["Saturn", "Earth"] },
    path: "32",
    sephA: "Yesod",
    sephB: "Malkuth",
    chakra: "Muladhara (root) \u2192 Svadhisthana (sacral) [overlay]",
    meaning:
      "Completion; the dancing whole, matter perfected, the cycle closed. Fulfilment, integration, the finished work.",
    colours: ["Indigo", "Black", "Blue-black", "Black rayed blue"],
    frontPage: 13,
    backPage: 14,
  },
];

function buildTrumpCard(t: TrumpRow): ThothCard {
  const key = `trump-${t.num.toLowerCase().replace(/\s+/g, "")}-${t.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
  const facts: GTFact[] = [
    f("number", t.num),
    f("title", t.title),
    f("hebrewLetter", t.hebrew[0], {
      accept: [`${t.hebrew[0]} (${t.hebrew[1]})`, t.hebrew[1]],
    }),
    f("attribution", t.attribution.names.join(" / "), {
      accept: t.attribution.names,
    }),
    f("path", t.path),
    f("sephiraA", t.sephA),
    f("sephiraB", t.sephB),
    f("chakra", t.chakra),
    f("meaning", t.meaning),
    f("colourK", t.colours[0]),
    f("colourQ", t.colours[1]),
    f("colourP", t.colours[2]),
    f("colourPr", t.colours[3]),
  ];
  if (t.zodiacRing) facts.push(f("zodiacRing", t.zodiacRing));
  if (t.sunDates) facts.push(f("sunDates", t.sunDates));
  if (t.counterchange) facts.push(f("counterchange", t.counterchange));
  return {
    key,
    group: "trump",
    frontPage: t.frontPage,
    backPage: t.backPage,
    title: t.title,
    subtitle: t.attribution.names.join(" / "),
    facts,
  };
}

// ---------------------------------------------------------------------------
// Aces (4) — pages 13/14 (Wands), 19/20 (Cups), 23/24 (Swords), 29/30 (Disks)
// ---------------------------------------------------------------------------

interface AceRow {
  suit: string;
  element: string;
  world: string;
  meaning: string;
  frontPage: number;
  backPage: number;
}

const ACE_COLOURS: [string, string, string, string] = [
  "Brilliance",
  "White brilliance",
  "White brilliance",
  "White flecked gold",
];

const ACES: AceRow[] = [
  {
    suit: "Wands",
    element: "Fire",
    world: "Atziluth",
    meaning: "Primal energy and will; the spark of force and creation.",
    frontPage: 13,
    backPage: 14,
  },
  {
    suit: "Cups",
    element: "Water",
    world: "Briah",
    meaning: "Primal love and receptivity; the wellspring of feeling.",
    frontPage: 19,
    backPage: 20,
  },
  {
    suit: "Swords",
    element: "Air",
    world: "Yetzirah",
    meaning: "Primal mind and will-to-truth; the invoked, double-edged idea.",
    frontPage: 23,
    backPage: 24,
  },
  {
    suit: "Disks",
    element: "Earth",
    world: "Assiah",
    meaning: "Primal substance; the seed of manifestation and wealth.",
    frontPage: 29,
    backPage: 30,
  },
];

function buildAceCard(a: AceRow): ThothCard {
  return {
    key: `ace-${a.suit.toLowerCase()}`,
    group: "ace",
    frontPage: a.frontPage,
    backPage: a.backPage,
    title: `Ace of ${a.suit}`,
    subtitle: `Root of the Powers of ${a.element}`,
    facts: [
      f("title", `Root of the Powers of ${a.element}`),
      f("element", a.element),
      f("sephira", "Kether"),
      f("world", a.world),
      f("rank", "Ace — Root of the element", { accept: ["Ace", "Root"] }),
      f("chakra", "Sahasrara (crown) [overlay]"),
      f("meaning", a.meaning),
      f("colourK", ACE_COLOURS[0]),
      f("colourQ", ACE_COLOURS[1]),
      f("colourP", ACE_COLOURS[2]),
      f("colourPr", ACE_COLOURS[3]),
    ],
  };
}

// ---------------------------------------------------------------------------
// Small cards (36) — 2..10 per suit
// ---------------------------------------------------------------------------

type SuitName = "Wands" | "Cups" | "Swords" | "Disks";

const SUIT_ELEMENT: Record<SuitName, string> = {
  Wands: "Fire",
  Cups: "Water",
  Swords: "Air",
  Disks: "Earth",
};
const SUIT_WORLD: Record<SuitName, string> = {
  Wands: "Atziluth",
  Cups: "Briah",
  Swords: "Yetzirah",
  Disks: "Assiah",
};

const RANK_SEPHIRA: Record<number, string> = {
  2: "Chokmah",
  3: "Binah",
  4: "Chesed",
  5: "Geburah",
  6: "Tiphareth",
  7: "Netzach",
  8: "Hod",
  9: "Yesod",
  10: "Malkuth",
};
const RANK_WORD: Record<number, string> = {
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
  10: "Ten",
};
const RANK_SENSE: Record<number, string> = {
  2: "Will",
  3: "Understanding",
  4: "Order",
  5: "Strife",
  6: "Harmony",
  7: "Descent",
  8: "Reorganisation",
  9: "Culmination",
  10: "Completion",
};

const SMALL_COLOURS: Record<number, [string, string, string, string]> = {
  2: [
    "Soft blue",
    "Grey",
    "Bluish pearl-grey",
    "White flecked red, blue, yellow",
  ],
  3: ["Crimson", "Black", "Dark brown", "Grey flecked pink"],
  4: ["Deep violet", "Blue", "Deep purple", "Deep azure flecked yellow"],
  5: ["Orange", "Scarlet red", "Bright scarlet", "Red flecked black"],
  6: ["Clear rose-pink", "Yellow (gold)", "Rich salmon", "Gold amber"],
  7: ["Amber", "Emerald", "Bright yellow-green", "Olive flecked gold"],
  8: ["Violet-purple", "Orange", "Red-russet", "Yellow-brown flecked white"],
  9: ["Indigo", "Violet", "Very dark purple", "Citrine flecked azure"],
  10: [
    "Yellow",
    "Citrine, olive, russet, black",
    "Flecked gold",
    "Black rayed yellow",
  ],
};

interface SmallRow {
  suit: SuitName;
  rank: number;
  title: string;
  decanPlanet: string;
  decanSign: string;
  decanOrdinal: "1st" | "2nd" | "3rd";
  degRange: string;
  sunDates: string;
  zodiacRing: string;
  meaning: string;
  frontPage: number;
  backPage: number;
}

const SMALLS: SmallRow[] = [
  // Wands — pages 13/14, 15/16, 17/18
  {
    suit: "Wands",
    rank: 2,
    title: "Dominion",
    decanPlanet: "Mars",
    decanSign: "Aries",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Mar 21 \u2013 Mar 31",
    zodiacRing: "12:10 o'clock \u00b7 5\u00b0 CW from top",
    meaning: "Bold established will; energy asserting rule at its inception.",
    frontPage: 13,
    backPage: 14,
  },
  {
    suit: "Wands",
    rank: 3,
    title: "Virtue",
    decanPlanet: "Sun",
    decanSign: "Aries",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Mar 31 \u2013 Apr 10",
    zodiacRing: "12:30 o'clock \u00b7 15\u00b0 CW from top",
    meaning: "Established strength and pride; confidence in one's own power.",
    frontPage: 15,
    backPage: 16,
  },
  {
    suit: "Wands",
    rank: 4,
    title: "Completion",
    decanPlanet: "Venus",
    decanSign: "Aries",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Apr 10 \u2013 Apr 20",
    zodiacRing: "12:50 o'clock \u00b7 25\u00b0 CW from top",
    meaning: "Perfected work; harmony and settled order after effort.",
    frontPage: 15,
    backPage: 16,
  },
  {
    suit: "Wands",
    rank: 5,
    title: "Strife",
    decanPlanet: "Saturn",
    decanSign: "Leo",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Jul 23 \u2013 Aug 2",
    zodiacRing: "4:10 o'clock \u00b7 125\u00b0 CW from top",
    meaning: "Struggle and friction; a contest of forces.",
    frontPage: 15,
    backPage: 16,
  },
  {
    suit: "Wands",
    rank: 6,
    title: "Victory",
    decanPlanet: "Jupiter",
    decanSign: "Leo",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Aug 2 \u2013 Aug 12",
    zodiacRing: "4:30 o'clock \u00b7 135\u00b0 CW from top",
    meaning: "Triumph after strife; balanced success and recognition.",
    frontPage: 15,
    backPage: 16,
  },
  {
    suit: "Wands",
    rank: 7,
    title: "Valour",
    decanPlanet: "Mars",
    decanSign: "Leo",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Aug 12 \u2013 Aug 23",
    zodiacRing: "4:50 o'clock \u00b7 145\u00b0 CW from top",
    meaning: "Courage against odds; holding ground under pressure.",
    frontPage: 17,
    backPage: 18,
  },
  {
    suit: "Wands",
    rank: 8,
    title: "Swiftness",
    decanPlanet: "Mercury",
    decanSign: "Sagittarius",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Nov 22 \u2013 Dec 2",
    zodiacRing: "8:10 o'clock \u00b7 245\u00b0 CW from top",
    meaning: "Energy released — speed, sudden communication, the arrow loosed.",
    frontPage: 17,
    backPage: 18,
  },
  {
    suit: "Wands",
    rank: 9,
    title: "Strength",
    decanPlanet: "Moon",
    decanSign: "Sagittarius",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Dec 2 \u2013 Dec 12",
    zodiacRing: "8:30 o'clock \u00b7 255\u00b0 CW from top",
    meaning: "Force in reserve; tested resilience, power steadied.",
    frontPage: 17,
    backPage: 18,
  },
  {
    suit: "Wands",
    rank: 10,
    title: "Oppression",
    decanPlanet: "Saturn",
    decanSign: "Sagittarius",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Dec 12 \u2013 Dec 22",
    zodiacRing: "8:50 o'clock \u00b7 265\u00b0 CW from top",
    meaning: "Force overloaded and cruel; the burden of overextended power.",
    frontPage: 17,
    backPage: 18,
  },
  // Cups — pages 19/20, 21/22, 23/24
  {
    suit: "Cups",
    rank: 2,
    title: "Love",
    decanPlanet: "Venus",
    decanSign: "Cancer",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Jun 21 \u2013 Jul 1",
    zodiacRing: "3:10 o'clock \u00b7 95\u00b0 CW from top",
    meaning: "Harmonious union of feeling; mutual affection.",
    frontPage: 19,
    backPage: 20,
  },
  {
    suit: "Cups",
    rank: 3,
    title: "Abundance",
    decanPlanet: "Mercury",
    decanSign: "Cancer",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Jul 1 \u2013 Jul 12",
    zodiacRing: "3:30 o'clock \u00b7 105\u00b0 CW from top",
    meaning: "Overflowing plenty; joy and generous flow.",
    frontPage: 19,
    backPage: 20,
  },
  {
    suit: "Cups",
    rank: 4,
    title: "Luxury",
    decanPlanet: "Moon",
    decanSign: "Cancer",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Jul 12 \u2013 Jul 23",
    zodiacRing: "3:50 o'clock \u00b7 115\u00b0 CW from top",
    meaning: "Pleasure tipping toward ease, comfort and stagnation.",
    frontPage: 19,
    backPage: 20,
  },
  {
    suit: "Cups",
    rank: 5,
    title: "Disappointment",
    decanPlanet: "Mars",
    decanSign: "Scorpio",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Oct 23 \u2013 Nov 2",
    zodiacRing: "7:10 o'clock \u00b7 215\u00b0 CW from top",
    meaning: "Soured expectation; the loss of pleasure.",
    frontPage: 21,
    backPage: 22,
  },
  {
    suit: "Cups",
    rank: 6,
    title: "Pleasure",
    decanPlanet: "Sun",
    decanSign: "Scorpio",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Nov 2 \u2013 Nov 12",
    zodiacRing: "7:30 o'clock \u00b7 225\u00b0 CW from top",
    meaning: "Well-being and delight — harmonious, if fleeting, enjoyment.",
    frontPage: 21,
    backPage: 22,
  },
  {
    suit: "Cups",
    rank: 7,
    title: "Debauch",
    decanPlanet: "Venus",
    decanSign: "Scorpio",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Nov 12 \u2013 Nov 22",
    zodiacRing: "7:50 o'clock \u00b7 235\u00b0 CW from top",
    meaning: "Corrupted pleasure; dissipation and toxic indulgence.",
    frontPage: 21,
    backPage: 22,
  },
  {
    suit: "Cups",
    rank: 8,
    title: "Indolence",
    decanPlanet: "Saturn",
    decanSign: "Pisces",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Feb 19 \u2013 Mar 1",
    zodiacRing: "11:10 o'clock \u00b7 335\u00b0 CW from top",
    meaning: "Emotional withdrawal; satisfaction abandoned, a drifting away.",
    frontPage: 21,
    backPage: 22,
  },
  {
    suit: "Cups",
    rank: 9,
    title: "Happiness",
    decanPlanet: "Jupiter",
    decanSign: "Pisces",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Mar 1 \u2013 Mar 11",
    zodiacRing: "11:30 o'clock \u00b7 345\u00b0 CW from top",
    meaning: "Fulfilled feeling and contentment — the classic 'wish' card.",
    frontPage: 23,
    backPage: 24,
  },
  {
    suit: "Cups",
    rank: 10,
    title: "Satiety",
    decanPlanet: "Mars",
    decanSign: "Pisces",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Mar 11 \u2013 Mar 21",
    zodiacRing: "11:50 o'clock \u00b7 355\u00b0 CW from top",
    meaning: "Emotional overflow spent; perfection too full to last.",
    frontPage: 23,
    backPage: 24,
  },
  // Swords — pages 23/24, 25/26, 27/28
  {
    suit: "Swords",
    rank: 2,
    title: "Peace",
    decanPlanet: "Moon",
    decanSign: "Libra",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Sep 23 \u2013 Oct 3",
    zodiacRing: "6:10 o'clock \u00b7 185\u00b0 CW from top",
    meaning: "Tension resolved into truce; balance restored.",
    frontPage: 23,
    backPage: 24,
  },
  {
    suit: "Swords",
    rank: 3,
    title: "Sorrow",
    decanPlanet: "Saturn",
    decanSign: "Libra",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Oct 3 \u2013 Oct 13",
    zodiacRing: "6:30 o'clock \u00b7 195\u00b0 CW from top",
    meaning: "Grief; the heart pierced, a clear and sorrowful cut.",
    frontPage: 25,
    backPage: 26,
  },
  {
    suit: "Swords",
    rank: 4,
    title: "Truce",
    decanPlanet: "Jupiter",
    decanSign: "Libra",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Oct 13 \u2013 Oct 23",
    zodiacRing: "6:50 o'clock \u00b7 205\u00b0 CW from top",
    meaning: "Rest from conflict; ideas settled, an armistice.",
    frontPage: 25,
    backPage: 26,
  },
  {
    suit: "Swords",
    rank: 5,
    title: "Defeat",
    decanPlanet: "Venus",
    decanSign: "Aquarius",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Jan 20 \u2013 Jan 30",
    zodiacRing: "10:10 o'clock \u00b7 305\u00b0 CW from top",
    meaning: "Loss through weakness; effort undermined.",
    frontPage: 25,
    backPage: 26,
  },
  {
    suit: "Swords",
    rank: 6,
    title: "Science",
    decanPlanet: "Mercury",
    decanSign: "Aquarius",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Jan 30 \u2013 Feb 9",
    zodiacRing: "10:30 o'clock \u00b7 315\u00b0 CW from top",
    meaning: "Intellect balanced and effective; the skilled solution.",
    frontPage: 25,
    backPage: 26,
  },
  {
    suit: "Swords",
    rank: 7,
    title: "Futility",
    decanPlanet: "Moon",
    decanSign: "Aquarius",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Feb 9 \u2013 Feb 19",
    zodiacRing: "10:50 o'clock \u00b7 325\u00b0 CW from top",
    meaning: "Vacillation and partial effort; unstable striving.",
    frontPage: 27,
    backPage: 28,
  },
  {
    suit: "Swords",
    rank: 8,
    title: "Interference",
    decanPlanet: "Jupiter",
    decanSign: "Gemini",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~May 21 \u2013 May 31",
    zodiacRing: "2:10 o'clock \u00b7 65\u00b0 CW from top",
    meaning: "Good intentions blocked; hemmed in by too many restrictions.",
    frontPage: 27,
    backPage: 28,
  },
  {
    suit: "Swords",
    rank: 9,
    title: "Cruelty",
    decanPlanet: "Mars",
    decanSign: "Gemini",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~May 31 \u2013 Jun 10",
    zodiacRing: "2:30 o'clock \u00b7 75\u00b0 CW from top",
    meaning: "Mental anguish; the savagery of thought, despair.",
    frontPage: 27,
    backPage: 28,
  },
  {
    suit: "Swords",
    rank: 10,
    title: "Ruin",
    decanPlanet: "Sun",
    decanSign: "Gemini",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Jun 10 \u2013 Jun 21",
    zodiacRing: "2:50 o'clock \u00b7 85\u00b0 CW from top",
    meaning: "The mind wrecked — collapse, yet the low point that ends it.",
    frontPage: 27,
    backPage: 28,
  },
  // Disks — pages 29/30, 31/32, 33/34
  {
    suit: "Disks",
    rank: 2,
    title: "Change",
    decanPlanet: "Jupiter",
    decanSign: "Capricorn",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Dec 22 \u2013 Dec 31",
    zodiacRing: "9:10 o'clock \u00b7 275\u00b0 CW from top",
    meaning: "Flux in the material; harmony held within ceaseless change.",
    frontPage: 29,
    backPage: 30,
  },
  {
    suit: "Disks",
    rank: 3,
    title: "Works",
    decanPlanet: "Mars",
    decanSign: "Capricorn",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Dec 31 \u2013 Jan 10",
    zodiacRing: "9:30 o'clock \u00b7 285\u00b0 CW from top",
    meaning: "Constructive labour; skilled building, the foundation laid.",
    frontPage: 29,
    backPage: 30,
  },
  {
    suit: "Disks",
    rank: 4,
    title: "Power",
    decanPlanet: "Sun",
    decanSign: "Capricorn",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Jan 10 \u2013 Jan 20",
    zodiacRing: "9:50 o'clock \u00b7 295\u00b0 CW from top",
    meaning:
      "Established order and control; stability that turns rigid if clung to.",
    frontPage: 29,
    backPage: 30,
  },
  {
    suit: "Disks",
    rank: 5,
    title: "Worry",
    decanPlanet: "Mercury",
    decanSign: "Taurus",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Apr 20 \u2013 Apr 30",
    zodiacRing: "1:10 o'clock \u00b7 35\u00b0 CW from top",
    meaning: "Material strain and anxiety; disorder in the physical.",
    frontPage: 31,
    backPage: 32,
  },
  {
    suit: "Disks",
    rank: 6,
    title: "Success",
    decanPlanet: "Moon",
    decanSign: "Taurus",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Apr 30 \u2013 May 10",
    zodiacRing: "1:30 o'clock \u00b7 45\u00b0 CW from top",
    meaning: "Material accomplishment in balance; prosperity flowing.",
    frontPage: 31,
    backPage: 32,
  },
  {
    suit: "Disks",
    rank: 7,
    title: "Failure",
    decanPlanet: "Saturn",
    decanSign: "Taurus",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~May 10 \u2013 May 21",
    zodiacRing: "1:50 o'clock \u00b7 55\u00b0 CW from top",
    meaning: "Blighted effort; unprofitable labour, fear of loss.",
    frontPage: 31,
    backPage: 32,
  },
  {
    suit: "Disks",
    rank: 8,
    title: "Prudence",
    decanPlanet: "Sun",
    decanSign: "Virgo",
    decanOrdinal: "1st",
    degRange: "0\u201310\u00b0",
    sunDates: "~Aug 23 \u2013 Sep 2",
    zodiacRing: "5:10 o'clock \u00b7 155\u00b0 CW from top",
    meaning: "Careful cultivation; patient increase and husbandry.",
    frontPage: 31,
    backPage: 32,
  },
  {
    suit: "Disks",
    rank: 9,
    title: "Gain",
    decanPlanet: "Venus",
    decanSign: "Virgo",
    decanOrdinal: "2nd",
    degRange: "10\u201320\u00b0",
    sunDates: "~Sep 2 \u2013 Sep 12",
    zodiacRing: "5:30 o'clock \u00b7 165\u00b0 CW from top",
    meaning: "Material good fortune; tangible, well-earned increase.",
    frontPage: 33,
    backPage: 34,
  },
  {
    suit: "Disks",
    rank: 10,
    title: "Wealth",
    decanPlanet: "Mercury",
    decanSign: "Virgo",
    decanOrdinal: "3rd",
    degRange: "20\u201330\u00b0",
    sunDates: "~Sep 12 \u2013 Sep 23",
    zodiacRing: "5:50 o'clock \u00b7 175\u00b0 CW from top",
    meaning: "Completed prosperity — wealth, though inert if merely hoarded.",
    frontPage: 33,
    backPage: 34,
  },
];

function buildSmallCard(s: SmallRow): ThothCard {
  const sephira = RANK_SEPHIRA[s.rank];
  const colours = SMALL_COLOURS[s.rank];
  return {
    key: `${s.suit.toLowerCase()}-${String(s.rank).padStart(2, "0")}`,
    group: "small",
    frontPage: s.frontPage,
    backPage: s.backPage,
    title: s.title,
    subtitle: `${s.rank} of ${s.suit}`,
    facts: [
      f("title", s.title),
      f("decanPlanet", s.decanPlanet),
      f("decanSign", s.decanSign),
      f("decanOrdinal", s.decanOrdinal, {
        accept: [`${s.decanOrdinal} decan`],
      }),
      f("sunDates", s.sunDates),
      f("zodiacRing", s.zodiacRing),
      f("sephira", sephira),
      f("world", SUIT_WORLD[s.suit]),
      f(
        "rank",
        `${RANK_WORD[s.rank]} \u2014 ${RANK_SENSE[s.rank]} (${sephira})`,
        { accept: [RANK_WORD[s.rank], String(s.rank), RANK_SENSE[s.rank]] },
      ),
      f("chakra", smallChakra(s.rank)),
      f("meaning", s.meaning),
      f("colourK", colours[0]),
      f("colourQ", colours[1]),
      f("colourP", colours[2]),
      f("colourPr", colours[3]),
    ],
  };
}

// Middle-pillar chakra mapping by rank (verbatim per-card from the deck)
function smallChakra(rank: number): string {
  const map: Record<number, string> = {
    2: "Ajna (brow) [overlay]",
    3: "Ajna (brow) [overlay]",
    4: "Vishuddha (throat) [overlay]",
    5: "Vishuddha (throat) [overlay]",
    6: "Anahata (heart) [overlay]",
    7: "Manipura (solar plexus) [overlay]",
    8: "Manipura (solar plexus) [overlay]",
    9: "Svadhisthana (sacral) [overlay]",
    10: "Muladhara (root) [overlay]",
  };
  return map[rank];
}

// ---------------------------------------------------------------------------
// Court cards (16)
// ---------------------------------------------------------------------------

type CourtRank = "Knight" | "Queen" | "Prince" | "Princess";

const COURT_TREE_LETTER: Record<CourtRank, string> = {
  Knight: "Yod",
  Queen: "Heh",
  Prince: "Vau",
  Princess: "Heh (final)",
};
const COURT_SEPHIRA: Record<CourtRank, string> = {
  Knight: "Chokmah",
  Queen: "Binah",
  Prince: "Tiphareth",
  Princess: "Malkuth",
};
const COURT_CHAKRA: Record<CourtRank, string> = {
  Knight: "Ajna (brow) [overlay]",
  Queen: "Ajna (brow) [overlay]",
  Prince: "Anahata (heart) [overlay]",
  Princess: "Muladhara (root) [overlay]",
};
const COURT_COLOURS: Record<CourtRank, [string, string, string, string]> = {
  Knight: [
    "Soft blue",
    "Grey",
    "Bluish pearl-grey",
    "White flecked red, blue, yellow",
  ],
  Queen: ["Crimson", "Black", "Dark brown", "Grey flecked pink"],
  Prince: ["Clear rose-pink", "Yellow (gold)", "Rich salmon", "Gold amber"],
  Princess: [
    "Yellow",
    "Citrine, olive, russet, black",
    "Flecked gold",
    "Black rayed yellow",
  ],
};

interface CourtRow {
  suit: SuitName;
  rank: CourtRank;
  spanLo: string;
  spanHi: string;
  sunDates?: string;
  cusp?: string;
  zodiacRing?: string;
  meaning: string;
  frontPage: number;
  backPage: number;
}

const COURTS: CourtRow[] = [
  {
    suit: "Wands",
    rank: "Knight",
    spanLo: "20\u00b0 Scorpio",
    spanHi: "20\u00b0 Sagittarius",
    sunDates: "~Nov 12 \u2013 Dec 12",
    cusp: "Sagittarius begins ~Nov 22",
    zodiacRing: "8:10 o'clock \u00b7 245\u00b0 CW from top",
    meaning:
      "Swift, ardent, impetuous — acts and moves on. Generous and proud; sudden.",
    frontPage: 33,
    backPage: 34,
  },
  {
    suit: "Wands",
    rank: "Queen",
    spanLo: "20\u00b0 Pisces",
    spanHi: "20\u00b0 Aries",
    sunDates: "~Mar 11 \u2013 Apr 10",
    cusp: "Aries begins ~Mar 21",
    zodiacRing: "12:10 o'clock \u00b7 5\u00b0 CW from top",
    meaning: "Steady authority and warmth; commanding, adaptable, magnetic.",
    frontPage: 33,
    backPage: 34,
  },
  {
    suit: "Wands",
    rank: "Prince",
    spanLo: "20\u00b0 Cancer",
    spanHi: "20\u00b0 Leo",
    sunDates: "~Jul 12 \u2013 Aug 12",
    cusp: "Leo begins ~Jul 23",
    zodiacRing: "4:10 o'clock \u00b7 125\u00b0 CW from top",
    meaning:
      "Willful and brilliant, at times cruel; swift intellect fused with fiery purpose.",
    frontPage: 35,
    backPage: 36,
  },
  {
    suit: "Wands",
    rank: "Princess",
    spanLo: "",
    spanHi: "",
    meaning:
      "Fierce, ardent, individual — the fuel of fire; brave, and vengeful if roused.",
    frontPage: 35,
    backPage: 36,
  },
  {
    suit: "Cups",
    rank: "Knight",
    spanLo: "20\u00b0 Aquarius",
    spanHi: "20\u00b0 Pisces",
    sunDates: "~Feb 9 \u2013 Mar 11",
    cusp: "Pisces begins ~Feb 19",
    zodiacRing: "11:10 o'clock \u00b7 335\u00b0 CW from top",
    meaning:
      "Active, graceful, passionate — the romantic mover; amiable but shallow if unrooted.",
    frontPage: 35,
    backPage: 36,
  },
  {
    suit: "Cups",
    rank: "Queen",
    spanLo: "20\u00b0 Gemini",
    spanHi: "20\u00b0 Cancer",
    sunDates: "~Jun 10 \u2013 Jul 12",
    cusp: "Cancer begins ~Jun 21",
    zodiacRing: "3:10 o'clock \u00b7 95\u00b0 CW from top",
    meaning:
      "Deep receptivity and reflection; a tranquil mirror, dreamy and impressionable.",
    frontPage: 35,
    backPage: 36,
  },
  {
    suit: "Cups",
    rank: "Prince",
    spanLo: "20\u00b0 Libra",
    spanHi: "20\u00b0 Scorpio",
    sunDates: "~Oct 13 \u2013 Nov 12",
    cusp: "Scorpio begins ~Oct 23",
    zodiacRing: "7:10 o'clock \u00b7 215\u00b0 CW from top",
    meaning:
      "Subtle, artistic, intense; a calm surface over powerful hidden currents; secretive.",
    frontPage: 37,
    backPage: 38,
  },
  {
    suit: "Cups",
    rank: "Princess",
    spanLo: "",
    spanHi: "",
    meaning:
      "Sweet, gentle, romantic — the crystallization of water; tender and gracious.",
    frontPage: 37,
    backPage: 38,
  },
  {
    suit: "Swords",
    rank: "Knight",
    spanLo: "20\u00b0 Taurus",
    spanHi: "20\u00b0 Gemini",
    sunDates: "~May 10 \u2013 Jun 10",
    cusp: "Gemini begins ~May 21",
    zodiacRing: "2:10 o'clock \u00b7 65\u00b0 CW from top",
    meaning:
      "Fierce, skillful, incisive — the mind as a rushing blade; decisive, sometimes reckless.",
    frontPage: 37,
    backPage: 38,
  },
  {
    suit: "Swords",
    rank: "Queen",
    spanLo: "20\u00b0 Virgo",
    spanHi: "20\u00b0 Libra",
    sunDates: "~Sep 12 \u2013 Oct 13",
    cusp: "Libra begins ~Sep 23",
    zodiacRing: "6:10 o'clock \u00b7 185\u00b0 CW from top",
    meaning:
      "Keen perception, clarity, wit; graceful and just — or cold and cruel.",
    frontPage: 37,
    backPage: 38,
  },
  {
    suit: "Swords",
    rank: "Prince",
    spanLo: "20\u00b0 Capricorn",
    spanHi: "20\u00b0 Aquarius",
    sunDates: "~Jan 10 \u2013 Feb 9",
    cusp: "Aquarius begins ~Jan 20",
    zodiacRing: "10:10 o'clock \u00b7 305\u00b0 CW from top",
    meaning:
      "Brilliant and abstract but unstable; endless analysis, weak in follow-through.",
    frontPage: 39,
    backPage: 40,
  },
  {
    suit: "Swords",
    rank: "Princess",
    spanLo: "",
    spanHi: "",
    meaning:
      "Practical wisdom in conflict; keen, vigilant, avenging; cunning if turned.",
    frontPage: 39,
    backPage: 40,
  },
  {
    suit: "Disks",
    rank: "Knight",
    spanLo: "20\u00b0 Leo",
    spanHi: "20\u00b0 Virgo",
    sunDates: "~Aug 12 \u2013 Sep 12",
    cusp: "Virgo begins ~Aug 23",
    zodiacRing: "5:10 o'clock \u00b7 155\u00b0 CW from top",
    meaning:
      "Laborious, patient, dependable — the steady worker; dull but productive.",
    frontPage: 39,
    backPage: 40,
  },
  {
    suit: "Disks",
    rank: "Queen",
    spanLo: "20\u00b0 Sagittarius",
    spanHi: "20\u00b0 Capricorn",
    sunDates: "~Dec 12 \u2013 Jan 10",
    cusp: "Capricorn begins ~Dec 22",
    zodiacRing: "9:10 o'clock \u00b7 275\u00b0 CW from top",
    meaning:
      "Nurturing, sensual, quietly ambitious in practical things; fertile and powerful.",
    frontPage: 39,
    backPage: 40,
  },
  {
    suit: "Disks",
    rank: "Prince",
    spanLo: "20\u00b0 Aries",
    spanHi: "20\u00b0 Taurus",
    sunDates: "~Apr 10 \u2013 May 10",
    cusp: "Taurus begins ~Apr 20",
    zodiacRing: "1:10 o'clock \u00b7 35\u00b0 CW from top",
    meaning:
      "Competent, deliberate, enduring; energy patiently applied to matter.",
    frontPage: 41,
    backPage: 42,
  },
  {
    suit: "Disks",
    rank: "Princess",
    spanLo: "",
    spanHi: "",
    meaning:
      "The pregnant threshold of manifestation; generous, careful, bringing things to birth.",
    frontPage: 41,
    backPage: 42,
  },
];

function buildCourtCard(c: CourtRow): ThothCard {
  const rankElement: Record<CourtRank, string> = {
    Knight: "Fire",
    Queen: "Water",
    Prince: "Air",
    Princess: "Earth",
  };
  const combo = `${rankElement[c.rank]} of ${SUIT_ELEMENT[c.suit]}`;
  const colours = COURT_COLOURS[c.rank];
  const facts: GTFact[] = [
    f("title", `${c.rank} of ${c.suit}`),
    f("element", combo),
    f("treeLetter", COURT_TREE_LETTER[c.rank]),
    f("sephira", COURT_SEPHIRA[c.rank]),
    f("world", SUIT_WORLD[c.suit]),
    f("rank", c.rank),
    f("chakra", COURT_CHAKRA[c.rank]),
    f("meaning", c.meaning),
    f("colourK", colours[0]),
    f("colourQ", colours[1]),
    f("colourP", colours[2]),
    f("colourPr", colours[3]),
  ];
  if (c.rank === "Princess") {
    facts.push(
      f(
        "rules",
        "A quadrant of the heavens (around the N. Pole); Throne of the Ace",
        {
          accept: [`Throne of the Ace of ${c.suit}`],
        },
      ),
    );
  } else {
    facts.push(f("zodiacSpan", `${c.spanLo} \u2013 ${c.spanHi}`));
    facts.push(f("sunDates", c.sunDates!));
    facts.push(f("cusp", c.cusp!));
    facts.push(f("zodiacRing", c.zodiacRing!));
  }
  return {
    key: `court-${c.suit.toLowerCase()}-${c.rank.toLowerCase()}`,
    group: "court",
    frontPage: c.frontPage,
    backPage: c.backPage,
    title: `${c.rank} of ${c.suit}`,
    subtitle: combo,
    facts,
  };
}

// ---------------------------------------------------------------------------
// Reference cards (22, incl. 4 glossary cards) — high-value enumerated facts
// ---------------------------------------------------------------------------

interface ReferenceRow {
  key: string;
  title: string;
  frontPage: number;
  backPage: number;
  facts: GTFact[];
}

const REFERENCE: ReferenceRow[] = [
  {
    key: "ref-reading-these-cards",
    title: "Reading These Cards",
    frontPage: 41,
    backPage: 42,
    facts: [
      f(
        "colourScales",
        "King (path/Atziluth), Queen (Sephira/Briah), Prince (Yetzirah), Princess (Assiah)",
      ),
      f(
        "overlayNote",
        "[overlay] marks the chakra — a modern add-on, not in Crowley.",
      ),
      f("zodiacRingDefinition", "0\u00b0 Aries at the top, going clockwise"),
    ],
  },
  {
    key: "ref-four-suits-worlds",
    title: "The Four Suits & Worlds",
    frontPage: 41,
    backPage: 42,
    facts: [
      f(
        "wandsMapping",
        "Wands \u00b7 Fire \u00b7 Atziluth (Archetypal / Will) \u00b7 Yod",
      ),
      f(
        "cupsMapping",
        "Cups \u00b7 Water \u00b7 Briah (Creative / feeling) \u00b7 Heh",
      ),
      f(
        "swordsMapping",
        "Swords \u00b7 Air \u00b7 Yetzirah (Formative / mind) \u00b7 Vau",
      ),
      f(
        "disksMapping",
        "Disks \u00b7 Earth \u00b7 Assiah (Material / body) \u00b7 final Heh",
      ),
      f("tetragrammatonLetters", "\u05D9\u05D4\u05D5\u05D4 (YHVH)", {
        accept: ["YHVH", "Yod Heh Vau Heh"],
        sourceDefect: true,
      }),
    ],
  },
  {
    key: "ref-numbers-tree",
    title: "Numbers & the Tree",
    frontPage: 43,
    backPage: 44,
    facts: [
      f(
        "rankSequence",
        "Ace root/seed, 2 will (Chokmah), 3 form (Binah), 4 order (Chesed), 5 strife (Geburah), 6 harmony (Tiphareth), 7 descent (Netzach), 8 re-order (Hod), 9 culmination (Yesod), 10 completion (Malkuth)",
      ),
      f(
        "forceCurve",
        "Force is purest at Ace\u20132, balanced at 6, fully manifest (inert) at 10.",
      ),
    ],
  },
  {
    key: "ref-sephiroth",
    title: "The Sephiroth",
    frontPage: 43,
    backPage: 44,
    facts: [
      f(
        "sephirothList",
        "1 Kether, 2 Chokmah, 3 Binah, 4 Chesed, 5 Geburah, 6 Tiphareth, 7 Netzach, 8 Hod, 9 Yesod, 10 Malkuth",
      ),
      f(
        "pillars",
        "Severity (3,5,8) \u00b7 Mercy (2,4,7) \u00b7 Middle (1,6,9,10)",
      ),
    ],
  },
  {
    key: "ref-court-family",
    title: "The Court Family",
    frontPage: 43,
    backPage: 44,
    facts: [
      f("knightDescription", "Knight — Fire/Yod/Chokmah — rushing father"),
      f("queenDescription", "Queen — Water/Heh/Binah — enthroned mother"),
      f("princeDescription", "Prince — Air/Vau/Tiphareth — active son"),
      f(
        "princessDescription",
        "Princess — Earth/final-Heh/Malkuth — throne of the Ace",
      ),
      f("princessDateRule", "Princesses have no date span — read by element."),
    ],
  },
  {
    key: "ref-court-person-force-idea",
    title: "Court: Person, Force, or Idea?",
    frontPage: 43,
    backPage: 44,
    facts: [
      f(
        "ruleQuerent",
        "The querent (or part of their character) — if it's the significator or tightly bound to it.",
      ),
      f(
        "ruleForce",
        "A force / event outside their control — if ringed by pips: the elemental energy acting, not a person.",
      ),
      f(
        "ruleArchetype",
        "An archetypal problem — if dignified by a Trump, which supplies the archetype.",
      ),
    ],
  },
  {
    key: "ref-significator",
    title: "The Significator (Crowley)",
    frontPage: 45,
    backPage: 46,
    facts: [
      f("packYod", "Yod = work/energy"),
      f("packHeh", "Heh = love/emotion"),
      f("packVau", "Vau = trouble/strife"),
      f("packFinalHeh", "final Heh = money/business"),
    ],
  },
  {
    key: "ref-elemental-dignities",
    title: "Elemental Dignities",
    frontPage: 45,
    backPage: 46,
    facts: [
      f(
        "friendlyPairs",
        "Fire & Air are friendly; Water & Earth are friendly.",
      ),
      f(
        "contraryPairs",
        "Fire\u2013Water and Air\u2013Earth are contrary and weaken each other; same element reinforces.",
      ),
      f(
        "welldignified",
        "Flanked by friends \u2192 well-dignified (strengthened).",
      ),
      f(
        "illdignified",
        "Flanked by contraries \u2192 ill-dignified (afflicted, obstructed).",
      ),
    ],
  },
  {
    key: "ref-glyphs",
    title: "Glyphs — all symbols",
    frontPage: 45,
    backPage: 46,
    facts: [
      f(
        "elementGlyphs",
        "Fire \u25B3 \u00b7 Water \u25BD \u00b7 Air \u25B3\u0335 \u00b7 Earth \u25BD\u0335 \u00b7 Spirit \u2295",
      ),
      f(
        "worldsOrder",
        "Atziluth \u00b7 Briah \u00b7 Yetzirah \u00b7 Assiah (Fire\u2192Earth)",
      ),
    ],
  },
  {
    key: "ref-planets",
    title: "The Planets",
    frontPage: 45,
    backPage: 46,
    facts: Object.entries(PLANETS).map(([name, gloss]) =>
      f(`planet-${name.toLowerCase()}`, `${name} \u2014 ${gloss}`),
    ),
  },
  {
    key: "ref-signs",
    title: "The Signs",
    frontPage: 47,
    backPage: 48,
    facts: Object.entries(SIGNS).map(([name, gloss]) =>
      f(`sign-${name.toLowerCase()}`, `${name} \u2014 ${gloss}`),
    ),
  },
  {
    key: "ref-elements",
    title: "The Elements",
    frontPage: 47,
    backPage: 48,
    facts: Object.entries(ELEMENTS).map(([name, gloss]) =>
      f(`element-${name.toLowerCase()}`, `${name} \u2014 ${gloss}`),
    ),
  },
  {
    key: "ref-four-worlds",
    title: "The Four Worlds (Planes)",
    frontPage: 47,
    backPage: 48,
    facts: [
      ...Object.entries(WORLDS).map(([name, gloss]) =>
        f(`world-${name.toLowerCase()}`, `${name} \u2014 ${gloss}`),
      ),
      f(
        "suitWorldClimb",
        "Wands\u2192Atziluth, Cups\u2192Briah, Swords\u2192Yetzirah, Disks\u2192Assiah",
      ),
    ],
  },
  {
    key: "ref-36-decans",
    title: "The 36 Decans",
    frontPage: 47,
    backPage: 48,
    facts: [
      f("chaldeanOrder", "Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon"),
      f(
        "chaldeanStart",
        "cycling from Mars on the 1st decan of Aries (2 of Wands)",
      ),
      f(
        "suitByElement",
        "Fire signs \u2192 Wands, Water \u2192 Cups, Air \u2192 Swords, Earth \u2192 Disks",
      ),
    ],
  },
  {
    key: "ref-trumps-paths-counterchange",
    title: "Trumps as Paths + counterchange",
    frontPage: 49,
    backPage: 50,
    facts: [
      f("pathRange", "paths 11\u201332 = Aleph\u2013Tau"),
      f("counterchangeEmperor", "Emperor takes Tzaddi, path 28"),
      f("counterchangeStar", "Star takes Heh, path 15"),
      f(
        "counterchangeSignsStay",
        "the two swap letters and paths, but keep their signs (Aries, Aquarius) — so their colours do not move",
      ),
      f("counterchangeQuote", "\u201cTzaddi is not the Star.\u201d (AL I.57)"),
    ],
  },
  {
    key: "ref-colour-scales",
    title: "The Colour Scales",
    frontPage: 49,
    backPage: 50,
    facts: [
      f("kingScale", "King — Atziluth; for paths/letters."),
      f(
        "queenScale",
        "Queen — Briah; the usual Sephira colour (the pips take these).",
      ),
      f("princeScale", "Prince — Yetzirah."),
      f(
        "princessScale",
        "Princess — Assiah; often flecked/rayed, the most material.",
      ),
    ],
  },
  {
    key: "ref-chakras-overlay",
    title: "Chakras — a modern overlay",
    frontPage: 49,
    backPage: 50,
    facts: [
      f(
        "chakraSourceClaim",
        "Crowley names only the Brahmarandra (crown) chakra once — on the Fool — and uses lotus imagery throughout; there is no per-card chakra table in the Book of Thoth.",
      ),
      f(
        "chakraTreeMapping",
        "Kether\u2192crown, Chokmah/Binah\u2192brow, Chesed/Geburah\u2192throat, Tiphareth\u2192heart, Netzach/Hod\u2192solar plexus, Yesod\u2192sacral, Malkuth\u2192root",
      ),
    ],
  },
  {
    key: "ref-zodiac-ring-transitions",
    title: "Zodiac Ring & Transitions",
    frontPage: 49,
    backPage: 50,
    facts: [
      f("ringOrigin", "0\u00b0 Aries at the top, going clockwise."),
      f(
        "signDegrees",
        "Each sign = 30\u00b0 = one \u201chour\u201d of the ring; each decan = 10\u00b0.",
      ),
      f(
        "courtSpan",
        "Courts span 20\u00b0\u201320\u00b0, so each crosses one cusp.",
      ),
    ],
  },
  {
    key: "ref-glossary-qabalah",
    title: "Glossary — Qabalah & the Tree",
    frontPage: 51,
    backPage: 52,
    facts: GLOSSARY.slice(0, 9).map(([term, def]) =>
      f(`glossary-${term.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, def),
    ),
  },
  {
    key: "ref-glossary-astrology",
    title: "Glossary — Astrology & time",
    frontPage: 51,
    backPage: 52,
    facts: GLOSSARY.slice(9, 21).map(([term, def]) =>
      f(`glossary-${term.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, def),
    ),
  },
  {
    key: "ref-glossary-tarot",
    title: "Glossary — Tarot & reading",
    frontPage: 51,
    backPage: 52,
    facts: GLOSSARY.slice(21, 34).map(([term, def]) =>
      f(`glossary-${term.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, def),
    ),
  },
  {
    key: "ref-glossary-colour-chakra",
    title: "Glossary — Colour, chakra & symbols",
    frontPage: 51,
    backPage: 52,
    facts: GLOSSARY.slice(34, 40).map(([term, def]) =>
      f(`glossary-${term.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, def),
    ),
  },
];

function buildReferenceCard(r: ReferenceRow): ThothCard {
  return {
    key: r.key,
    group: "reference",
    frontPage: r.frontPage,
    backPage: r.backPage,
    title: r.title,
    subtitle: "reference",
    facts: r.facts,
  };
}

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------

const cards: ThothCard[] = [
  ...TRUMPS.map(buildTrumpCard),
  ...ACES.map(buildAceCard),
  ...SMALLS.map(buildSmallCard),
  ...COURTS.map(buildCourtCard),
  ...REFERENCE.map(buildReferenceCard),
];

if (cards.length !== 100) {
  throw new Error(`Expected 100 cards, built ${cards.length}`);
}

const vocabulary: GTVocab[] = [
  ...GLOSSARY.map(([term, def]) => ({
    term,
    set: "glossary" as const,
    definition: def,
  })),
  ...OTHER_TERMS.map(([term, def]) => ({
    term,
    set: "other" as const,
    definition: def,
  })),
  ...Object.entries(SEPHIROTH).map(([term, def]) => ({
    term,
    set: "sephiroth" as const,
    definition: def,
  })),
  ...Object.entries(WORLDS).map(([term, def]) => ({
    term,
    set: "worlds" as const,
    definition: def,
  })),
  ...Object.entries(PLANETS).map(([term, def]) => ({
    term,
    set: "planets" as const,
    definition: def,
  })),
  ...Object.entries(SIGNS).map(([term, def]) => ({
    term,
    set: "signs" as const,
    definition: def,
  })),
  ...Object.entries(ELEMENTS).map(([term, def]) => ({
    term,
    set: "elements" as const,
    definition: def,
  })),
  ...HEBREW_LETTERS.map(([name, value]) => ({
    term: name,
    set: "hebrewLetters" as const,
    definition: `Hebrew letter on a Trump path (value ${value}).`,
    aliases: [`${name} (${value})`, value],
  })),
  ...Object.entries(COURT_RANKS).map(([term, def]) => ({
    term,
    set: "courtRanks" as const,
    definition: def,
  })),
  ...cards.map((c) => ({
    term: c.title,
    set: "cardTitles" as const,
    definition: c.subtitle,
  })),
];

const pageIndex: Record<number, string[]> = {};
for (let p = 1; p <= 52; p++) pageIndex[p] = [];
for (const c of cards) {
  pageIndex[c.frontPage].push(c.key);
  if (c.backPage !== c.frontPage) pageIndex[c.backPage].push(c.key);
}
// Page 1 is the cover/print-instructions sheet — not one of the 100 cards, but
// not blank either (unlike page 2). Record it under a sentinel key so page
// coverage checks still see it as accounted for.
pageIndex[1] = ["front-matter-cover-instructions"];

const rawFixture = JSON.parse(
  readFileSync(
    path.resolve("test/fixtures/thoth/raw-extracted-text.json"),
    "utf-8",
  ),
) as { sha256: string; pages: 52 };

const groundTruth: ThothGroundTruth = {
  source: {
    filename: "Thoth-Correspondence-Deck.pdf",
    pages: 52,
    sha256: rawFixture.sha256,
  },
  cards,
  vocabulary,
  pageIndex,
};

const outPath = path.resolve("test/fixtures/thoth/thoth-ground-truth.json");
writeFileSync(outPath, JSON.stringify(groundTruth, null, 2));

const factCount = cards.reduce((n, c) => n + c.facts.length, 0);
console.log(`Wrote ${outPath}`);
console.log(
  `cards: ${cards.length} (trump=${TRUMPS.length} ace=${ACES.length} small=${SMALLS.length} court=${COURTS.length} reference=${REFERENCE.length})`,
);
console.log(`facts: ${factCount}`);
console.log(`vocabulary: ${vocabulary.length}`);

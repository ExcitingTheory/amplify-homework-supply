/**
 * Multi-cultural holiday/celebration icons for custom badge creation.
 *
 * Provides a curated set of emoji-based icons covering major cultural
 * celebrations across 10+ cultures for use in the custom badge creator.
 *
 * @module holidayBadgeIcons
 */

export interface HolidayBadgeIcon {
  id: string;
  emoji: string;
  label: string;
  culture: string;
  holiday: string;
}

export const HOLIDAY_BADGE_ICONS: HolidayBadgeIcon[] = [
  // Lunar New Year (Chinese / East Asian)
  {
    id: "lunar-dragon",
    emoji: "🐉",
    label: "Dragon",
    culture: "East Asian",
    holiday: "Lunar New Year",
  },
  {
    id: "lunar-lantern",
    emoji: "🏮",
    label: "Red Lantern",
    culture: "East Asian",
    holiday: "Lunar New Year",
  },
  {
    id: "lunar-firecracker",
    emoji: "🧨",
    label: "Firecracker",
    culture: "East Asian",
    holiday: "Lunar New Year",
  },
  {
    id: "lunar-envelope",
    emoji: "🧧",
    label: "Red Envelope",
    culture: "East Asian",
    holiday: "Lunar New Year",
  },

  // Diwali (Hindu / South Asian)
  {
    id: "diwali-lamp",
    emoji: "🪔",
    label: "Diya Lamp",
    culture: "South Asian",
    holiday: "Diwali",
  },
  {
    id: "diwali-sparkler",
    emoji: "🎇",
    label: "Sparkler",
    culture: "South Asian",
    holiday: "Diwali",
  },
  {
    id: "diwali-fireworks",
    emoji: "🎆",
    label: "Fireworks",
    culture: "South Asian",
    holiday: "Diwali",
  },

  // Eid (Islamic)
  {
    id: "eid-crescent",
    emoji: "🌙",
    label: "Crescent Moon",
    culture: "Islamic",
    holiday: "Eid",
  },
  {
    id: "eid-star",
    emoji: "⭐",
    label: "Star",
    culture: "Islamic",
    holiday: "Eid",
  },
  {
    id: "eid-mosque",
    emoji: "🕌",
    label: "Mosque",
    culture: "Islamic",
    holiday: "Eid",
  },

  // Ramadan (Islamic)
  {
    id: "ramadan-moon",
    emoji: "🌛",
    label: "First Quarter Moon",
    culture: "Islamic",
    holiday: "Ramadan",
  },
  {
    id: "ramadan-dates",
    emoji: "🌴",
    label: "Date Palm",
    culture: "Islamic",
    holiday: "Ramadan",
  },

  // Hanukkah (Jewish)
  {
    id: "hanukkah-menorah",
    emoji: "🕎",
    label: "Menorah",
    culture: "Jewish",
    holiday: "Hanukkah",
  },
  {
    id: "hanukkah-star",
    emoji: "✡️",
    label: "Star of David",
    culture: "Jewish",
    holiday: "Hanukkah",
  },
  {
    id: "hanukkah-dreidel",
    emoji: "🪩",
    label: "Dreidel",
    culture: "Jewish",
    holiday: "Hanukkah",
  },

  // Christmas (Christian / Western)
  {
    id: "christmas-tree",
    emoji: "🎄",
    label: "Christmas Tree",
    culture: "Western",
    holiday: "Christmas",
  },
  {
    id: "christmas-gift",
    emoji: "🎁",
    label: "Gift",
    culture: "Western",
    holiday: "Christmas",
  },
  {
    id: "christmas-star",
    emoji: "🌟",
    label: "Star",
    culture: "Western",
    holiday: "Christmas",
  },

  // Kwanzaa (African American)
  {
    id: "kwanzaa-candles",
    emoji: "🕯️",
    label: "Kinara Candle",
    culture: "African American",
    holiday: "Kwanzaa",
  },
  {
    id: "kwanzaa-corn",
    emoji: "🌽",
    label: "Muhindi (Corn)",
    culture: "African American",
    holiday: "Kwanzaa",
  },
  {
    id: "kwanzaa-unity",
    emoji: "🤝",
    label: "Unity Cup",
    culture: "African American",
    holiday: "Kwanzaa",
  },

  // Day of the Dead (Mexican)
  {
    id: "muertos-skull",
    emoji: "💀",
    label: "Calavera",
    culture: "Mexican",
    holiday: "Day of the Dead",
  },
  {
    id: "muertos-marigold",
    emoji: "🌼",
    label: "Marigold",
    culture: "Mexican",
    holiday: "Day of the Dead",
  },
  {
    id: "muertos-candle",
    emoji: "🕯️",
    label: "Ofrenda Candle",
    culture: "Mexican",
    holiday: "Day of the Dead",
  },

  // Songkran (Thai)
  {
    id: "songkran-water",
    emoji: "💦",
    label: "Water Splash",
    culture: "Thai",
    holiday: "Songkran",
  },
  {
    id: "songkran-elephant",
    emoji: "🐘",
    label: "Elephant",
    culture: "Thai",
    holiday: "Songkran",
  },

  // Nowruz (Persian / Iranian)
  {
    id: "nowruz-tulip",
    emoji: "🌷",
    label: "Tulip",
    culture: "Persian",
    holiday: "Nowruz",
  },
  {
    id: "nowruz-egg",
    emoji: "🥚",
    label: "Painted Egg",
    culture: "Persian",
    holiday: "Nowruz",
  },
  {
    id: "nowruz-fish",
    emoji: "🐟",
    label: "Goldfish",
    culture: "Persian",
    holiday: "Nowruz",
  },

  // Carnival (Brazilian)
  {
    id: "carnival-mask",
    emoji: "🎭",
    label: "Carnival Mask",
    culture: "Brazilian",
    holiday: "Carnival",
  },
  {
    id: "carnival-confetti",
    emoji: "🎊",
    label: "Confetti",
    culture: "Brazilian",
    holiday: "Carnival",
  },
  {
    id: "carnival-drum",
    emoji: "🪘",
    label: "Samba Drum",
    culture: "Brazilian",
    holiday: "Carnival",
  },

  // Thanksgiving (North American)
  {
    id: "thanksgiving-turkey",
    emoji: "🦃",
    label: "Turkey",
    culture: "North American",
    holiday: "Thanksgiving",
  },
  {
    id: "thanksgiving-harvest",
    emoji: "🍂",
    label: "Autumn Leaves",
    culture: "North American",
    holiday: "Thanksgiving",
  },
  {
    id: "thanksgiving-pie",
    emoji: "🥧",
    label: "Pie",
    culture: "North American",
    holiday: "Thanksgiving",
  },

  // Easter (Christian)
  {
    id: "easter-egg",
    emoji: "🥚",
    label: "Easter Egg",
    culture: "Christian",
    holiday: "Easter",
  },
  {
    id: "easter-bunny",
    emoji: "🐰",
    label: "Bunny",
    culture: "Christian",
    holiday: "Easter",
  },
  {
    id: "easter-chick",
    emoji: "🐥",
    label: "Chick",
    culture: "Christian",
    holiday: "Easter",
  },

  // Obon (Japanese)
  {
    id: "obon-lantern",
    emoji: "🪷",
    label: "Lotus",
    culture: "Japanese",
    holiday: "Obon",
  },
  {
    id: "obon-fire",
    emoji: "🔥",
    label: "Bonfire",
    culture: "Japanese",
    holiday: "Obon",
  },
  {
    id: "obon-dance",
    emoji: "💃",
    label: "Bon Dance",
    culture: "Japanese",
    holiday: "Obon",
  },

  // Holi (Hindu / South Asian)
  {
    id: "holi-palette",
    emoji: "🎨",
    label: "Colors",
    culture: "South Asian",
    holiday: "Holi",
  },
  {
    id: "holi-rainbow",
    emoji: "🌈",
    label: "Rainbow",
    culture: "South Asian",
    holiday: "Holi",
  },

  // Mid-Autumn Festival (East Asian)
  {
    id: "midautumn-moon",
    emoji: "🌕",
    label: "Full Moon",
    culture: "East Asian",
    holiday: "Mid-Autumn Festival",
  },
  {
    id: "midautumn-rabbit",
    emoji: "🐇",
    label: "Jade Rabbit",
    culture: "East Asian",
    holiday: "Mid-Autumn Festival",
  },
];

/**
 * Filter icons by holiday name (case-insensitive partial match).
 */
export function getIconsByHoliday(holiday: string): HolidayBadgeIcon[] {
  const lower = holiday.toLowerCase();
  return HOLIDAY_BADGE_ICONS.filter((icon) =>
    icon.holiday.toLowerCase().includes(lower),
  );
}

/**
 * Filter icons by culture (case-insensitive partial match).
 */
export function getIconsByCulture(culture: string): HolidayBadgeIcon[] {
  const lower = culture.toLowerCase();
  return HOLIDAY_BADGE_ICONS.filter((icon) =>
    icon.culture.toLowerCase().includes(lower),
  );
}

/**
 * Get all unique holiday names.
 */
export function getAllHolidays(): string[] {
  return [...new Set(HOLIDAY_BADGE_ICONS.map((icon) => icon.holiday))];
}

/**
 * Get all unique culture names.
 */
export function getAllCultures(): string[] {
  return [...new Set(HOLIDAY_BADGE_ICONS.map((icon) => icon.culture))];
}

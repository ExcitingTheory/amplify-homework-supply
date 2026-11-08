import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface BiologyEvidenceUnit {
  id: string;
  headingPath: string[];
  kind: "paragraph" | "definition" | "definition-with-list";
  text: string;
  start: number;
  end: number;
}

export interface BiologyClaim {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  evidence: { unitId: string; quote: string; start: number; end: number };
  required: boolean;
  sourceCaveat?: string;
}

type Fact = readonly [predicate: string, object: string];
interface Annotation {
  id: string;
  marker: string;
  subject: string;
  facts: readonly Fact[];
}

// Independently authored expectations, not generated from extraction output.
const annotations: readonly Annotation[] = [
  { id: "introduction", marker: "The cell is the basic unit", subject: "Cells", facts: [
    ["are", "the basic unit of life"],
    ["compose", "all living organisms, in one or more cells"],
    ["study contributes to", "understanding biology"],
  ] },
  { id: "cytology", marker: "**Cytology**", subject: "Cytology", facts: [
    ["is a branch of", "biology"], ["studies", "cells"], ["studies", "cell structure"],
    ["studies", "cell function"], ["studies", "cell chemistry"],
  ] },
  { id: "cell-theory", marker: "**Cell Theory**", subject: "Cell theory", facts: [
    ["states", "all living organisms are composed of one or more cells"],
    ["states", "the cell is the basic unit of structure and organization"],
    ["states", "all cells arise from pre-existing cells"],
  ] },
  { id: "microscope", marker: "**Microscope**", subject: "Microscopes", facts: [
    ["use", "lenses"], ["magnify", "small objects"],
    ["were used by Robert Hooke to observe cells in", "1665"],
  ] },
  { id: "resolution", marker: "**Resolution**", subject: "Resolution", facts: [
    ["means", "the ability to distinguish between two closely spaced objects"],
    ["is greater in", "modern electron microscopes than light microscopes"],
  ] },
  { id: "prokaryotes", marker: "**Prokaryotic cells**", subject: "Prokaryotic cells", facts: [
    ["lack", "a membrane-bound nucleus"], ["include", "bacteria"], ["include", "archaea"],
    ["typically measure", "1-10 μm"], ["locate genetic material in", "a nucleoid region"],
  ] },
  { id: "eukaryotes", marker: "**Eukaryotic cells**", subject: "Eukaryotic cells", facts: [
    ["have", "a membrane-bound nucleus"], ["have", "specialized organelles"],
    ["include", "animals"], ["include", "plants"], ["include", "fungi"], ["include", "protists"],
    ["typically measure", "10-100 μm"], ["are more structurally complex than", "prokaryotic cells"],
  ] },
  { id: "unicellular", marker: "**Unicellular**", subject: "Unicellular organisms", facts: [
    ["consist of", "a single cell"], ["include", "bacteria"], ["include", "amoeba"],
  ] },
  { id: "multicellular", marker: "**Multicellular**", subject: "Multicellular organisms", facts: [
    ["consist of", "many cells that work together"], ["include", "humans"], ["include", "trees"],
  ] },
  { id: "plasma-membrane", marker: "**Plasma membrane**", subject: "Plasma membrane", facts: [
    ["is also called", "cell membrane"], ["is", "a selectively permeable barrier"],
    ["separates", "the cell interior from its external environment"],
    ["consists of", "a phospholipid bilayer with embedded proteins"],
  ] },
  { id: "bilayer", marker: "**Phospholipid bilayer**", subject: "Phospholipid bilayer", facts: [
    ["consists of", "a double layer of phospholipid molecules"],
    ["forms", "the basic structure of cell membranes"],
    ["orients hydrophobic tails", "inward"], ["orients hydrophilic heads", "outward"],
  ] },
  { id: "permeability", marker: "**Selective permeability**", subject: "Selective permeability", facts: [
    ["allows", "some substances to pass through membranes"], ["blocks", "other substances"],
    ["helps maintain", "cellular homeostasis"],
  ] },
  { id: "nucleus", marker: "**Nucleus**", subject: "Nucleus", facts: [
    ["is described as", "the control center of eukaryotic cells"],
    ["contains", "the cell's genetic material (DNA)"],
    ["is surrounded by", "a double membrane called the nuclear envelope"],
  ] },
  { id: "nuclear-envelope", marker: "**Nuclear envelope**", subject: "Nuclear envelope", facts: [
    ["is", "a double membrane"], ["has", "pores"],
    ["regulates", "passage of materials between the nucleus and cytoplasm"],
  ] },
  { id: "chromatin", marker: "**Chromatin**", subject: "Chromatin", facts: [
    ["consists of", "DNA and proteins"], ["is located in", "the nucleus"],
    ["condenses during cell division into", "visible chromosomes"],
  ] },
  { id: "nucleolus", marker: "**Nucleolus**", subject: "Nucleolus", facts: [
    ["is", "a dense region within the nucleus"], ["is the site of", "ribosomal RNA production"],
  ] },
  { id: "chromosomes", marker: "**Chromosomes**", subject: "Chromosomes", facts: [
    ["are made of", "condensed chromatin"], ["carry", "genetic information in the form of genes"],
  ] },
  { id: "cytoplasm", marker: "**Cytoplasm**", subject: "Cytoplasm", facts: [
    ["is", "a gel-like substance"], ["fills", "the cell between the plasma membrane and nucleus"],
    ["contains", "organelles"], ["contains", "cytosol"], ["contains", "the cytoskeleton"],
  ] },
  { id: "cytosol", marker: "**Cytosol**", subject: "Cytosol", facts: [
    ["is", "the liquid portion of the cytoplasm"], ["consists mainly of", "water"],
    ["contains dissolved", "ions"], ["contains dissolved", "molecules"], ["contains dissolved", "proteins"],
  ] },
  { id: "cytoskeleton", marker: "**Cytoskeleton**", subject: "Cytoskeleton", facts: [
    ["consists of", "a network of protein filaments"], ["provides", "structural support"],
    ["enables", "cell movement"], ["helps", "transport materials within the cell"],
  ] },
  { id: "mitochondria", marker: "**Mitochondria**", subject: "Mitochondria", facts: [
    ["have singular form", "mitochondrion"], ["are responsible for", "cellular respiration"],
    ["convert nutrients into", "ATP"], ["are nicknamed", "the powerhouse of the cell"],
    ["have", "their own DNA"], ["have", "a double membrane"],
  ] },
  { id: "atp", marker: "**ATP (Adenosine Triphosphate)**", subject: "ATP", facts: [
    ["stands for", "Adenosine Triphosphate"], ["is", "the primary energy currency of cells"],
    ["powers", "most cellular processes through energy released from breaking ATP bonds"],
  ] },
  { id: "respiration", marker: "**Cellular respiration**", subject: "Cellular respiration", facts: [
    ["breaks down", "glucose and other organic molecules"], ["produces", "ATP"],
    ["consumes", "oxygen"], ["produces", "carbon dioxide"],
  ] },
  { id: "chloroplasts", marker: "**Chloroplasts**", subject: "Chloroplasts", facts: [
    ["occur in", "plant cells"], ["occur in", "some protists"], ["are the site of", "photosynthesis"],
    ["contain", "chlorophyll"], ["convert", "light energy into chemical energy (glucose)"],
  ] },
  { id: "ribosomes", marker: "**Ribosomes**", subject: "Ribosomes", facts: [
    ["are composed of", "RNA and proteins"], ["are the site of", "protein synthesis"],
    ["can be located", "free-floating in the cytoplasm"],
    ["can be located", "attached to the endoplasmic reticulum"],
  ] },
  { id: "er", marker: "**Endoplasmic Reticulum (ER)**", subject: "Endoplasmic reticulum", facts: [
    ["is abbreviated", "ER"], ["consists of", "a network of membranous tubules and sacs"],
    ["is involved in", "protein synthesis"], ["is involved in", "lipid synthesis"],
  ] },
  { id: "rough-er", marker: "**Rough ER**", subject: "Rough ER", facts: [
    ["is studded with", "ribosomes"], ["is primarily involved in", "protein synthesis"],
    ["is primarily involved in", "protein modification"],
  ] },
  { id: "smooth-er", marker: "**Smooth ER**", subject: "Smooth ER", facts: [
    ["lacks", "ribosomes"], ["is involved in", "lipid synthesis"],
    ["is involved in", "carbohydrate metabolism"], ["is involved in", "detoxification"],
  ] },
  { id: "golgi", marker: "**Golgi apparatus**", subject: "Golgi apparatus", facts: [
    ["is also called", "Golgi complex"], ["is also called", "Golgi body"],
    ["modifies", "proteins and lipids"], ["packages", "proteins and lipids"],
    ["sorts", "proteins and lipids for transport to their final destinations"],
  ] },
  { id: "vesicles", marker: "**Vesicles**", subject: "Vesicles", facts: [
    ["are", "small membrane-bound sacs"], ["transport materials", "within cells"],
    ["transport materials to", "the cell membrane for secretion"],
  ] },
  { id: "vacuoles", marker: "**Vacuoles**", subject: "Vacuoles", facts: [
    ["are", "membrane-bound sacs used for storage"],
    ["typically occur in plant cells as", "one large central vacuole"],
    ["store", "water"], ["store", "nutrients"], ["store", "waste products"],
    ["help maintain", "turgor pressure"],
  ] },
  { id: "lysosomes", marker: "**Lysosomes**", subject: "Lysosomes", facts: [
    ["contain", "digestive enzymes"], ["break down", "waste materials"],
    ["break down", "cellular debris"], ["break down", "foreign substances"],
    ["are nicknamed", "the recycling centers of the cell"],
  ] },
  { id: "peroxisomes", marker: "**Peroxisomes**", subject: "Peroxisomes", facts: [
    ["break down", "fatty acids"], ["detoxify", "harmful substances"],
    ["produce as a byproduct", "hydrogen peroxide"], ["break down", "hydrogen peroxide"],
  ] },
  { id: "cell-wall", marker: "**Cell wall**", subject: "Cell wall", facts: [
    ["is", "a rigid structure outside the plasma membrane"], ["occurs in", "plant cells"],
    ["occurs in", "fungi"], ["occurs in", "some protists"],
    ["is primarily made of in plants", "cellulose"], ["provides", "structural support"],
  ] },
  { id: "cellulose", marker: "**Cellulose**", subject: "Cellulose", facts: [
    ["is", "a complex carbohydrate"], ["is the primary component of", "plant cell walls"],
  ] },
  { id: "plasmodesmata", marker: "**Plasmodesmata**", subject: "Plasmodesmata", facts: [
    ["are", "channels through plant cell walls"], ["allow", "direct cell-to-cell communication"],
    ["allow", "transport between cells"],
  ] },
  { id: "cilia", marker: "**Cilia**", subject: "Cilia", facts: [
    ["have singular form", "cilium"], ["are", "short, numerous hair-like projections"],
    ["move in", "coordinated waves"], ["can", "propel cells"],
    ["can", "move substances across cell surfaces"],
  ] },
  { id: "flagella", marker: "**Flagella**", subject: "Flagella", facts: [
    ["have singular form", "flagellum"], ["are", "long, whip-like appendages"],
    ["propel", "cells through fluid environments"], ["are used for movement by", "sperm cells"],
  ] },
  { id: "diffusion", marker: "**Diffusion**", subject: "Diffusion", facts: [
    ["moves molecules from", "high concentration to low concentration"],
    ["requires", "no energy input"],
  ] },
  { id: "osmosis", marker: "**Osmosis**", subject: "Osmosis", facts: [
    ["is", "diffusion of water"], ["occurs across", "a selectively permeable membrane"],
    ["moves water from", "low solute concentration to high solute concentration"],
  ] },
  { id: "facilitated-diffusion", marker: "**Facilitated diffusion**", subject: "Facilitated diffusion", facts: [
    ["is", "passive movement of molecules across membranes"], ["uses", "transport proteins"],
  ] },
  { id: "active-transport", marker: "**Active transport**", subject: "Active transport", facts: [
    ["moves molecules", "against their concentration gradient"],
    ["moves molecules from", "low to high concentration"], ["requires", "energy (ATP)"],
  ] },
  { id: "endocytosis", marker: "**Endocytosis**", subject: "Endocytosis", facts: [
    ["engulfs", "external materials"], ["forms", "vesicles from the plasma membrane"],
  ] },
  { id: "exocytosis", marker: "**Exocytosis**", subject: "Exocytosis", facts: [
    ["expels", "materials in vesicles"], ["involves", "vesicles fusing with the plasma membrane"],
  ] },
  { id: "phagocytosis", marker: "**Phagocytosis**", subject: "Phagocytosis", facts: [
    ["is a type of", "endocytosis"], ["engulfs", "large particles or other cells"],
    ["is nicknamed", "cell eating"],
  ] },
  { id: "pinocytosis", marker: "**Pinocytosis**", subject: "Pinocytosis", facts: [
    ["is a type of", "endocytosis"], ["takes in", "liquid and small dissolved molecules"],
    ["is nicknamed", "cell drinking"],
  ] },
  { id: "conclusion", marker: "Understanding cell structure is fundamental", subject: "Cell structures", facts: [
    ["have specialized functions contributing to", "cell survival and operation"],
    ["coordinate to allow cells to", "grow"], ["coordinate to allow cells to", "reproduce"],
    ["coordinate to allow cells to", "respond to their environment"],
    ["coordinate to allow cells to", "maintain homeostasis"],
  ] },
];

export const biologySource = {
  path: "test/mocks/biology-cell-structure.md",
  sha256: "eaeb44fdbb30a173792d3680606c4d01f7b0a6444ddbdf7a00b9f21a51806d57",
  offsetEncoding: "utf16" as const,
};

const headings = new Set([
  "The Discovery of Cells", "Types of Cells", "The Plasma Membrane", "The Nucleus",
  "The Cytoplasm", "Energy-Producing Organelles", "Protein Manufacturing and Processing",
  "Storage and Waste Management", "Plant Cell Structures", "Movement Structures",
  "Passive Transport", "Active Transport", "Conclusion",
]);

export function loadBiologyGroundTruth() {
  const text = readFileSync(resolve(biologySource.path), "utf8");
  const units: BiologyEvidenceUnit[] = [];
  const claims: BiologyClaim[] = [];
  let chapter = "";
  let section = "";
  let cursor = 0;
  for (const raw of text.split(/\n\s*\n/)) {
    const block = raw.trim();
    if (!block) continue;
    const start = text.indexOf(block, cursor);
    cursor = start + block.length;
    if (block === "Cell Biology: The Structure and Function of Cells") continue;
    if (/^Chapter \d:/.test(block)) {
      chapter = block;
      section = "";
      continue;
    }
    if (headings.has(block)) {
      section = block;
      continue;
    }
    const matches = annotations.filter((annotation) => block.startsWith(annotation.marker));
    if (matches.length !== 1) throw new Error(`Biology block needs exactly one annotation: ${block.slice(0, 60)}`);
    const annotation = matches[0];
    const unit: BiologyEvidenceUnit = {
      id: annotation.id, headingPath: [chapter, section].filter(Boolean),
      kind: block.includes("\n1.") ? "definition-with-list" : block.startsWith("**") ? "definition" : "paragraph",
      text: block, start, end: cursor,
    };
    units.push(unit);
    annotation.facts.forEach(([predicate, object], index) => {
      const sourceCaveat = annotation.id === "atp" && index === 2
        ? "Source simplification: breaking a bond alone requires energy; net ATP hydrolysis releases free energy."
        : annotation.id === "respiration" && index >= 2
          ? "Source describes aerobic respiration; these statements are not universal to all respiration."
          : undefined;
      claims.push({
        id: `${unit.id}-${index + 1}`, subject: annotation.subject, predicate, object,
        evidence: { unitId: unit.id, quote: block, start, end: cursor },
        required: sourceCaveat === undefined, ...(sourceCaveat ? { sourceCaveat } : {}),
      });
    });
  }
  if (units.length !== annotations.length) throw new Error("Biology annotations contain missing or repeated source blocks");
  return { source: biologySource, text, units, claims };
}

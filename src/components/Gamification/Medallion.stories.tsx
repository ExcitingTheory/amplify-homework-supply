import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Medallion, type MedallionShape } from "./Medallion";
import { HERALDRY } from "../../themes/heraldry";

const meta: Meta<typeof Medallion> = {
  title: "🏆 Gamification/Squads & Teams/Medallion",
  component: Medallion,
  parameters: {
    // Pure presentational primitive — skip the app context/subscription stack.
    minimalProviders: true,
  },
  argTypes: {
    shape: { control: "inline-radio", options: ["shield", "disc", "hex"] },
    size: { control: { type: "range", min: 32, max: 160, step: 4 } },
    division: {
      control: "inline-radio",
      options: ["plain", "per-pale", "per-fess", "chevron", "bend"],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Medallion>;

export const Default: Story = {
  args: {
    shape: "shield",
    size: 96,
    rimMetal: HERALDRY.metals.gold,
    fieldColor: HERALDRY.tinctures.azure.main,
    divisionColor: HERALDRY.tinctures.or.main,
    division: "per-pale",
    ariaLabel: "Sample medallion",
    charge: (
      <Typography
        component="span"
        sx={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 700,
          fontSize: 38,
          color: "#f5f5f5",
          textShadow: "0 1px 1px rgba(0,0,0,0.35)",
        }}
      >
        AS
      </Typography>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Renders an accessible medallion image
    expect(canvasElement.querySelector('svg[role="img"]')).not.toBeNull();
    // Charge is rendered
    await canvas.findByText("AS");
  },
};

const SHAPES: MedallionShape[] = ["shield", "disc", "hex"];
const METALS = ["bronze", "silver", "gold", "platinum"] as const;

export const ShapesAndMetals: Story = {
  render: () => (
    <Box>
      {SHAPES.map((shape) => (
        <Box
          key={shape}
          sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}
        >
          <Typography sx={{ width: 64, textTransform: "capitalize" }}>
            {shape}
          </Typography>
          {METALS.map((metal, i) => (
            <Medallion
              key={metal}
              shape={shape}
              size={72}
              rimMetal={HERALDRY.metals[metal]}
              fieldColor={Object.values(HERALDRY.tinctures)[i].main}
              ariaLabel={`${shape} ${metal} medallion`}
            />
          ))}
        </Box>
      ))}
    </Box>
  ),
  play: async ({ canvasElement }) => {
    // 3 shapes × 4 metals = 12 medallions
    expect(canvasElement.querySelectorAll('svg[role="img"]').length).toBe(12);
  },
};

export const Sizes: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[40, 64, 96, 128].map((size) => (
        <Medallion
          key={size}
          shape="shield"
          size={size}
          rimMetal={HERALDRY.metals.platinum}
          fieldColor={HERALDRY.tinctures.gules.main}
          division="chevron"
          divisionColor={HERALDRY.tinctures.argent.main}
          ariaLabel={`${size}px medallion`}
        />
      ))}
    </Box>
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelectorAll('svg[role="img"]').length).toBe(4);
  },
};

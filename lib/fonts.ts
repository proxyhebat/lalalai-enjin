import {
  Architects_Daughter,
  Fira_Code,
  Noto_Serif_Georgian
} from "next/font/google";

export const architectsDaughter = Architects_Daughter({
  variable: "--font-architects-daughter",
  weight: ["400"],
  subsets: ["latin"]
});

export const firacode = Fira_Code({
  variable: "--font-firacode",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"]
});

export const georgia = Noto_Serif_Georgian({
  variable: "--font-georgia",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"]
});

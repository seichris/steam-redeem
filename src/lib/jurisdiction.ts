export type JurisdictionId =
  | "UK"
  | "DE"
  | "FR"
  | "ES"
  | "IT"
  | "NL"
  | "EU_OTHER"
  | "US_OTHER";

export const JURISDICTIONS: { id: JurisdictionId; label: string; steamStoreCc: string }[] = [
  { id: "UK", label: "United Kingdom (England & Wales)", steamStoreCc: "gb" },
  { id: "DE", label: "Germany", steamStoreCc: "de" },
  { id: "FR", label: "France", steamStoreCc: "fr" },
  { id: "ES", label: "Spain", steamStoreCc: "es" },
  { id: "IT", label: "Italy", steamStoreCc: "it" },
  { id: "NL", label: "Netherlands", steamStoreCc: "nl" },
  { id: "EU_OTHER", label: "Other EU", steamStoreCc: "eu" },
  { id: "US_OTHER", label: "United States (later)", steamStoreCc: "us" }
];

export function getJurisdictionById(id: string | null) {
  return JURISDICTIONS.find((j) => j.id === id) ?? JURISDICTIONS[0];
}


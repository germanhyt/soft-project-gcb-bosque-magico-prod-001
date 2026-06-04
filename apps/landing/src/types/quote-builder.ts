export type QuoteBuilderSelection = {
  paquete: string;
  showIds: string[];
  showCantidades: Record<string, number>;
  cateringIds: string[];
  cateringCantidades: Record<string, number>;
  extraIds: string[];
  extraCantidades: Record<string, number>;
};

export const INITIAL_QUOTE_SELECTION: QuoteBuilderSelection = {
  paquete: '',
  showIds: [],
  showCantidades: {},
  cateringIds: [],
  cateringCantidades: {},
  extraIds: [],
  extraCantidades: {},
};

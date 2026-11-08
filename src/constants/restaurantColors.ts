export const lightColors = {
  background: '#F5EADB', surface: '#FFFAF1', text: '#2C211A',
  muted: '#6D6155', accent: '#7D251F', border: '#E3D4BF',
  soft: '#EEDDD0', olive: '#3F542B', onAccent: '#FFFFFF',
  successBackground: '#E9EFDE',
};
export type RestaurantColors = typeof lightColors;

export const darkColors: RestaurantColors = {
  background: '#171310', surface: '#241D18', text: '#F8F0E6',
  muted: '#C6B8A7', accent: '#EAA99B', border: '#514438',
  soft: '#422B25', olive: '#BDD695', onAccent: '#281510',
  successBackground: '#2C3B24',
};

// Kept for components that have not adopted the preferences context yet.
export const colors = lightColors;

export const highContrastLightColors: RestaurantColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#111111',
  muted: '#333333',
  accent: '#6F200C',
  border: '#554433',
  soft: '#FFE4D3',
  olive: '#234500',
  onAccent: '#FFFFFF',
  successBackground: '#E3F1D0',
};

export const highContrastDarkColors: RestaurantColors = {
  background: '#000000',
  surface: '#101010',
  text: '#FFFFFF',
  muted: '#EEEEEE',
  accent: '#FFD0B5',
  border: '#CCCCCC',
  soft: '#342218',
  olive: '#D3FF9C',
  onAccent: '#000000',
  successBackground: '#1C2C0F',
};

import type { CardItem } from '../types/CardItem';

export const presentationLabels = {
  full: 'Full order',
  half: 'Half order',
  glass: 'Glass',
  bottle: 'Bottle',
  thin: 'Thin cut',
  thick: 'Thick cut',
} as const;

export const ingredientLabels = {
  vegetables: 'Vegetables only',
  beef: 'Beef fillet',
  chicken: 'Chicken',
  white_fish: 'White fish',
  shrimp: 'Shrimp',
  octopus: 'Octopus',
  salmon: 'Salmon',
  ribeye: 'Thin-cut ribeye',
  combo: 'Combination',
  gyo_beef: 'Beef',
  ebi: 'Ebi (shrimp)',
  mixed: 'Mixed',
} as const;

export function getCardSummary(card: CardItem) {
  const options = card.presentations ?? [];
  const available = options.filter((option) => option.is_available);
  const pricedOptions = available.length ? available : options;
  const lowest = pricedOptions.reduce<(typeof options)[number] | undefined>(
    (best, option) => !best || Number(option.price) < Number(best.price) ? option : best,
    undefined,
  );

  const mixPrices = card.order_profile?.groups
    .find((group) => group.key === 'skewers')?.options
    .flatMap((option) => option.price ? [Number(option.price)] : []) ?? [];

  return {
    title: card.display_title ?? card.title,
    price: mixPrices.length ? Math.min(...mixPrices).toFixed(2) : lowest?.price ?? card.price,
    image: card.image || options.find((option) => option.image)?.image || '',
    isAvailable: options.length ? available.length > 0 : card.is_available,
    showStartingPrice: options.length > 1 || Boolean(card.order_profile?.highest_price),
  };
}

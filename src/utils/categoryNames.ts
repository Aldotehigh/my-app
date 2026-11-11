import type { Language } from './preferenceStorage';

const japaneseNames: Record<string, string> = {
  "anis": "アニス酒",
  "arroz": "ご飯もの",
  "bebidas": "飲み物",
  "bebidas sin alcohol": "ノンアルコール飲料",
  "bocadillos especiales": "特製ひとくち料理",
  "brandy": "ブランデー",
  "cafe y te": "コーヒー・お茶",
  "carne y pollo": "肉・鶏料理",
  "caserolas": "鍋料理",
  "cerveza": "ビール",
  "ceviches": "セビーチェ",
  "cocteleria tradicional": "定番カクテル",
  "cocteleria sin alcohol": "ノンアルコールカクテル",
  "cognac": "コニャック",
  "cremas y licores": "クリーム系・リキュール",
  "ensaladas": "サラダ",
  "entradas": "前菜",
  "especialidades del chef": "シェフのおすすめ",
  "extras": "追加メニュー",
  "ginebra": "ジン",
  "jarras": "ピッチャー",
  "kushi age": "串揚げ",
  "makimonos especiales": "特製巻き寿司",
  "makimonos tradicionales": "定番巻き寿司",
  "mariscos": "魚介料理",
  "mezcal": "メスカル",
  "nigiris": "握り寿司",
  "postres": "デザート",
  "ron": "ラム",
  "sashimi": "刺身",
  "sopas y ramen": "スープ・ラーメン",
  "temakis": "手巻き寿司",
  "tempura": "天ぷら",
  "teppanyaki and teriyaki": "鉄板焼き・照り焼き",
  "tequila": "テキーラ",
  "udon y soba": "うどん・そば",
  "vodka": "ウォッカ",
  "whisky": "ウイスキー"
};

const englishNames: Record<string, string> = {
  "anis": "Anise Spirits",
  "arroz": "Rice",
  "bebidas": "Drinks",
  "bebidas sin alcohol": "Non-alcoholic Drinks",
  "bocadillos especiales": "Special Bites",
  "cafe y te": "Coffee and Tea",
  "carne y pollo": "Meat and Poultry",
  "caserolas": "Casseroles",
  "cerveza": "Beer",
  "ceviches": "Ceviche",
  "cocteleria tradicional": "Classic Cocktails",
  "cocteleria sin alcohol": "Alcohol-free Cocktails",
  "cremas y licores": "Cream Liqueurs and Spirits",
  "ensaladas": "Salads",
  "entradas": "Starters",
  "especialidades del chef": "Chef’s Specials",
  "extras": "Extras",
  "ginebra": "Gin",
  "jarras": "Pitchers",
  "makimonos especiales": "Special Sushi Rolls",
  "makimonos tradicionales": "Traditional Sushi Rolls",
  "mariscos": "Seafood",
  "postres": "Desserts",
  "ron": "Rum",
  "sopas y ramen": "Soups and Ramen",
  "udon y soba": "Udon and Soba"
};

export function categoryName(name: string, language: Language) {
  if (language === 'es') return name;
  const normalized = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return (language === 'ja' ? japaneseNames : englishNames)[normalized] ?? name;
}

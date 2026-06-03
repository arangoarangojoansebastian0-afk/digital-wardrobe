export type ClothingSlot = "upper" | "lower" | "outer" | "dress" | "shoes" | "accessory";

export type ClothingAnalysis = {
  title: string;
  category: string;
  type: string;
  color: string;
  style: string;
  season: string;
  tags: string[];
  description: string;
  details: string;
  fabric: string;
  fit: string;
  occasion: string;
  formality: string;
  outfit_slot: ClothingSlot;
  outfit_anchor_x: number;
  outfit_anchor_y: number;
  outfit_width: number;
  outfit_layer: number;
};

export type ClothingItem = {
  id: string | number;
  user_id?: string | null;
  title?: string | null;
  category?: string | null;
  image?: string | null;
  type?: string | null;
  color?: string | null;
  style?: string | null;
  season?: string | null;
  tags?: string[] | null;
  description?: string | null;
  details?: string | null;
  fabric?: string | null;
  fit?: string | null;
  occasion?: string | null;
  formality?: string | null;
  outfit_slot?: ClothingSlot | null;
  outfit_anchor_x?: number | null;
  outfit_anchor_y?: number | null;
  outfit_width?: number | null;
  outfit_layer?: number | null;
  is_available?: boolean;
};

export type OutfitItemIds = {
  upper?: string;
  lower?: string;
  outer?: string;
  dress?: string;
  shoes?: string;
  accessory?: string;
};

export type Outfit = {
  id: string | number;
  user_id?: string | null;
  title?: string | null;
  description?: string | null;
  item_ids: OutfitItemIds;
  created_at?: string | null;
  updated_at?: string | null;
};

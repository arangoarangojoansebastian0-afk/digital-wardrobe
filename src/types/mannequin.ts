export type BodyShape =
  | "hourglass"
  | "triangle"
  | "inverted_triangle"
  | "rectangle"
  | "oval"
  | "pear";

export type BodyType = "ectomorph" | "mesomorph" | "endomorph" | "athletic";

export type BodyProfile = {
  id?: string;
  user_id?: string;
  height_cm: number;
  weight_kg: number;
  shoulder_width_cm: number;
  chest_circumference_cm: number;
  waist_circumference_cm: number;
  hip_circumference_cm: number;
  arm_length_cm: number;
  leg_length_cm: number;
  body_shape: BodyShape;
  body_type: BodyType;
  posture?: string;
  created_at?: string;
};

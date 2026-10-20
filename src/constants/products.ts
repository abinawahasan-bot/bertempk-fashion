import type { Product } from "../types";

/**
 * Streetwear catalogue — images chosen to match each garment name
 *
 * The URLs below are the 1600 px masters and stay the single source of truth:
 * `lib/images.ts` derives a resize ladder from them for `<img srcSet>`, while
 * the fitting room / 3D paths and the `images ?? [image]` fallbacks keep using
 * them verbatim. Do not pre-resize them here.
 */
export const products: Product[] = [
  {
    id: "p1",
    image:
      "https://images.pexels.com/photos/29900469/pexels-photo-29900469.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    images: [
      "https://images.pexels.com/photos/29900469/pexels-photo-29900469.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/29900470/pexels-photo-29900470.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/29900471/pexels-photo-29900471.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/29900472/pexels-photo-29900472.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    ],
    category: "Outerwear",
    name: "Mod Jacket / 001",
    price: 1_290_000,
    originalPrice: 1_590_000,
    isNew: true,
    stock: 50,
  },
  {
    id: "p2",
    image:
      "https://images.pexels.com/photos/28701960/pexels-photo-28701960.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    images: [
      "https://images.pexels.com/photos/28701960/pexels-photo-28701960.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/28701951/pexels-photo-28701951.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/28701965/pexels-photo-28701965.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/28701952/pexels-photo-28701952.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    ],
    category: "Hoodie",
    name: "Static Hoodie / 002",
    price: 989_000,
    isNew: true,
    stock: 50,
  },
  {
    id: "p3",
    image:
      "https://images.pexels.com/photos/36611867/pexels-photo-36611867.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    images: [
      "https://images.pexels.com/photos/36611867/pexels-photo-36611867.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/36611868/pexels-photo-36611868.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/36611869/pexels-photo-36611869.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/36611870/pexels-photo-36611870.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    ],
    category: "Trousers",
    name: "Wide Trousers / 003",
    price: 1_190_000,
    originalPrice: 1_490_000,
    stock: 50,
  },
  {
    id: "p4",
    image:
      "https://images.pexels.com/photos/14437343/pexels-photo-14437343.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    images: [
      "https://images.pexels.com/photos/14437343/pexels-photo-14437343.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/14437345/pexels-photo-14437345.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/14437346/pexels-photo-14437346.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/14437348/pexels-photo-14437348.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    ],
    category: "Outerwear",
    name: "Multi-pocket Vest / 001",
    price: 1_590_000,
    isNew: true,
    stock: 50,
  },
  {
    id: "p5",
    image:
      "https://images.pexels.com/photos/5443935/pexels-photo-5443935.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    images: [
      "https://images.pexels.com/photos/5443935/pexels-photo-5443935.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/5443934/pexels-photo-5443934.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/5443936/pexels-photo-5443936.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/5443932/pexels-photo-5443932.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    ],
    category: "New Crop",
    name: "Signal Crop / 004",
    price: 749_000,
    originalPrice: 949_000,
    stock: 50,
  },
  {
    id: "p6",
    image:
      "https://images.pexels.com/photos/17908419/pexels-photo-17908419.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    images: [
      "https://images.pexels.com/photos/17908419/pexels-photo-17908419.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/17908420/pexels-photo-17908420.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/17908421/pexels-photo-17908421.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
      "https://images.pexels.com/photos/17908422/pexels-photo-17908422.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    ],
    category: "Trousers",
    name: "Wide Trousers / 002",
    price: 1_190_000,
    isNew: true,
    stock: 50,
  },
];

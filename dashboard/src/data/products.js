export const categories = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Fashion" },
  { id: 3, name: "Home & Garden" },
  { id: 4, name: "Sports" },
  { id: 5, name: "Beauty" },
  { id: 6, name: "Kitchen" },
  { id: 7, name: "Accessories" },
  { id: 8, name: "Books" },
];

export const getProductImage = (product, index = 0) => {
  const images = product?.images;
  if (!images) return "/favicon.svg";
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed[index]?.url) return parsed[index].url;
      if (parsed?.url) return parsed.url;
    } catch {
      return images;
    }
  }
  if (Array.isArray(images) && images[index]?.url) return images[index].url;
  if (images?.url) return images.url;
  return "/favicon.svg";
};

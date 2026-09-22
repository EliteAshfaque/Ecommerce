import { useEffect, useState } from "react";
import ProductSlider from "./ProductSlider";

const RECENTLY_VIEWED_KEY = "lumera-recently-viewed-v1";

// This is customer-local discovery data: it never stores account or payment information.
// Browser-local feature: reads recently viewed product snapshots from localStorage
// and displays them through the same reusable ProductSlider component.
const RecentlyViewed = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
      setProducts(Array.isArray(saved) ? saved.filter((product) => product?.id).slice(0, 8) : []);
    } catch { setProducts([]); }
  }, []);
  if (!products.length) return null;
  return <div className="home-reveal"><ProductSlider title="Recently viewed" subtitle="A private reminder of pieces you explored on this browser." products={products} /></div>;
};

export default RecentlyViewed;

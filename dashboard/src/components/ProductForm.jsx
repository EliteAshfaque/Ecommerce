import { useState } from "react";
import { categories } from "../data/products";

const empty = {
  name: "",
  description: "",
  price: "",
  category: "Electronics",
  stock: "",
};

const field =
  "mt-1 w-full border-0 border-b border-border/15 bg-transparent py-2 text-sm outline-none focus:border-ink";

const ProductForm = ({ initial, onSubmit, onCancel, saving }) => {
  const [form, setForm] = useState({
    ...empty,
    ...initial,
    price: initial?.price ?? "",
    stock: initial?.stock ?? "",
  });
  const [images, setImages] = useState(null);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", form.name.trim());
    data.append("description", form.description.trim());
    data.append("price", form.price);
    data.append("category", form.category);
    data.append("stock", form.stock);
    if (images?.length) {
      Array.from(images).forEach((file) => data.append("images", file));
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-surface space-y-4 rounded-2xl p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
            Name
          </label>
          <input name="name" value={form.name} onChange={change} required className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={change}
            required
            rows={3}
            className={field}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
            Price
          </label>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={change}
            required
            className={field}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
            Stock
          </label>
          <input
            name="stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={change}
            required
            className={field}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
            Category
          </label>
          <select
            name="category"
            value={form.category}
            onChange={change}
            className={field}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
            Images
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(e.target.files)}
            className="mt-2 block w-full text-sm text-stone"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="admin-action bg-ink px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-fog disabled:opacity-50"
        >
          {saving ? "Saving…" : initial?.id ? "Update" : "Create"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-stone"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;

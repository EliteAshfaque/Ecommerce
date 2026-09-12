import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "../store/slices/adminSlice";
import ProductForm from "../components/ProductForm";
import { getProductImage } from "../data/products";

const DashboardProducts = () => {
  const dispatch = useDispatch();
  const {
    products,
    productsLoading,
    productSaving,
    productsPage,
    totalPages,
    totalProducts,
  } = useSelector((state) => state.admin);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminProducts(1));
  }, [dispatch]);

  const handleCreate = async (formData) => {
    const res = await dispatch(createAdminProduct(formData));
    if (res.meta.requestStatus === "fulfilled") {
      setShowForm(false);
      dispatch(fetchAdminProducts(productsPage));
    }
  };

  const handleUpdate = async (formData) => {
    const res = await dispatch(
      updateAdminProduct({ productId: editing.id, data: formData })
    );
    if (res.meta.requestStatus === "fulfilled") {
      setEditing(null);
      dispatch(fetchAdminProducts(productsPage));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await dispatch(deleteAdminProduct(id));
  };

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-stone">
            Catalogue
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Products
          </h1>
          <p className="mt-1 text-sm text-stone">{totalProducts} total</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
          className="admin-action inline-flex items-center gap-2 bg-ink px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-fog"
        >
          <Plus className="h-3.5 w-3.5" />
          Add product
        </button>
      </header>

      {showForm && !editing && (
        <div className="mb-8">
          <ProductForm
            saving={productSaving}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editing && (
        <div className="mb-8">
          <ProductForm
            initial={editing}
            saving={productSaving}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {productsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-mist" />
          ))}
        </div>
      ) : (
        <div className="admin-surface divide-y divide-border/10 overflow-hidden rounded-2xl px-5">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 py-4"
            >
              <div className="h-14 w-12 shrink-0 overflow-hidden bg-mist">
                <img
                  src={getProductImage(product)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{product.name}</p>
                <p className="mt-0.5 text-xs text-stone">
                  {product.category} · {Number(product.price).toLocaleString("en-AE", { style: "currency", currency: "AED" })} ·
                  stock {product.stock}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(product);
                }}
                className="p-2 text-stone hover:text-ink"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(product.id)}
                className="p-2 text-stone hover:text-red-600"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => dispatch(fetchAdminProducts(page))}
              className={`h-9 min-w-9 px-2 text-sm ${
                productsPage === page
                  ? "bg-ink text-fog"
                  : "border border-border/15 text-stone"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardProducts;

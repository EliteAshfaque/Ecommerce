import { useEffect, useMemo, useState } from "react";
import { Mail, MessageSquareText, Send, X } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../lib/axios";

const statuses = ["New", "Open", "Resolved", "Closed"];
const statusTone = { New: "bg-rose-100 text-rose-700", Open: "bg-amber-100 text-amber-800", Resolved: "bg-emerald-100 text-emerald-700", Closed: "bg-mist text-stone" };

// Support stays independent from storefront content: a reply is saved as a
// ticket record now and can later be sent through configured SMTP/email.
export default function Support() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/admin/support/messages");
      setMessages(data.messages || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load support messages.");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => statuses.reduce((all, status) => ({ ...all, [status]: messages.filter((message) => message.status === status).length }), {}), [messages]);
  const save = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const { data } = await axiosInstance.put(`/admin/support/messages/${selected.id}`, { status: selected.status, admin_reply: selected.admin_reply || "" });
      setMessages((current) => current.map((message) => message.id === selected.id ? data.supportMessage : message));
      setSelected(data.supportMessage);
      toast.success(data.message);
    } catch (error) { toast.error(error.response?.data?.message || "Could not save the support message."); }
    finally { setSaving(false); }
  };

  return <div className="pb-8">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-primary">Customer care</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Support inbox</h1><p className="mt-2 text-sm text-stone">Read incoming messages, leave a customer-ready response, and keep every request accountable.</p></div><div className="flex items-center gap-2 rounded-full bg-primary/[.08] px-4 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-primary"><Mail className="h-3.5 w-3.5" />{counts.New || 0} new messages</div></header>
    <section className="mb-6 grid gap-3 sm:grid-cols-4">{statuses.map((status) => <div key={status} className="admin-surface rounded-2xl p-4"><p className="text-xs text-stone">{status}</p><p className="mt-2 font-display text-3xl font-semibold">{counts[status] || 0}</p></div>)}</section>
    {loading ? <div className="h-72 animate-pulse rounded-3xl bg-mist" /> : <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(400px,.95fr)]"><div className="admin-surface divide-y divide-border/10 overflow-hidden rounded-3xl">{messages.length ? messages.map((message) => <button type="button" key={message.id} onClick={() => setSelected(message)} className={`flex w-full gap-4 p-5 text-left transition hover:bg-primary/[.035] ${selected?.id === message.id ? "bg-primary/[.06]" : ""}`}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/[.09] text-primary"><MessageSquareText className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="truncate text-sm font-semibold">{message.subject || "General question"}</p><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase ${statusTone[message.status] || statusTone.New}`}>{message.status}</span></div><p className="mt-1 text-xs text-stone">{message.name} · {message.email}</p><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/70">{message.message}</p></div></button>) : <div className="p-14 text-center text-sm text-stone">No support messages yet.</div>}</div><div className="admin-surface rounded-3xl p-6">{selected ? <form onSubmit={save}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Support ticket</p><h2 className="mt-2 font-display text-2xl font-semibold">{selected.subject || "General question"}</h2></div><button type="button" onClick={() => setSelected(null)} className="rounded-xl bg-mist p-2"><X className="h-4 w-4" /></button></div><p className="mt-5 text-sm font-medium">{selected.name}</p><a className="text-sm text-primary" href={`mailto:${selected.email}`}>{selected.email}</a><div className="mt-5 rounded-2xl bg-mist/65 p-4 text-sm leading-relaxed text-ink/75">{selected.message}</div><label className="mt-6 block"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-stone">Status</span><select value={selected.status} onChange={(event) => setSelected({ ...selected, status: event.target.value })} className="mt-2 w-full rounded-xl border border-border/10 bg-white px-3 py-3 text-sm outline-none focus:border-primary">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="mt-5 block"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-stone">Reply / internal resolution note</span><textarea rows="6" value={selected.admin_reply || ""} onChange={(event) => setSelected({ ...selected, admin_reply: event.target.value })} placeholder="Write the response or resolution recorded for this customer…" className="mt-2 w-full rounded-xl border border-border/10 bg-white px-3 py-3 text-sm outline-none focus:border-primary" /></label><button disabled={saving} className="admin-quick-link admin-quick-link-primary mt-6"><Send className="h-3.5 w-3.5" />{saving ? "Saving…" : "Save ticket"}</button></form> : <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><MessageSquareText className="h-8 w-8 text-primary" /><p className="mt-4 font-medium">Select a support message</p><p className="mt-1 max-w-xs text-sm text-stone">Its conversation and resolution note will appear here.</p></div>}</div></section>}
  </div>;
}

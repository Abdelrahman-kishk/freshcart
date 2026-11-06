import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import api from '../api'
import { useApp } from '../context/AppContext'
import { Empty, Money, ProductCard, Skeletons } from '../components/ui'

const useGet = (url, deps = []) => {
  const [s, set] = useState({ data: null, loading: true, error: null })
  useEffect(() => { let on = true; set(x => ({ ...x, loading: true }))
    api.get(url).then(r => on && set({ data: r.data, loading: false, error: null })).catch(e => on && set({ data: null, loading: false, error: e.userMessage }))
    return () => { on = false } }, deps)
  return s
}

export function Home() {
  const cats = useGet('/categories'), prods = useGet('/products?limit=40&sort=-sold')
  const [i, setI] = useState(0); const slides = cats.data?.data?.slice(0, 5) || []
  useEffect(() => { if (!slides.length) return; const t = setInterval(() => setI(x => (x + 1) % slides.length), 4000); return () => clearInterval(t) }, [slides.length])
  return <>
    <section className="hero"><div className="wrap">
      <div><h1>Groceries picked this morning, at your door by tonight.</h1><p>Fruit, dairy, pantry staples and more. Pay on delivery or by card.</p><Link className="btn" to="/products">Start shopping</Link></div>
      {slides[i] && <Link to={`/categories/${slides[i]._id}`} className="slide"><img src={slides[i].image} alt={slides[i].name} /><span>{slides[i].name}</span></Link>}
    </div></section>
    <section className="wrap"><h2>Shop by category</h2>
      <div className="strip">{cats.data?.data?.map(c => <Link key={c._id} to={`/categories/${c._id}`}><img src={c.image} alt="" /><span>{c.name}</span></Link>)}</div></section>
    <section className="promo"><div className="wrap"><b>Free delivery over 500 EGP</b><span>Applied automatically at checkout.</span></div></section>
    <section className="wrap"><h2>Top selling</h2>{prods.loading ? <Skeletons /> : <div className="grid">{(prods.data?.data || []).slice(0, 12).map(p => <ProductCard key={p._id} p={p} />)}</div>}</section></>
}

export function Products({ filter = '', title = 'All products' }) {
  const [sp, setSp] = useSearchParams(); const q = sp.get('q') || '', sort = sp.get('sort') || ''
  const { data, loading, error } = useGet(`/products?limit=60${filter}${sort ? `&sort=${sort}` : ''}`, [filter, sort])
  const list = useMemo(() => (data?.data || []).filter(p => p.title.toLowerCase().includes(q.toLowerCase())), [data, q])
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }) }
  return <section className="wrap"><h1>{title}</h1>
    <div className="filters"><input placeholder="Search products" value={q} onChange={e => set('q', e.target.value)} aria-label="Search" />
      <select value={sort} onChange={e => set('sort', e.target.value)} aria-label="Sort"><option value="">Featured</option><option value="price">Price: low to high</option><option value="-price">Price: high to low</option><option value="-ratingsAverage">Top rated</option></select></div>
    {loading ? <Skeletons /> : error ? <Empty text={error} /> : list.length ? <div className="grid">{list.map(p => <ProductCard key={p._id} p={p} />)}</div> : <Empty text="No products match your search." to="/products" cta="Clear search" />}</section>
}

export function ProductDetails() {
  const { id } = useParams(); const { data, loading } = useGet(`/products/${id}`, [id]); const { addToCart, toggleWish, wishlist, token, busy } = useApp()
  const [img, setImg] = useState(0); useEffect(() => setImg(0), [id])
  if (loading) return <div className="wrap"><div className="skel tall" /></div>
  const p = data?.data; if (!p) return <Empty text="Product not found." />
  const imgs = [p.imageCover, ...(p.images || [])], liked = wishlist.includes(p._id), gate = fn => token ? fn() : location.assign('/login')
  return <section className="wrap detail">
    <div><img className="main" src={imgs[img]} alt={p.title} /><div className="thumbs">{imgs.map((s, k) => <img key={k} src={s} alt="" className={k === img ? 'on' : ''} onClick={() => setImg(k)} />)}</div></div>
    <div><small>{p.category?.name} / {p.brand?.name}</small><h1>{p.title}</h1><p>{p.description}</p>
      <p><b className="price"><Money v={p.priceAfterDiscount || p.price} /></b> ★ {p.ratingsAverage} ({p.ratingsQuantity})</p>
      <p className={p.quantity > 0 ? 'ok' : 'bad'}>{p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}</p>
      <div className="row"><button className="btn" disabled={busy || p.quantity < 1} onClick={() => gate(() => addToCart(p._id))}>Add to cart</button>
        <button className="btn ghost" onClick={() => gate(() => toggleWish(p._id))}>{liked ? '♥ Saved' : '♡ Save'}</button></div></div></section>
}

export function Grouped({ kind }) {
  const { data, loading } = useGet(`/${kind}`, [kind])
  return <section className="wrap"><h1>{kind === 'brands' ? 'Brands' : 'Categories'}</h1>{loading ? <Skeletons n={8} /> :
    <div className="grid">{(data?.data || []).map(c => <Link className="card tile" key={c._id} to={`/${kind}/${c._id}`}><img src={c.image} alt="" /><h3>{c.name}</h3></Link>)}</div>}</section>
}
export function GroupDetails({ kind }) {
  const { id } = useParams(); const { data } = useGet(`/${kind}/${id}`, [id])
  return <Products key={id} filter={kind === 'brands' ? `&brand=${id}` : `&category[in]=${id}`} title={data?.data?.name || 'Loading…'} />
}

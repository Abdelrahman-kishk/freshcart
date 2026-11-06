import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api'
import { useApp } from '../context/AppContext'

const Field = ({ label, error, ...p }) => <label className="field">{label}<input {...p} aria-invalid={!!error} />{error && <em>{error}</em>}</label>
function useForm(init, validate, submit) {
  const [v, setV] = useState(init), [err, setErr] = useState({}), [loading, setL] = useState(false)
  const bind = k => ({ name: k, value: v[k], onChange: e => setV({ ...v, [k]: e.target.value }), error: err[k] })
  const onSubmit = async e => { e.preventDefault(); const er = validate(v); setErr(er); if (Object.keys(er).length) return
    setL(true); try { await submit(v) } catch (x) { toast.error(x.userMessage) } finally { setL(false) } }
  return { bind, onSubmit, loading }
}
const Shell = ({ title, children }) => <section className="wrap auth"><h1>{title}</h1>{children}</section>
const mail = v => /^\S+@\S+\.\S+$/.test(v), pass = v => /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(v)

export function Login() {
  const { login } = useApp(), nav = useNavigate(), from = useLocation().state?.from || '/'
  const f = useForm({ email: '', password: '' }, v => ({ ...(!mail(v.email) && { email: 'Enter a valid email' }), ...(!v.password && { password: 'Password is required' }) }),
    async v => { const { data } = await api.post('/auth/signin', v); login(data.token, data.user); toast.success('Welcome back'); nav(from, { replace: true }) })
  return <Shell title="Sign in"><form onSubmit={f.onSubmit}><Field label="Email" type="email" {...f.bind('email')} /><Field label="Password" type="password" {...f.bind('password')} />
    <button className="btn full" disabled={f.loading}>{f.loading ? 'Signing in…' : 'Sign in'}</button><p><Link to="/forgot">Forgot password?</Link> · <Link to="/register">Create account</Link></p></form></Shell>
}
export function Register() {
  const nav = useNavigate()
  const f = useForm({ name: '', email: '', phone: '', password: '', rePassword: '' }, v => ({
    ...(v.name.trim().length < 3 && { name: 'At least 3 characters' }), ...(!mail(v.email) && { email: 'Enter a valid email' }),
    ...(!/^01[0125][0-9]{8}$/.test(v.phone) && { phone: 'Use an Egyptian mobile number' }), ...(!pass(v.password) && { password: '6+ characters with a letter and a number' }),
    ...(v.password !== v.rePassword && { rePassword: 'Passwords do not match' }) }),
    async v => { await api.post('/auth/signup', v); toast.success('Account created. Sign in to continue.'); nav('/login') })
  return <Shell title="Create your account"><form onSubmit={f.onSubmit}><Field label="Full name" {...f.bind('name')} /><Field label="Email" type="email" {...f.bind('email')} /><Field label="Phone" type="tel" {...f.bind('phone')} />
    <Field label="Password" type="password" {...f.bind('password')} /><Field label="Confirm password" type="password" {...f.bind('rePassword')} /><button className="btn full" disabled={f.loading}>{f.loading ? 'Creating…' : 'Create account'}</button></form></Shell>
}
export function Forgot() {
  const [step, setStep] = useState(1), [email, setEmail] = useState(''), nav = useNavigate()
  const f1 = useForm({ email: '' }, v => mail(v.email) ? {} : { email: 'Enter a valid email' }, async v => { await api.post('/auth/forgotPasswords', v); setEmail(v.email); toast.success('Code sent to your email'); setStep(2) })
  const f2 = useForm({ resetCode: '' }, v => v.resetCode.trim() ? {} : { resetCode: 'Enter the code from your email' }, async v => { await api.post('/auth/verifyResetCode', v); setStep(3) })
  const f3 = useForm({ newPassword: '' }, v => pass(v.newPassword) ? {} : { newPassword: '6+ characters with a letter and a number' },
    async v => { await api.put('/auth/resetPassword', { email, newPassword: v.newPassword }); toast.success('Password updated. Sign in.'); nav('/login') })
  const f = [null, f1, f2, f3][step]
  return <Shell title="Reset your password"><form onSubmit={f.onSubmit} key={step}>
    {step === 1 && <Field label="Email" type="email" {...f.bind('email')} />}{step === 2 && <Field label="Verification code" {...f.bind('resetCode')} />}{step === 3 && <Field label="New password" type="password" {...f.bind('newPassword')} />}
    <button className="btn full" disabled={f.loading}>{['', 'Send code', 'Verify code', 'Save new password'][step]}</button></form></Shell>
}
export function Account() {
  const { login, user, logout } = useApp()
  const f = useForm({ currentPassword: '', password: '', rePassword: '' }, v => ({ ...(!v.currentPassword && { currentPassword: 'Required' }), ...(!pass(v.password) && { password: '6+ characters with a letter and a number' }), ...(v.password !== v.rePassword && { rePassword: 'Passwords do not match' }) }),
    async v => { const { data } = await api.put('/users/changeMyPassword', v); login(data.token, user); toast.success('Password changed') })
  return <Shell title="Change password"><form onSubmit={f.onSubmit}><Field label="Current password" type="password" {...f.bind('currentPassword')} /><Field label="New password" type="password" {...f.bind('password')} /><Field label="Confirm new password" type="password" {...f.bind('rePassword')} />
    <button className="btn full" disabled={f.loading}>Change password</button></form><p><button className="btn ghost" onClick={logout}>Sign out</button></p></Shell>
}

import React,{useState} from 'react';
import {Link,useNavigate,useLocation} from 'react-router-dom';
import { Eye,EyeOff,LogIn } from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import AuthLayout from '@/components/journal/AuthLayout';
export default function LoginPage(){
const auth=useAuth(),navigate=useNavigate(),location=useLocation();
const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
async function submit(e){e.preventDefault();setError('');setBusy(true);try{await auth.login(email.trim(),password);navigate('/home');}catch(e){if(e.code==='verification_required')navigate('/verify-pending');else setError(e.status===0?'Der Server ist nicht erreichbar. Bitte später erneut versuchen.':'Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.');}finally{setBusy(false);}}
return <AuthLayout title="Willkommen zurück." subtitle="Öffne dein Journal und knüpfe an deinen letzten Review an.">{location.state?.verified&&<p role="status" className="text-sm text-primary mb-5">E-Mail erfolgreich bestätigt. Du kannst dich jetzt anmelden.</p>}<form onSubmit={submit} className="space-y-5"><label className="form-field">E-Mail<Input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="form-field">Passwort<div className="relative"><Input type={show?'text':'password'} required autoComplete="current-password" className="pr-12" value={password} onChange={e=>setPassword(e.target.value)}/><Button type="button" size="icon" variant="ghost" className="absolute right-0 top-0" aria-label={show?'Passwort verbergen':'Passwort anzeigen'} onClick={()=>setShow(!show)}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</Button></div></label><Link to="/reset-password" className="block text-xs text-primary">Passwort vergessen?</Link>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy} className="w-full"><LogIn size={16} className="mr-2"/>{busy?'Anmelden…':'Journal öffnen'}</Button></form><p className="mt-6 text-sm text-muted-foreground">Noch kein Konto? <Link to="/signup" className="text-primary">Kostenlos registrieren</Link></p><Link className="block mt-4 text-xs text-muted-foreground hover:text-primary" to="/verify-pending">E-Mail noch nicht bestätigt?</Link></AuthLayout>;
}

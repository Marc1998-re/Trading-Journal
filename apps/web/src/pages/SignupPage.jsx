import React,{useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import AuthLayout from '@/components/journal/AuthLayout';
export default function SignupPage(){
const {signup}=useAuth(),navigate=useNavigate(),[form,setForm]=useState({name:'',email:'',password:'',passwordConfirm:''}),[busy,setBusy]=useState(false),[error,setError]=useState('');
async function submit(e){e.preventDefault();setError('');if(form.password!==form.passwordConfirm)return setError('Die Passwörter stimmen nicht überein.');setBusy(true);try{const result=await signup(form.email.trim(),form.password,form.passwordConfirm,form.name.trim());navigate('/verify-pending',{state:{email:form.email.trim(),mailRequested:result.verificationRequested}});}catch(e){setError(e.message);}finally{setBusy(false);}}
return <AuthLayout title="Dein Journal beginnt hier." subtitle="Aktuell kostenlos. Ohne Zahlungsdaten und ohne kostenpflichtiges Abo."><form onSubmit={submit} className="space-y-5">{[['name','Name','text','name'],['email','E-Mail','email','email'],['password','Passwort · mindestens 12 Zeichen','password','new-password'],['passwordConfirm','Passwort bestätigen','password','new-password']].map(([key,label,type,auto])=><label key={key} className="form-field">{label}<Input type={type} autoComplete={auto} required minLength={type==='password'?12:undefined} maxLength={type==='password'?128:200} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<label className="flex gap-3 text-xs text-muted-foreground leading-relaxed"><input type="checkbox" required className="mt-1 accent-primary shrink-0"/><span>Ich akzeptiere die <Link to="/terms" className="text-primary">Nutzungsbedingungen</Link>. Die <Link to="/privacy" className="text-primary">Datenschutzhinweise</Link> habe ich gelesen.</span></label>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy} className="w-full">{busy?'Konto wird erstellt…':'Kostenlos registrieren'}<ArrowRight size={16} className="ml-2"/></Button></form><p className="mt-6 text-sm text-muted-foreground">Bereits registriert? <Link to="/login" className="text-primary">Anmelden</Link></p></AuthLayout>;
}

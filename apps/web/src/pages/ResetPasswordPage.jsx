import React,{useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import AuthLayout from '@/components/journal/AuthLayout';
import pb from '@/lib/pocketbaseClient';
export default function ResetPasswordPage(){
 const token=new URLSearchParams(useLocation().search).get('token');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('');
 async function submit(e){e.preventDefault();setError('');if(token&&password!==confirm)return setError('Die Passwörter stimmen nicht überein.');setBusy(true);try{if(token)await pb.collection('users').confirmPasswordReset(token,password,confirm);else await pb.collection('users').requestPasswordReset(email.trim());setDone(true);}catch{setError(token?'Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.':'Die Anfrage ist fehlgeschlagen. Bitte später erneut versuchen.');}finally{setBusy(false);}}
 return <AuthLayout title={token?'Neues Passwort.':'Passwort zurücksetzen.'} subtitle="Ein sicherer Weg zurück in dein Journal.">{done?<p role="status" className="text-sm text-primary">{token?'Dein Passwort wurde geändert. Melde dich erneut an.':'Falls ein Konto zu dieser Adresse existiert, wird ein Link zum Zurücksetzen versendet.'}</p>:<form onSubmit={submit} className="space-y-5">{token?<><label className="form-field">Neues Passwort · mindestens 12 Zeichen<Input type="password" autoComplete="new-password" required minLength={12} value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="form-field">Passwort bestätigen<Input type="password" autoComplete="new-password" required minLength={12} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label></>:<label className="form-field">E-Mail<Input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy} className="w-full">{busy?'Wird verarbeitet…':token?'Passwort ändern':'Link anfordern'}</Button></form>}<Link to="/login" className="block mt-6 text-sm text-primary">Zur Anmeldung</Link></AuthLayout>;
}

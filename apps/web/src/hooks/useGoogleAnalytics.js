import {useCallback} from 'react';
export const GA_MEASUREMENT_ID=import.meta.env.VITE_GA_MEASUREMENT_ID||'';
// Auth and journal routes never send URLs, tokens, or financial data to analytics.
export const useGoogleAnalytics=()=>{
 const initGA=useCallback(()=>{
   if(!GA_MEASUREMENT_ID||location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.pathname!=='/'||localStorage.getItem('cookieConsent')!=='accepted')return;
   if(document.getElementById('ga-script'))return;
   window.dataLayer=window.dataLayer||[];
   window.gtag=function(){window.dataLayer.push(arguments);};
   window.gtag('js',new Date());
   window.gtag('config',GA_MEASUREMENT_ID,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
   window.gtag('event','page_view',{page_location:location.origin+'/',page_path:'/'});
   const script=document.createElement('script');script.id='ga-script';script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_MEASUREMENT_ID);document.head.appendChild(script);
 },[]);
 return {initGA,trackPageView:()=>{},trackEvent:()=>{}};
};

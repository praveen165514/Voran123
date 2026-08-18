import { initializeApp } from 'firebase/app';
import { initializeAuth, browserSessionPersistence, browserPopupRedirectResolver } from 'firebase/auth';
console.log(!!initializeAuth);

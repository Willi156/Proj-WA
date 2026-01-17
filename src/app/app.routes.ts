import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { Signup } from './signup/signup';

export const routes: Routes = [
	{ path: '', component: LoginComponent, pathMatch: 'full' },
	//{ path: '**', redirectTo: '' },
	{path:'signup', component: Signup, pathMatch:'full'}
];

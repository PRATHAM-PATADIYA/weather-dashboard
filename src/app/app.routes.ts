import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard',
	},
	{
		path: 'login',
		component: LoginPageComponent,
	},
	{
		path: 'dashboard',
		canActivate: [authGuard],
		component: DashboardPageComponent,
	},
	{
		path: '**',
		redirectTo: 'dashboard',
	},
];

import { Routes } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { CommandBuilderComponent } from './components/command-builder/command-builder.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard/analytics-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/chat', pathMatch: 'full' },
  { path: 'chat', component: ChatComponent },
  { path: 'command-builder', component: CommandBuilderComponent },
  { path: 'analytics', component: AnalyticsDashboardComponent },
  { path: '**', redirectTo: '/chat' }
];

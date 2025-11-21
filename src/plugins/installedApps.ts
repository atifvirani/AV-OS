import { registerPlugin } from '@capacitor/core';
import { InstalledAppsPlugin } from '../../types';

const InstalledApps = registerPlugin<InstalledAppsPlugin>('InstalledApps');

export default InstalledApps;
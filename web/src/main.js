import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import App from './App.vue';
import router from './router';

// PrimeVue components
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputNumber from 'primevue/inputnumber';
import Tag from 'primevue/tag';

// PrimeVue styles
import 'primevue/resources/themes/lara-light-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

// Tabulator styles
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

// App styles
import '@/assets/styles.css';

const app = createApp(App);

// Install router
app.use(router);

// Install PrimeVue
app.use(PrimeVue, { ripple: true }); // ripple意思: 按鈕點擊時會有水波紋效果

// Register PrimeVue components globally
app.component('p-button', Button);
app.component('p-card', Card);
app.component('p-inputnumber', InputNumber);
app.component('p-tag', Tag);

app.mount('#app');

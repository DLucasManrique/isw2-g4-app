```typescript
import { API_URL } from '../config/api';

export async function getTorneos() {
  const response = await fetch(`${API_URL}/api/catalogo/torneos`);
  return await response.json();
}

export async function getCanchas() {
  const response = await fetch(`${API_URL}/api/catalogo/canchas`);
  return await response.json();
}

export async function getArbitros() {
  const response = await fetch(`${API_URL}/api/catalogo/arbitros`);
  return await response.json();
}
```
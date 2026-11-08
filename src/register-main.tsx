import React from 'react';
import { createRoot } from 'react-dom/client';
import { PlayerRegister } from './pages/PlayerRegister';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <PlayerRegister />
    </React.StrictMode>
);

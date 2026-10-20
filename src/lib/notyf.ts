import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

// Una sola instancia compartida por toda la app
export const notyf = new Notyf({ duration: 3500 });
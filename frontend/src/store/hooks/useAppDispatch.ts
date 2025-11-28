import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../index.js';

export const useAppDispatch = () => useDispatch<AppDispatch>();

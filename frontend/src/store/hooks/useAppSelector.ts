import { useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '../index.js';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Analysis } from '@/types';

// Frontend-only store for saved analyses (dummy phase) — replaced by the analyses CRUD API later.
interface AnalysesState {
  items: Analysis[];
  hydrated: boolean;
}

const initialState: AnalysesState = { items: [], hydrated: false };

const analysesSlice = createSlice({
  name: 'analyses',
  initialState,
  reducers: {
    hydrateAnalyses: (state, action: PayloadAction<Analysis[]>) => {
      state.items = action.payload;
      state.hydrated = true;
    },
    upsertAnalysis: (state, action: PayloadAction<Analysis>) => {
      const i = state.items.findIndex((a) => a.id === action.payload.id);
      if (i === -1) state.items.unshift(action.payload);
      else state.items[i] = action.payload;
    },
    removeAnalysis: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((a) => a.id !== action.payload);
    },
  },
});

export const { hydrateAnalyses, upsertAnalysis, removeAnalysis } = analysesSlice.actions;
export default analysesSlice.reducer;

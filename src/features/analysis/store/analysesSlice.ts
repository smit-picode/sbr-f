import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Analysis, AnalysesState } from '@/types';

const initialState: AnalysesState = { items: [] };

const analysesSlice = createSlice({
  name: 'analyses',
  initialState,
  reducers: {
    upsertAnalysis: (state, action: PayloadAction<Analysis>) => {
      const i = state.items.findIndex((a) => a.id === action.payload.id);
      if (i === -1) state.items.unshift(action.payload);
      else state.items[i] = action.payload;
    },
    // After a save only the server-owned fields move, so edits typed during the request are kept.
    markAnalysisSaved: (state, action: PayloadAction<Pick<Analysis, 'id' | 'rowVersion' | 'updatedAt'>>) => {
      const a = state.items.find((x) => x.id === action.payload.id);
      if (!a) return;
      a.rowVersion = action.payload.rowVersion;
      a.updatedAt = action.payload.updatedAt;
    },
    removeAnalysis: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((a) => a.id !== action.payload);
    },
  },
});

export const { upsertAnalysis, markAnalysisSaved, removeAnalysis } = analysesSlice.actions;
export default analysesSlice.reducer;

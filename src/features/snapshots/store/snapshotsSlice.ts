import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Snapshot } from '@/types';
import { MOCK_SNAPSHOTS, LIVE_COUNTS, generateMockEstablishments, generateMockEnterprises, generateMockContacts, generateMockAddresses } from '../mockData';

interface SnapshotsState {
  items: Snapshot[];
}

const initialState: SnapshotsState = {
  items: MOCK_SNAPSHOTS,
};

const snapshotsSlice = createSlice({
  name: 'snapshots',
  initialState,
  reducers: {
    // Frontend-only stand-in for the freeze procedure (pending from the DB engineer,
    // NPC-153). Captures the same "live" counts shown on the Create Snapshot page.
    createSnapshot: (state, action: PayloadAction<{ name: string; description: string; frozenBy: string }>) => {
      const nextId = state.items.length ? Math.max(...state.items.map((s) => s.ID)) + 1 : 1;
      state.items.unshift({
        ID: nextId,
        NAME: action.payload.name,
        DESCRIPTION: action.payload.description || null,
        FROZEN_AT: new Date().toISOString(),
        FROZEN_BY: action.payload.frozenBy,
        establishments: generateMockEstablishments(LIVE_COUNTS.establishments, 10),
        enterprises: generateMockEnterprises(LIVE_COUNTS.enterprises),
        contacts: generateMockContacts(LIVE_COUNTS.contacts, LIVE_COUNTS.establishments),
        addresses: generateMockAddresses(LIVE_COUNTS.addresses, LIVE_COUNTS.establishments),
      });
    },
  },
});

export const { createSnapshot } = snapshotsSlice.actions;
export default snapshotsSlice.reducer;

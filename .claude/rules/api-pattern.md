# RTK Query API Pattern

## Base API
Location: `src/services/api.ts`
- Single `baseApi` instance — all feature APIs inject into this
- Base URL: `${env.apiUrl}/api/v1`
- Auth header: `x-auth-token` from localStorage key `sbr_token`
- Tag types: `['Frame', 'Contacts', 'Addresses', 'Auth', 'AuditLog']`
  → Add new tag here when adding a new feature

## Inject Endpoints Pattern
Every feature has its own file under `src/features/{feature}/api/{feature}Api.ts`:

```typescript
import { baseApi } from '@/services/api';
import type { ApiResponse, MyType, MyFilters } from '@/types';

export const myApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET list
    getMyList: builder.query<ApiResponse<MyType[]>, MyFilters>({
      query: (params) => ({ url: '/my-resource', params }),
      providesTags: ['MyTag'],
    }),
    // PUT update
    updateMy: builder.mutation<ApiResponse<MyType>, { id: number; data: Partial<MyType> }>({
      query: ({ id, data }) => ({ url: `/my-resource/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['MyTag', 'AuditLog'],   // ALWAYS include 'AuditLog' on mutations
    }),
  }),
  overrideExisting: false,   // always false
});

export const { useGetMyListQuery, useUpdateMyMutation } = myApi;
```

## Rules
1. Always `invalidatesTags: ['AuditLog']` on every mutation — keeps audit log page fresh
2. Use `providesTags` on queries — enables auto-refresh when tags are invalidated
3. `overrideExisting: false` always
4. Export named hooks at the bottom of the file — same file, not separate

## Using in Components

```typescript
// Query
const { data, isLoading, isError, refetch } = useGetMyListQuery(cleanParams(filters));

// Mutation
const [updateMy, { isLoading }] = useUpdateMyMutation();
await updateMy({ id: record.ID, data: form }).unwrap();  // .unwrap() throws on error
```

## cleanParams — Always wrap filters
```typescript
import { cleanParams } from '@/utils/query';
// Removes empty strings, null, undefined before sending to API
const queryParams = cleanParams(filters);
useGetMyListQuery(queryParams);
```

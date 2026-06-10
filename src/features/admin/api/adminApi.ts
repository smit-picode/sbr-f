import { baseApi } from '@/services/api';
import type { ApiResponse, SbrPermission, SbrRole, SbrRoleWithPermissions, SbrUser, RolePermissionAssignment, AdminPermissionFilters, AdminRoleFilters, AdminUserFilters } from '@/types';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Permissions
    getPermissionsList: builder.query<ApiResponse<SbrPermission[]>, AdminPermissionFilters>({
      query: (params) => ({ url: '/admin/permissions', params }),
      providesTags: ['Admin'],
      keepUnusedDataFor: 0,
    }),
    createPermission: builder.mutation<ApiResponse<SbrPermission>, { PERMISSION_NAME: string }>({
      query: (data) => ({ url: '/admin/permissions', method: 'POST', body: data }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
    updatePermission: builder.mutation<ApiResponse<SbrPermission>, { id: number; data: { PERMISSION_NAME: string } }>({
      query: ({ id, data }) => ({ url: `/admin/permissions/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
    deletePermission: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/admin/permissions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),

    // Roles
    getRolesList: builder.query<ApiResponse<SbrRole[]>, AdminRoleFilters>({
      query: (params) => ({ url: '/admin/roles', params }),
      providesTags: ['Admin'],
      keepUnusedDataFor: 0,
    }),
    getRoleById: builder.query<ApiResponse<SbrRoleWithPermissions>, number>({
      query: (id) => ({ url: `/admin/roles/${id}` }),
      providesTags: ['Admin'],
      keepUnusedDataFor: 0,
    }),
    createRole: builder.mutation<ApiResponse<SbrRole>, { ROLE_NAME: string; permissions?: number[] }>({
      query: (data) => ({ url: '/admin/roles', method: 'POST', body: data }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
    updateRole: builder.mutation<ApiResponse<SbrRole>, { id: number; data: { ROLE_NAME: string } }>({
      query: ({ id, data }) => ({ url: `/admin/roles/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
    deleteRole: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/admin/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),

    // Role Permissions
    getRolePermissions: builder.query<ApiResponse<SbrPermission[]>, number>({
      query: (roleId) => ({ url: `/admin/role-permissions/${roleId}` }),
      providesTags: ['Admin'],
      keepUnusedDataFor: 0,
    }),
    assignRolePermissions: builder.mutation<ApiResponse<void>, { roleId: number; permissions: number[] }>({
      query: ({ roleId, permissions }) => ({ url: `/admin/role-permissions/${roleId}`, method: 'POST', body: { permissions } }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),

    // Users
    getUsersList: builder.query<ApiResponse<SbrUser[]>, AdminUserFilters>({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['Admin'],
      keepUnusedDataFor: 0,
    }),
    getUserById: builder.query<ApiResponse<SbrUser>, number>({
      query: (id) => ({ url: `/admin/users/${id}` }),
      providesTags: ['Admin'],
      keepUnusedDataFor: 0,
    }),
    createUser: builder.mutation<ApiResponse<SbrUser>, { NAME: string; EMAIL: string; PASSWORD: string; ROLE_ID: number }>({
      query: (data) => ({ url: '/admin/users', method: 'POST', body: data }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
    updateUser: builder.mutation<ApiResponse<SbrUser>, { id: number; data: { NAME?: string; ROLE_ID?: number } }>({
      query: ({ id, data }) => ({ url: `/admin/users/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
    deleteUser: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPermissionsListQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useGetRolesListQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetRolePermissionsQuery,
  useAssignRolePermissionsMutation,
  useGetUsersListQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = adminApi;

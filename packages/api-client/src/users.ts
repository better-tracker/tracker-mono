//users api client

import { userListResponseSchema,
    userResponseSchema,
    type UserCreate,
    type UserListResponse,
    type UserResponse,
    type UserUpdate,
    } from '@project-tracker/contracts';

import { request } from './http_helper.js';

// get a list of users
export const getUsers = async (
    baseUrl: string,
    limit = 40,
    offset = 0,
): Promise<UserListResponse> => {
    const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
    });

    const response = await request<unknown>(
        baseUrl,
        `/v1/users?${params.toString()}`,
    ); 

     return userListResponseSchema.parse(response);
};

export const getUser = async (
    baseUrl: string,
    userId: string,
): Promise<UserResponse> => {
    const response = await request<unknown>(
        baseUrl,
        `/v1/users/${encodeURIComponent(userId)}`,
    );
    return userResponseSchema.parse(response);
};

export const createUser = async (
    baseUrl: string,
    user: UserCreate,
): Promise<UserResponse> => {
    const response = await request<unknown>(
        baseUrl,
        `/v1/users`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        }
    );
    return userResponseSchema.parse(response);
};

export const updateUser = async (
    baseUrl: string,
    userId: string,
    user: UserUpdate,
): Promise<UserResponse> => {
    const response = await request<unknown>( 
        baseUrl,
        `/v1/users/${encodeURIComponent(userId)}`,
        {
            method: 'PUT',
            body: JSON.stringify(user),
        }
    );
    return userResponseSchema.parse(response);
};

export const deleteUser = async (
    baseUrl: string,
    userId: string,
): Promise<void> => {
    await request<unknown>(
        baseUrl,
        `/v1/users/${userId}`,
        {
            method: 'DELETE',
        }
    );
};


export const ensureUser = async (
  baseUrl: string,
  accessToken: string,
): Promise<UserResponse> => {
  const response = await request<unknown>(baseUrl, '/v1/users/me', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return userResponseSchema.parse(response);
};

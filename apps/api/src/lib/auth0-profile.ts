import {
  MAX_USERNAME_LENGTH,
  userCreateSchema,
} from '@project-tracker/contracts';
import type { UserCreate } from '@project-tracker/contracts';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';

class Auth0ProfileError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'Auth0ProfileError';
  }
}

export async function getAuth0Profile(
  authorization: string | undefined,
  expectedSub: string,
): Promise<UserCreate> {
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    throw new Auth0ProfileError(
      'A bearer access token is required',
      StatusCodes.UNAUTHORIZED,
    );
  }

  const domain = env.auth0Domain
    .replace(/^https:\/\//, '')
    .replace(/\/$/, '');

  let response: Response;

  try {
    response = await fetch(`https://${domain}/userinfo`, {
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
      redirect: 'error',
    });
  } catch {
    throw new Auth0ProfileError(
      'Unable to retrieve Auth0 profile',
      StatusCodes.BAD_GATEWAY,
    );
  }

  if (!response.ok) {
    const statusCode =
      response.status === StatusCodes.UNAUTHORIZED
        ? StatusCodes.UNAUTHORIZED
        : StatusCodes.BAD_GATEWAY;

    throw new Auth0ProfileError(
      'Unable to retrieve Auth0 profile',
      statusCode,
    );
  }

  let profile: unknown;

  try {
    profile = await response.json();
  } catch {
    throw new Auth0ProfileError(
      'Auth0 returned an invalid profile',
      StatusCodes.BAD_GATEWAY,
    );
  }

  if (
    typeof profile !== 'object' ||
    profile === null ||
    !('sub' in profile) ||
    profile.sub !== expectedSub
  ) {
    throw new Auth0ProfileError(
      'Auth0 profile does not match the authenticated user',
      StatusCodes.UNAUTHORIZED,
    );
  }

  const name =
    'name' in profile && typeof profile.name === 'string'
      ? profile.name.trim()
      : '';

  const nickname =
    'nickname' in profile && typeof profile.nickname === 'string'
      ? profile.nickname.trim()
      : '';

  const result = userCreateSchema.safeParse({
    user_name: (name || nickname || 'User').slice(
      0,
      MAX_USERNAME_LENGTH,
    ),
    email: 'email' in profile ? profile.email : undefined,
    profile_pic:
      'picture' in profile && typeof profile.picture === 'string'
        ? profile.picture
        : null,
  });

  if (!result.success) {
    throw new Auth0ProfileError(
      'Auth0 profile must contain a valid email and display name',
      StatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  return result.data;
}
export type UserInfoCache = {
  firstName: string;
  lastName: string;
  username: string;
  profileImage: string | null;
} | null;

export let userInfoCache: UserInfoCache = null;

export function setUserInfoCache(value: UserInfoCache) {
  userInfoCache = value;
}
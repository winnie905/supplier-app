/** apex-bff User.id 在不同接口中可能以 number 或 string 暴露。 */
export type UserId = number | string;

/** apex-bff User 摘要字段，maintainer / reporter / follower 等场景共用。 */
export interface UserSummary {
  id?: UserId;
  username?: string;
  firstName?: string;
  lastName?: string;
}

/** App 当前用到的 apex-bff User 字段集合。 */
export interface User extends UserSummary {
  email?: string;
  mobile?: string;
  avatar?: string;
  name?: string;
  pinyinAbbreviation?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  category?: {
    id?: UserId;
    name?: string;
    parentId?: UserId | null;
    type?: string;
  };
}

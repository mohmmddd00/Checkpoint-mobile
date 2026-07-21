export interface InitialEngagement {
  likes: number;
  dislikes: number;
  userReaction: "like" | "dislike" | null;
  isOwnLog: boolean;
  commentCount: number;
}
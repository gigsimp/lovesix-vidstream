export type Video = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: string | number;
  views: number;
  created_at: string;
  category_id: string | null;
  creator_name: string | null;
  creator_avatar: string | null;
  category_name: string | null;
  is_published: boolean;
  tags: string[];
};

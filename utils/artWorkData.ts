import { LocationObjectCoords } from "expo-location";

// Interface representing the structure of an artwork
export interface ArtworkData {
  savesCount: number;
  exhibitions: boolean;
  exhibitionDetails: { id: string; name: string; location: string; date: string }[] | null;
  commentsCount: number;
  name: string;
  createdAt: string | number | Date;
  title: string;
  description: string;
  id: string;
  artist: string;
  isLiked: boolean;
  likesCount: number;
  likes: string[]; // Array av bruker-IDer som har likt innlegget
  isSaved: boolean; // Nytt felt for å indikere om brukeren har lagret innlegget
  saves: string[]; // Array av bruker-IDer som har lagret innlegget
  hashtags: string;
  imageURL: string;
  postCoordinates: LocationObjectCoords | null;
  city?: string;
  comments: CommentData[];
  timestamp?: number;
  userId: string;
}

// Interface representing a comment
export interface CommentData {
  [x: string]: string | number | Date; 
  id: string;                       // Unique identifier for the comment
  authorId: string;                 // ID of the comment's author
  authorName: string;               // Name of the comment's author
  comment: string; 
  timestamp: number; // Tidspunkt for kommentaren
  authorProfileImage: string; 
}

// Optionally, if you need to manage comments separately
export interface CommentObject {
  id: string;                       // Unique identifier for the comment object
  comment: CommentData;             // Comment data associated with this object
}





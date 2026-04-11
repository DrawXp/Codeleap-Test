import { formatDistanceToNow } from 'date-fns';
import { MdDeleteForever, MdEdit, MdComment } from 'react-icons/md';
import { AiOutlineLike } from 'react-icons/ai';

interface Post {
  id: number;
  username: string;
  created_datetime: string;
  title: string;
  content: string;
}

interface PostItemProps {
  post: Post;
  currentUser: string;
  localImage?: string;
  likes: number;
  comments: { username: string; text: string }[];
  commentInput: string;
  onLike: (id: number) => void;
  onCommentChange: (id: number, value: string) => void;
  onCommentSubmit: (id: number) => void;
  onDeleteClick: (id: number) => void;
  onEditClick: (id: number, title: string, content: string) => void;
}

export function PostItem({
  post,
  currentUser,
  localImage,
  likes,
  comments,
  commentInput,
  onLike,
  onCommentChange,
  onCommentSubmit,
  onDeleteClick,
  onEditClick
}: PostItemProps) {
  return (
    <div className="glass-panel overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(12,242,244,0.15)] hover:-translate-y-1">
      <div className="bg-slate-800/60 text-white p-4 sm:p-6 flex justify-between items-center border-b border-white/10">
        <h3 className="text-[1.375rem] font-bold break-words w-4/5 text-white">{post.title}</h3>
        {post.username === currentUser && (
          <div className="flex gap-4">
            <button onClick={() => onDeleteClick(post.id)} className="text-gray-400 hover:text-[#FF5151] hover:scale-110 transition-all">
              <MdDeleteForever size={28} />
            </button>
            <button onClick={() => onEditClick(post.id, post.title, post.content)} className="text-gray-400 hover:text-white hover:scale-110 transition-all">
              <MdEdit size={24} />
            </button>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex justify-between text-gray-400 mb-4 text-sm sm:text-base">
          <span className="font-bold text-[var(--color-primary)]">@{post.username}</span>
          <span>{formatDistanceToNow(new Date(post.created_datetime))} ago</span>
        </div>
        <p className="text-gray-100 break-words whitespace-pre-wrap mb-4 leading-relaxed">{post.content}</p>
        
        {localImage && (
          <div className="mb-4 relative">
            <img 
              src={localImage} 
              alt="Post attachment" 
              className="w-full max-h-[25rem] object-cover rounded-lg border border-white/10 shadow-inner" 
            />
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 border-t border-white/10 pt-4">
          <button 
            onClick={() => onLike(post.id)}
            className="flex items-center gap-1 text-gray-400 hover:text-[var(--color-primary)] transition-all hover:scale-105 active:scale-95"
          >
            <AiOutlineLike size={22} />
            <span className="font-bold text-gray-200">{likes}</span>
          </button>
          <div className="flex items-center gap-1 text-gray-400">
            <MdComment size={22} />
            <span className="font-bold text-gray-200">{comments.length}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex flex-col gap-2 mb-3 max-h-40 overflow-y-auto">
            {comments.map((c, i) => (
              <div key={i} className="bg-slate-900/40 p-3 rounded-lg border border-white/5 text-sm text-gray-200">
                <span className="font-bold text-[var(--color-primary)] mr-2">@{c.username}:</span>
                <span className="break-words">{c.text}</span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => onCommentChange(post.id, e.target.value)}
              className="glass-input text-sm py-2 px-3 flex-grow"
            />
            <button
              onClick={() => onCommentSubmit(post.id)}
              disabled={!commentInput?.trim()}
              className="btn-primary py-2 px-4 text-sm whitespace-nowrap"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
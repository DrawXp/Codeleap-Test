import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { PostItem } from '../components/PostItem';
import { CreatePostForm } from '../components/CreatePostForm';
import { Toaster } from 'react-hot-toast';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { api } from '../services/api';
import { playSound } from '../utils/toast';
import { Modal } from '../components/Modal';

interface Post {
  id: number;
  username: string;
  created_datetime: string;
  title: string;
  content: string;
  image?: string;
}

export function Main() {
  const { username, logout } = useUser();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [localLikes, setLocalLikes] = useState<Record<number, number>>({});
  const [localImages, setLocalImages] = useState<Record<number, string>>({});
  const [localComments, setLocalComments] = useState<Record<number, { username: string, text: string }[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'recent' | 'alphabetical' | 'likes'>('recent');
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; postId: number | null }>({
    isOpen: false,
    postId: null,
  });

  const [editModal, setEditModal] = useState<{ isOpen: boolean; postId: number | null; title: string; content: string }>({
    isOpen: false,
    postId: null,
    title: '',
    content: '',
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!username) navigate('/');
  }, [username, navigate]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const isLoadingRef = useRef(false);

const fetchPosts = useCallback(async (url = '/', isLoadMore = false, search = '', sort = 'recent') => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const isBaseUrl = url === '/';
      const params = isBaseUrl ? {
        search: search || undefined,
        ordering: sort === 'alphabetical' ? 'title' : sort === 'likes' ? '-likes' : '-created_datetime'
      } : {};

      const response = await api.get(url, { params });
      
      setPosts(prev => isLoadMore ? [...prev, ...response.data.results] : response.data.results);
      setNextUrl(response.data.next);
    } catch (error) {
      console.error(error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts('/', false, debouncedSearchTerm, sortOption);
  }, [fetchPosts, debouncedSearchTerm, sortOption]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        if (nextUrl && !isLoadingRef.current) fetchPosts(nextUrl, true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [nextUrl, fetchPosts]);

  const handlePostCreated = (imageId?: number, imagePreview?: string) => {
    if (imageId && imagePreview) {
      setLocalImages(prev => ({
        ...prev,
        [imageId]: imagePreview
      }));
    }
    fetchPosts('/', false);
  };

  const handleDelete = async () => {
    if (deleteModal.postId !== null) {
      setIsDeleting(true);
      try {
        await api.delete(`/${deleteModal.postId}/`);
        setDeleteModal({ isOpen: false, postId: null });
        fetchPosts('/', false);
      } catch (error) {
        console.error(error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = async () => {
    if (editModal.postId !== null) {
      setIsEditing(true);
      try {
        await api.patch(`/${editModal.postId}/`, {
          title: editModal.title,
          content: editModal.content,
        });
        setEditModal({ isOpen: false, postId: null, title: '', content: '' });
        fetchPosts('/', false);
      } catch (error) {
        console.error(error);
      } finally {
        setIsEditing(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const handleLike = async (postId: number) => {
    setLocalLikes(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1
    }));

    /*
    // Like action simulation
    try {
      await api.patch(`${postId}/`, {
        likes: (localLikes[postId] || 0) + 1
      });
    } catch (err) {
      console.error('Likes require backend support', err);
    }
    */
  };

  const handleComment = async (postId: number) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;

    setLocalComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { username, text }]
    }));
    
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    playSound('comment');

    /*
    // Simulated API integration
    try {
      await api.post(`${postId}/comments/`, {
        username,
        text
      });
    } catch (err) {
      console.error('Comments require backend support', err);
    }
    */
  };
  
  const processedPosts = useMemo(() => {
    let result = [...posts];

    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(
        post => 
          post.title.toLowerCase().includes(term) || 
          post.content.toLowerCase().includes(term) ||
          post.username.toLowerCase().includes(term)
      );
    }

    if (sortOption === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === 'likes') {
      result.sort((a, b) => (localLikes[b.id] || 0) - (localLikes[a.id] || 0));
    } else {
      result.sort((a, b) => new Date(b.created_datetime).getTime() - new Date(a.created_datetime).getTime());
    }

    return result;
  }, [posts, debouncedSearchTerm, sortOption, localLikes]);
  
return (
    <div className="min-h-screen flex justify-center py-8 px-4">
      <Toaster />
      <div className="w-full max-w-[50rem] relative">
        <main>
          <div className="glass-panel mb-6">
			<Header onLogout={handleLogout} />
			<CreatePostForm 
              username={username} 
              onPostCreated={handlePostCreated} 
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center glass-panel p-4">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full sm:w-1/2"
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as 'recent' | 'alphabetical' | 'likes')}
              className="glass-input w-full sm:w-auto [&>option]:bg-slate-900"
            >
              <option value="recent">Most Recent</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>

          <div className="flex flex-col gap-6">
			{processedPosts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                currentUser={username}
                localImage={localImages[post.id]}
                likes={localLikes[post.id] || 0}
                comments={localComments[post.id] || []}
                commentInput={commentInputs[post.id] || ''}
                onLike={handleLike}
                onCommentChange={(id, value) => setCommentInputs(prev => ({ ...prev, [id]: value }))}
                onCommentSubmit={handleComment}
                onDeleteClick={(id) => setDeleteModal({ isOpen: true, postId: id })}
                onEditClick={(id, title, content) => setEditModal({ isOpen: true, postId: id, title, content })}
              />
            ))}
            {isLoading && <p className="text-center text-[var(--color-primary)] animate-pulse">Loading...</p>}
          </div>
        </main>

		<Modal
          isOpen={deleteModal.isOpen}
          title="Are you sure you want to delete this item?"
          onClose={() => setDeleteModal({ isOpen: false, postId: null })}
          onConfirm={handleDelete}
          confirmText={isDeleting ? "Deleting..." : "Delete"}
          confirmColor="bg-[#FF5151] text-white hover:bg-red-600 shadow-[0_0_10px_rgba(255,81,81,0.4)]"
          disabled={isDeleting}
        />

		<Modal
          isOpen={editModal.isOpen}
          title="Edit item"
          onClose={() => setEditModal({ isOpen: false, postId: null, title: '', content: '' })}
          onConfirm={handleEdit}
          confirmText={isEditing ? "Saving..." : "Save"}
          confirmColor="bg-[#47B960] text-white hover:bg-[#3da353] hover:shadow-[0_0_10px_rgba(71,185,96,0.4)]"
          disabled={!editModal.title.trim() || !editModal.content.trim() || isEditing}
        >
          <div className="flex flex-col mb-4">
            <label htmlFor="edit-title" className="text-[1rem] font-semibold mb-2 text-gray-300">Title</label>
            <input
              type="text"
              id="edit-title"
              value={editModal.title}
              onChange={(e) => setEditModal(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Hello world"
              className="glass-input"
            />
          </div>
          <div className="flex flex-col mb-6">
            <label htmlFor="edit-content" className="text-[1rem] font-semibold mb-2 text-gray-300">Content</label>
            <textarea
              id="edit-content"
              value={editModal.content}
              onChange={(e) => setEditModal(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Content here"
              rows={3}
              className="glass-input resize-none"
            />
          </div>
        </Modal>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../store/userSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { MdDeleteForever, MdEdit, MdLogout, MdImage, MdClose, MdComment, MdPsychology } from 'react-icons/md';
import { AiOutlineLike } from 'react-icons/ai';
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Post {
  id: number;
  username: string;
  created_datetime: string;
  title: string;
  content: string;
  image?: string;
}

const playToastSound = () => {
  try {
	const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (error) {
    console.error('Audio playback failed', error);
  }
};

const playCommentSound = () => {
  try {
	const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (error) {
    console.error('Audio playback failed', error);
  }
};

export function Main() {
  const username = useSelector((state: RootState) => state.user.username);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [localLikes, setLocalLikes] = useState<Record<number, number>>({});
  const [localImages, setLocalImages] = useState<Record<number, string>>({});
  const [localComments, setLocalComments] = useState<Record<number, { username: string, text: string }[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'recent' | 'alphabetical' | 'likes'>('recent');
  
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTheme, setAiTheme] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  const fetchPosts = useCallback(async (url = 'https://dev.codeleap.co.uk/careers/', isLoadMore = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const response = await axios.get(url);
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
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        if (nextUrl && !isLoadingRef.current) fetchPosts(nextUrl, true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [nextUrl, fetchPosts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://dev.codeleap.co.uk/careers/', {
        username,
        title,
        content,
      });

      if (mediaPreview && response.data?.id) {
        setLocalImages(prev => ({
          ...prev,
          [response.data.id]: mediaPreview
        }));
      }

      /*
      try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('title', title);
        formData.append('content', content);
        if (media) formData.append('image', media);

        await axios.post('api.required/careers/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err) {
        console.error('Media upload requires backend support', err);
      }
      */

      setTitle('');
      setContent('');
      removeMedia();
      fetchPosts('https://dev.codeleap.co.uk/careers/', false);

      playToastSound();
      toast.custom(() => (
        <div className="react-hot-toast__toast">
          <div className="safi-toast font-bold tracking-wide text-xl py-[1.75rem] px-[1.6875rem]">
            CodeLeap is fire! 🔥
          </div>
        </div>
      ), { position: 'top-right', duration: 3000 });

    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (deleteModal.postId !== null) {
      try {
        await axios.delete(`https://dev.codeleap.co.uk/careers/${deleteModal.postId}/`);
        setDeleteModal({ isOpen: false, postId: null });
        fetchPosts('https://dev.codeleap.co.uk/careers/', false);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleEdit = async () => {
    if (editModal.postId !== null) {
      try {
        await axios.patch(`https://dev.codeleap.co.uk/careers/${editModal.postId}/`, {
          title: editModal.title,
          content: editModal.content,
        });
        setEditModal({ isOpen: false, postId: null, title: '', content: '' });
        fetchPosts('https://dev.codeleap.co.uk/careers/', false);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

	const handleAiSuggestion = async () => {
		if (!aiTheme.trim()) return;
		setIsAiLoading(true);

		try {
		  const { data, error } = await supabase.functions.invoke('generate-post', {
			body: { theme: aiTheme }
		  });

		  if (error) throw error;

		  const result = JSON.parse(data.candidates[0].content.parts[0].text);
		  setTitle(result.title.substring(0, 40));
		  setContent(result.content.substring(0, 350));
		  setIsAiModalOpen(false);
		  setAiTheme('');
		} catch (error) {
		  console.error(error);
		} finally {
		  setIsAiLoading(false);
		}
	  };
  
  const handleLike = async (postId: number) => {
    setLocalLikes(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1
    }));

    /*
    try {
      await axios.patch(`api.required/careers/${postId}/`, {
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
    playCommentSound();

    /*
    try {
      await axios.post(`api.required/careers/${postId}/comments/`, {
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
            <header className="p-6 flex justify-between items-center border-b border-white/20">
              <h1 className="text-[2rem] font-extrabold tracking-wide text-outline bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary-tint)] bg-clip-text text-transparent">CodeLeap</h1>
              <button onClick={handleLogout} className="text-gray-300 hover:text-[var(--color-primary)] transition-colors" title="Logout">
                <MdLogout size={24} />
              </button>
            </header>

              <form onSubmit={handleCreate} className="p-4 sm:p-6">
              <h2 className="text-[1.375rem] font-extrabold mb-6 text-center text-balance mx-auto max-w-lg bg-gradient-to-r from-white to-[var(--color-primary)] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(12,242,244,0.4)] tracking-wide">
                Open your mind, let reality rewind, and leave your vibe in the comments below.
              </h2>

              <div className="flex flex-col mb-4">
                <label htmlFor="title" className="text-[1rem] mb-2 text-gray-300">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Open you mind"
                  className="glass-input"
                />
              </div>

              <div className="flex flex-col mb-6">
                <label htmlFor="content" className="text-[1rem] mb-2 text-gray-300">Content</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Let your heart speak on this box"
                  rows={3}
                  className="glass-input resize-none"
                />
              </div>

              <div className="flex flex-col gap-4">
                {mediaPreview && (
                  <div className="relative w-max mt-2">
                    <img src={mediaPreview} alt="Preview" className="h-32 rounded-lg object-cover border border-white/20" />
                    <button
                      type="button"
                      onClick={removeMedia}
                      className="absolute -top-2 -right-2 bg-[#FF5151] text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <MdClose size={16} />
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-white hover:brightness-125 transition-all"
                  >
                    <MdImage size={24} />
                    <span className="font-bold">Add Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="flex items-center gap-2 text-white hover:brightness-125 transition-all mr-auto ml-4"
                  >
                    <MdPsychology size={24} />
                    <span className="font-bold">AI Suggestion</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!title.trim() || !content.trim()}
                    className="btn-primary"
                  >
                    Create
                  </button>
                </div>
              </div>
            </form>
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
              <div key={post.id} className="glass-panel overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(12,242,244,0.15)] hover:-translate-y-1">
                <div className="bg-slate-800/60 text-white p-4 sm:p-6 flex justify-between items-center border-b border-white/10">
                  <h3 className="text-[1.375rem] font-bold break-words w-4/5 text-white">{post.title}</h3>
                  {post.username === username && (
                    <div className="flex gap-4">
                      <button onClick={() => setDeleteModal({ isOpen: true, postId: post.id })} className="text-gray-400 hover:text-[#FF5151] hover:scale-110 transition-all">
                        <MdDeleteForever size={28} />
                      </button>
                      <button onClick={() => setEditModal({ isOpen: true, postId: post.id, title: post.title, content: post.content })} className="text-gray-400 hover:text-white hover:scale-110 transition-all">
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
                  
                  {localImages[post.id] && (
                    <div className="mb-4 relative">
                      <img 
                        src={localImages[post.id]} 
                        alt="Post attachment" 
                        className="w-full max-h-[25rem] object-cover rounded-lg border border-white/10 shadow-inner" 
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 border-t border-white/10 pt-4">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1 text-gray-400 hover:text-[var(--color-primary)] transition-all hover:scale-105 active:scale-95"
                    >
                      <AiOutlineLike size={22} />
                      <span className="font-bold text-gray-200">{localLikes[post.id] || 0}</span>
                    </button>
                    <div className="flex items-center gap-1 text-gray-400">
                      <MdComment size={22} />
                      <span className="font-bold text-gray-200">{(localComments[post.id] || []).length}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex flex-col gap-2 mb-3 max-h-40 overflow-y-auto">
                      {(localComments[post.id] || []).map((c, i) => (
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
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        className="glass-input text-sm py-2 px-3 flex-grow"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="btn-primary py-2 px-4 text-sm whitespace-nowrap"
                      >
                        Post
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
            {isLoading && <p className="text-center text-[var(--color-primary)] animate-pulse">Loading...</p>}
          </div>
        </main>

        {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 px-4">
            <div className="glass-panel p-6 rounded-lg w-full max-w-[41.25rem] border border-white/30 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
              <h2 className="text-[1.375rem] font-bold mb-10 text-white">Are you sure you want to delete this item?</h2>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, postId: null })}
                  className="bg-transparent border border-gray-400 text-gray-200 font-bold py-2 px-8 rounded-[8px] hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-[#FF5151] text-white font-bold py-2 px-8 rounded-[8px] hover:bg-red-600 shadow-[0_0_10px_rgba(255,81,81,0.4)] transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {editModal.isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 px-4">
            <div className="glass-panel p-6 rounded-lg w-full max-w-[41.25rem] border border-white/30 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
              <h2 className="text-[1.375rem] font-bold mb-6 text-white">Edit item</h2>
              
              <div className="flex flex-col mb-4">
                <label htmlFor="title" className="text-[1rem] font-semibold mb-2 text-gray-300">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Hello world"
                  className="glass-input"
                />
              </div>

              <div className="flex flex-col mb-6">
                <label htmlFor="content" className="text-[1rem] font-semibold mb-2 text-gray-300">Content</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Content here"
                  rows={3}
                  className="glass-input resize-none"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setEditModal({ isOpen: false, postId: null, title: '', content: '' })}
                  className="bg-transparent border border-gray-400 text-gray-200 font-bold py-2 px-8 rounded-[8px] hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={!editModal.title.trim() || !editModal.content.trim()}
                  className="bg-[#47B960] text-white font-bold py-2 px-8 rounded-[8px] transition-all hover:bg-[#3da353] hover:shadow-[0_0_10px_rgba(71,185,96,0.4)] disabled:opacity-50 disabled:hover:shadow-none"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {isAiModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 px-4">
            <div className="glass-panel p-6 rounded-lg w-full max-w-[31.25rem] border border-white/30 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
              <h2 className="text-[1.375rem] font-bold mb-6 text-white">AI Post Generation</h2>
              
              <div className="flex flex-col mb-6">
                <label htmlFor="ai-theme" className="text-[1rem] mb-2 text-gray-300">Theme</label>
                <input
                  type="text"
                  id="ai-theme"
                  value={aiTheme}
                  onChange={(e) => setAiTheme(e.target.value)}
                  placeholder="Ex: Cooking a dinner; Riding a Horse"
                  className="glass-input"
                  disabled={isAiLoading}
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  disabled={isAiLoading}
                  className="bg-transparent border border-gray-400 text-gray-200 font-bold py-2 px-8 rounded-[8px] hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAiSuggestion}
                  disabled={!aiTheme.trim() || isAiLoading}
                  className="bg-[var(--color-primary)] text-neutral-900 font-bold py-2 px-8 rounded-[8px] transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {isAiLoading ? 'Loading...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}